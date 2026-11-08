-- Carola Menudeo: permite editar gastos.
-- Sin abonos: se pueden cambiar concepto, monto y modo de pago. El cargo anterior
-- se devuelve a su cuenta y el nuevo se aplica con validación de saldo.
-- Con abonos: se pueden cambiar concepto y monto (no por debajo de lo abonado); el modo de pago queda fijo.
create or replace function public.menudeo_gasto_action(p_token text, p_action text, p_data jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_id bigint; v_gasto record; v_total numeric; v_amount numeric; v_metodo text;
  v_account text; v_saldo numeric; v_concepto text; v_pendiente numeric; v_nabonos int; v_pagado numeric;
begin
  if not exists(select 1 from public.menudeo_pin_sessions where token_hash=encode(digest(coalesce(p_token,''),'sha256'),'hex') and expires_at>now()) then
    raise exception 'Sesión caducada';
  end if;

  if p_action='list' then
    return coalesce((
      select jsonb_agg(to_jsonb(g) || jsonb_build_object('abonos',(select coalesce(jsonb_agg(to_jsonb(a) order by a.id),'[]'::jsonb) from public.menudeo_gasto_abonos a where a.gasto_id=g.id)) order by g.id desc)
      from public.menudeo_gastos g
    ),'[]'::jsonb);
  end if;

  if p_action='create' then
    v_concepto:=trim(coalesce(p_data->>'concepto',''));
    v_metodo:=p_data->>'metodo';
    v_total:=(p_data->>'monto')::numeric;
    if v_concepto='' or length(v_concepto)>120 then raise exception 'Escribe el concepto del gasto'; end if;
    if v_metodo not in ('Efectivo','Tarjeta','Deuda') then raise exception 'Modo de pago inválido'; end if;
    if v_total is null or v_total<=0 or v_total<>round(v_total,2) then raise exception 'Monto inválido'; end if;

    if v_metodo='Deuda' then
      insert into public.menudeo_gastos(concepto,total,metodo,pagado) values(v_concepto,v_total,v_metodo,0) returning id into v_id;
      return jsonb_build_object('id',v_id);
    end if;

    v_account:=case when v_metodo='Efectivo' then 'efectivo' else 'bbva' end;
    insert into public.menudeo_cuentas(cuenta,saldo) values(v_account,0) on conflict(cuenta) do nothing;
    select saldo into v_saldo from public.menudeo_cuentas where cuenta=v_account for update;
    if v_saldo<v_total then raise exception 'Saldo insuficiente en %. Disponible: %', case when v_account='bbva' then 'Banco' else 'Efectivo' end, v_saldo; end if;

    insert into public.menudeo_gastos(concepto,total,metodo,pagado) values(v_concepto,v_total,v_metodo,v_total) returning id into v_id;
    update public.menudeo_cuentas set saldo=saldo-v_total,updated_at=now() where cuenta=v_account;
    insert into public.menudeo_finanzas_movimientos(cuenta,monto,concepto) values(v_account,-v_total,'Gasto Menudeo #'||v_id||': '||v_concepto);
    return jsonb_build_object('id',v_id);
  end if;

  if p_action='edit' then
    v_id:=(p_data->>'id')::bigint;
    select * into v_gasto from public.menudeo_gastos where id=v_id for update;
    if not found then raise exception 'Gasto inexistente'; end if;
    v_concepto:=trim(coalesce(p_data->>'concepto',''));
    v_metodo:=p_data->>'metodo';
    v_total:=(p_data->>'monto')::numeric;
    if v_concepto='' or length(v_concepto)>120 then raise exception 'Escribe el concepto del gasto'; end if;
    if v_metodo not in ('Efectivo','Tarjeta','Deuda') then raise exception 'Modo de pago inválido'; end if;
    if v_total is null or v_total<=0 or v_total<>round(v_total,2) then raise exception 'Monto inválido'; end if;

    select count(*) into v_nabonos from public.menudeo_gasto_abonos where gasto_id=v_id;

    if v_nabonos>0 then
      -- Con abonos: el modo de pago queda fijo, pero el monto sí puede cambiar
      -- (el saldo pendiente se recalcula como total - pagado).
      if v_metodo<>v_gasto.metodo then
        raise exception 'Este gasto ya tiene abonos: no se puede cambiar el modo de pago';
      end if;
      if v_total<v_gasto.pagado then
        raise exception 'El nuevo monto no puede ser menor a lo ya abonado: %', v_gasto.pagado;
      end if;
      update public.menudeo_gastos set concepto=v_concepto,total=v_total where id=v_id;
    else
      -- 1) devolver el cargo anterior a su cuenta, si lo hubo
      if v_gasto.metodo<>'Deuda' then
        v_account:=case when v_gasto.metodo='Efectivo' then 'efectivo' else 'bbva' end;
        delete from public.menudeo_finanzas_movimientos where cuenta=v_account and concepto like 'Gasto Menudeo #'||v_id||': %';
        update public.menudeo_cuentas set saldo=saldo+v_gasto.total,updated_at=now() where cuenta=v_account;
      end if;
      -- 2) aplicar el nuevo cargo
      if v_metodo='Deuda' then
        v_pagado:=0;
      else
        v_account:=case when v_metodo='Efectivo' then 'efectivo' else 'bbva' end;
        insert into public.menudeo_cuentas(cuenta,saldo) values(v_account,0) on conflict(cuenta) do nothing;
        select saldo into v_saldo from public.menudeo_cuentas where cuenta=v_account for update;
        if v_saldo<v_total then raise exception 'Saldo insuficiente en %. Disponible: %', case when v_account='bbva' then 'Banco' else 'Efectivo' end, v_saldo; end if;
        update public.menudeo_cuentas set saldo=saldo-v_total,updated_at=now() where cuenta=v_account;
        insert into public.menudeo_finanzas_movimientos(cuenta,monto,concepto) values(v_account,-v_total,'Gasto Menudeo #'||v_id||': '||v_concepto);
        v_pagado:=v_total;
      end if;
      update public.menudeo_gastos set concepto=v_concepto,total=v_total,metodo=v_metodo,pagado=v_pagado where id=v_id;
    end if;

    -- mantener el concepto actualizado en los movimientos del ledger
    update public.menudeo_finanzas_movimientos
      set concepto=substring(concepto from 1 for position(': ' in concepto)+1)||v_concepto
      where concepto like 'Gasto Menudeo #'||v_id||': %' or concepto like 'Gasto Menudeo abono #'||v_id||': %';
    return jsonb_build_object('id',v_id);
  end if;

  if p_action='pay' then
    v_id:=(p_data->>'id')::bigint;
    v_amount:=(p_data->>'monto')::numeric;
    v_metodo:=p_data->>'metodo';
    select * into v_gasto from public.menudeo_gastos where id=v_id for update;
    if not found then raise exception 'Gasto inexistente'; end if;
    if v_gasto.metodo<>'Deuda' or v_gasto.pagado>=v_gasto.total then raise exception 'Este gasto no tiene saldo pendiente'; end if;
    v_pendiente:=v_gasto.total-v_gasto.pagado;
    if v_metodo not in ('Efectivo','Tarjeta') then raise exception 'Modo de pago inválido'; end if;
    if v_amount is null or v_amount<=0 or v_amount<>round(v_amount,2) or v_amount>v_pendiente then raise exception 'Abono inválido o mayor al saldo pendiente'; end if;

    v_account:=case when v_metodo='Efectivo' then 'efectivo' else 'bbva' end;
    insert into public.menudeo_cuentas(cuenta,saldo) values(v_account,0) on conflict(cuenta) do nothing;
    select saldo into v_saldo from public.menudeo_cuentas where cuenta=v_account for update;
    if v_saldo<v_amount then raise exception 'Saldo insuficiente en %. Disponible: %', case when v_account='bbva' then 'Banco' else 'Efectivo' end, v_saldo; end if;

    update public.menudeo_cuentas set saldo=saldo-v_amount,updated_at=now() where cuenta=v_account;
    insert into public.menudeo_finanzas_movimientos(cuenta,monto,concepto) values(v_account,-v_amount,'Gasto Menudeo abono #'||v_id||': '||v_gasto.concepto);
    insert into public.menudeo_gasto_abonos(gasto_id,monto,metodo) values(v_id,v_amount,v_metodo);
    update public.menudeo_gastos set pagado=pagado+v_amount where id=v_id;
    return jsonb_build_object('id',v_id,'saldo',v_pendiente-v_amount);
  end if;

  raise exception 'Acción inválida';
end
$function$;
