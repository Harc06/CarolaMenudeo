'use client';
import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { getAdminToken } from '../lib/admin-session';
import NoteSheet, { type SaleRecord, type NoteKind } from './components/NoteSheet';
import VirtualCatalog from './components/VirtualCatalog';

type Tab = 'inicio' | 'ventas' | 'compras' | 'inventario';
type Extra = 'Catálogo virtual' | 'Deudas' | 'Cotizaciones' | 'Cuentas' | 'Clientes' | 'Proveedores' | 'Empleados';
const shortcuts: {name:Extra; symbol:string}[] = [{name:'Catálogo virtual',symbol:'🛍️'},{name:'Deudas',symbol:'💸'},{name:'Cotizaciones',symbol:'📝'},{name:'Cuentas',symbol:'🏦'},{name:'Clientes',symbol:'👤'},{name:'Proveedores',symbol:'🚚'},{name:'Empleados',symbol:'👥'}];
const tabs: {id:Tab; label:string}[] = [
 {id:'inicio',label:'Inicio'},
 {id:'ventas',label:'Ventas'},
 {id:'compras',label:'Compras'},
 {id:'inventario',label:'Inventario'}
];
function TabIcon({id}:{id:Tab}){
 const common={width:23,height:23,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
 if(id==='inicio')return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>;
 if(id==='ventas')return <svg {...common}><path d="M4 5h16v15H4zM8 9h8M8 13h5M8 17h3"/><path d="m15 16 2 2 4-4"/></svg>;
 if(id==='compras')return <svg {...common}><path d="M5 8h14l1 13H4L5 8ZM9 9V6a3 3 0 0 1 6 0v3"/><path d="M9 15h6"/></svg>;
 return <svg {...common}><path d="M3 8h18v13H3zM3 8l3-5h12l3 5M9 12h6v4H9z"/></svg>;
}
export default function Home(){
 const [tab,setTab]=useState<Tab>('inicio');
 const [extra,setExtra]=useState<Extra|null>(null);
 const [saleOptionsOpen,setSaleOptionsOpen]=useState(false);
 const [saleFlow,setSaleFlow]=useState<NoteKind|null>(null);
 const [sales,setSales]=useState<SaleRecord[]>([]);
 const [accounts,setAccounts]=useState<{cuenta:string;saldo:number}[]>([]);
 const [movements,setMovements]=useState<{id:number;fecha:string;cuenta:string;monto:number;concepto:string}[]>([]);
 const [accountsError,setAccountsError]=useState('');
 const [editingAccount,setEditingAccount]=useState<'efectivo'|'bbva'|null>(null);
 const [newBalance,setNewBalance]=useState('');
 const [adjustBusy,setAdjustBusy]=useState(false);
 const saveBalance=async()=>{if(!editingAccount||adjustBusy)return;const value=Number(newBalance);if(!newBalance.trim()||!Number.isFinite(value)||value<0){setAccountsError('Ingresa un saldo válido, mayor o igual a cero.');return;}const token=getAdminToken();if(!token){setAccountsError('Ingresa tu PIN desde Inventario.');return;}setAdjustBusy(true);const {error}=await getSupabaseClient().rpc('menudeo_adjust_account',{p_token:token,p_account:editingAccount,p_balance:value});setAdjustBusy(false);if(error){setAccountsError(error.message);return;}setEditingAccount(null);await reloadAccounts();};

 const money=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n);
 const reloadAccounts=useCallback(async()=>{const token=getAdminToken();if(!token){setAccountsError('Desbloquea Inventario con tu PIN para ver las cuentas.');return;}const {data,error}=await getSupabaseClient().rpc('menudeo_pin_sales',{p_token:token,p_action:'accounts'});if(error){setAccountsError(error.message);return;}const result=data as {cuentas:{cuenta:string;saldo:number}[];movimientos:{id:number;fecha:string;cuenta:string;monto:number;concepto:string}[]};setAccounts(result.cuentas||[]);setMovements(result.movimientos||[]);const ledger=await getSupabaseClient().rpc('menudeo_account_ledger',{p_token:token});if(ledger.error){setAccountsError(ledger.error.message);return;}setMovements((ledger.data||[]) as typeof movements);setAccountsError('')},[]);

 const [editSale,setEditSale]=useState<SaleRecord|null>(null),[saleError,setSaleError]=useState(''),[saleBusy,setSaleBusy]=useState(false);
 const reloadSales=useCallback(async()=>{const token=getAdminToken();if(!token){setSaleError('Desbloquea Inventario con tu PIN para consultar las ventas.');return;}const {data,error}=await getSupabaseClient().rpc('menudeo_pin_sales',{p_token:token,p_action:'list'});if(error){setSaleError(error.message);return;}setSaleError('');setSales(((data||[]) as Array<{id:string;cliente:string;telefono:string;fecha:string;detalle:string;metodo_pago:'Efectivo'|'Tarjeta';lineas:SaleRecord['lineas'];total:number}>).map(x=>({id:x.id,cliente:x.cliente,telefono:x.telefono,fecha:x.fecha,detalle:x.detalle,metodoPago:x.metodo_pago,lineas:x.lineas,total:Number(x.total),estado:'Pendiente de sincronizar'})));},[]);
 const actSale=async(s:SaleRecord,action:'delete'|'refund')=>{if(saleBusy)return;if(!window.confirm(action==='delete'?'¿Eliminar esta venta y devolver sus productos al inventario?':'¿Registrar la devolución y regresar sus productos al inventario? También se revertirá el movimiento de dinero de la cuenta correspondiente.'))return;const token=getAdminToken();if(!token){setSaleError('Ingresa el PIN desde Inventario.');return;}setSaleBusy(true);const {error}=await getSupabaseClient().rpc('menudeo_pin_sales',{p_token:token,p_action:action,p_id:s.id});setSaleBusy(false);if(error){setSaleError(error.message);return;}await reloadSales();await reloadAccounts()};
 useEffect(()=>{if(tab==='ventas'&&!extra)void reloadSales();if(extra==='Cuentas'||(tab==='inicio'&&!extra))void reloadAccounts()},[tab,extra,reloadSales,reloadAccounts]);

 const go=(next:Tab)=>{setTab(next);setExtra(null);setSaleOptionsOpen(false);setSaleFlow(null);window.scrollTo({top:0,behavior:'smooth'})};
 const chooseSale=(option:NoteKind)=>{setSaleOptionsOpen(false);setSaleFlow(option)};
 const active=tabs.find(t=>t.id===tab)!;
 return <main className="app-shell">
  <div className="app-body">
   <header className="app-header">
    <div className="identity"><div className="identity-mark">C</div><div><span className="identity-name">Carola</span><span className="identity-sub">Menudeo</span></div></div>
    <span className="header-pill">Administración</span>
   </header>
   {extra==='Catálogo virtual'?<VirtualCatalog/>:extra==='Cuentas'?<section className="section-screen accounts-screen"><div className="eyebrow">CAROLA MENUDEO</div><h1>Cuentas</h1><p>Ingresos de ventas, ajustes y devoluciones registrados en Supabase.</p>{accountsError&&<p className="note-error" role="alert">{accountsError}</p>}<div className="account-cards">{([{key:'efectivo',name:'Efectivo',icon:'💵'},{key:'bbva',name:'Banco',icon:'🏦'}] as const).map(a=><article className="account-card" key={a.key}><span className="account-icon">{a.icon}</span><div className="account-title"><h2>{a.name}</h2><button type="button" className="account-edit" aria-label={'Editar saldo de '+a.name} onClick={()=>{setEditingAccount(a.key);setNewBalance(String(accounts.find(x=>x.cuenta===a.key)?.saldo??0));setAccountsError('')}}>✎ Editar</button></div><strong>{money(Number(accounts.find(x=>x.cuenta===a.key)?.saldo||0))}</strong><small>{a.key==='bbva'?'Ventas con tarjeta':'Ventas en efectivo'}</small></article>)}</div>{editingAccount&&<div className="account-edit-panel" role="dialog" aria-label="Ajustar saldo"><h2>Ajustar saldo de {editingAccount==='bbva'?'Banco':'Efectivo'}</h2><p>Escribe el saldo real. La diferencia se registrará automáticamente con la fecha actual.</p><label>Nuevo saldo ($)<input type="number" min="0" step="0.01" value={newBalance} onChange={e=>setNewBalance(e.target.value)}/></label><div className="account-edit-actions"><button type="button" onClick={()=>setEditingAccount(null)}>Cancelar</button><button type="button" disabled={adjustBusy} onClick={()=>void saveBalance()}>{adjustBusy?'Guardando…':'Guardar ajuste'}</button></div></div>}<h2>Movimientos recientes</h2>{movements.length===0?<p>Aún no hay movimientos de ventas.</p>:<div className="account-movements">{movements.map(m=><article key={m.id}><div><strong>{m.concepto.split(':')[0]}</strong><small>{m.fecha} · {m.cuenta==='bbva'?'Banco':'Efectivo'}</small></div><strong className={m.monto<0?'negative':'positive'}>{m.monto>0?'+':''}{money(Number(m.monto))}</strong></article>)}</div>}</section>:tab==='ventas'&&!extra?<section className="section-screen sales-register"><div className="eyebrow">CAROLA MENUDEO</div><h1>Registro de ventas</h1><p>Ventas registradas en Supabase. El inventario se descuenta al vender y se restaura al eliminar o devolver.</p><button type="button" className="sale-action" onClick={()=>{setEditSale(null);chooseSale('Realizar venta')}}>+ Realizar venta</button>{saleError&&<p role="alert" className="note-error">{saleError}</p>}{sales.length===0?<div className="section-placeholder"><h2>Sin ventas registradas</h2><p>Al guardar una venta aparecerá aquí.</p></div>:<div className="sales-list">{sales.map(s=><article className="sales-entry" key={s.id}><div className="sales-entry-head"><div><strong>{s.cliente}</strong><small>{s.fecha} · {s.metodoPago}</small></div><strong>{new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(s.total)}</strong></div><div className="sales-entry-lines">{s.lineas.map((l,i)=><p key={i}>{l.cantidad} × Modelo {l.modelo} · {l.color} · Talla {l.talla} · {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(l.precio)} c/u</p>)}</div>{s.detalle&&<p><b>Detalle:</b> {s.detalle}</p>}<div className="sale-record-actions"><button type="button" onClick={()=>{setEditSale(s);setSaleFlow('Realizar venta')}}>Editar</button><button type="button" disabled={saleBusy} onClick={()=>void actSale(s,'delete')}>Eliminar</button><button type="button" disabled={saleBusy} onClick={()=>void actSale(s,'refund')}>Devolución</button><button type="button" onClick={()=>{setEditSale(s);setSaleFlow('Realizar venta')}}>Cambio de producto</button></div></article>)}</div>}</section>:tab==='inicio'&&!extra?<section className="home-screen">
     <section className="today-card">
       <h2>Tu negocio hoy</h2>
       <div className="today-top"><div><strong className="today-amount">—</strong><span>Ventas hoy</span></div><div className="today-compare">vs ayer <span>Sin datos</span></div></div>
       <div className="today-bottom"><div><strong>—</strong><span>Balance</span></div><div className="expense"><strong>—</strong><span>Gastos hoy</span></div></div>
       <button className="sale-action" onClick={()=>setSaleOptionsOpen(true)}><TabIcon id="ventas"/> Registrar venta</button>
       <p className="today-footnote">Los importes aparecerán cuando configuremos el registro de ventas y gastos.</p>
     </section>
     <h2 className="section-heading">Descubre todo lo que puedes hacer</h2>
     <div className="shortcut-strip" aria-label="Accesos rápidos">{shortcuts.map(x=><button type="button" key={x.name} className="shortcut-card" onClick={()=>{setExtra(x.name);window.scrollTo({top:0,behavior:'smooth'})}}><span className="shortcut-emoji" aria-hidden="true">{x.symbol}</span><span>{x.name}</span></button>)}</div>
     <div className="scroll-hint">Desliza para ver más <span>→</span></div>
     <section className="insights"><h2>Cuentas</h2><p>Dinero registrado en tus cuentas</p><div className="insight-grid"><div><span>Efectivo</span><strong>{money(Number(accounts.find(x=>x.cuenta==='efectivo')?.saldo||0))}</strong></div><div><span>Banco</span><strong>{money(Number(accounts.find(x=>x.cuenta==='bbva')?.saldo||0))}</strong></div></div><button onClick={()=>{setExtra('Cuentas');window.scrollTo({top:0,behavior:'smooth'})}}>Ver todo →</button></section>
   </section>:<section className="section-screen" key={extra||tab}>
      <div className="eyebrow">CAROLA MENUDEO</div><h1>{saleFlow||extra||active.label}</h1>
      <div className="section-placeholder"><div className="placeholder-icon"><TabIcon id={tab}/></div><h2>{saleFlow||`Apartado de ${(extra||active.label).toLowerCase()}`}</h2><p>{saleFlow?'La opción ya está preparada. Aquí configuraremos el formulario y los datos de esta operación.':`Este espacio ya está creado. Aquí agregaremos las funciones que definamos para ${(extra||active.label).toLowerCase()}.`}</p><span className="pending-label">Pendiente de configurar</span></div>
   </section>}
  </div>
  {saleOptionsOpen&&<div className="sale-modal-overlay" onClick={()=>setSaleOptionsOpen(false)}><section className="sale-sheet" role="dialog" aria-modal="true" aria-labelledby="sale-sheet-title" onClick={e=>e.stopPropagation()}><div className="sale-sheet-head"><h2 id="sale-sheet-title">Nueva venta</h2><button type="button" className="sale-sheet-close" aria-label="Cerrar opciones de venta" onClick={()=>setSaleOptionsOpen(false)}>×</button></div><p>Selecciona qué quieres hacer.</p><div className="sale-sheet-options"><button type="button" onClick={()=>chooseSale('Realizar venta')}><span className="sale-option-emoji">🛍️</span><span className="sale-option-copy"><strong>Realizar venta</strong><small>Registra una venta de productos.</small></span><span className="sale-option-arrow">›</span></button><button type="button" onClick={()=>chooseSale('Cotización libre')}><span className="sale-option-emoji">📝</span><span className="sale-option-copy"><strong>Cotización libre</strong><small>Prepara una cotización sin seleccionar productos del inventario.</small></span><span className="sale-option-arrow">›</span></button></div></section></div>}
  {saleFlow&&<NoteSheet kind={saleFlow} initialSale={editSale} onClose={()=>{setSaleFlow(null);setEditSale(null)}} onSale={()=>{setTab('ventas');setExtra(null);void reloadSales();void reloadAccounts()}}/>}
  <nav className="bottom-nav" aria-label="Navegación principal">{tabs.map(t=><button key={t.id} type="button" aria-current={tab===t.id?'page':undefined} className={'nav-tab'+(tab===t.id?' selected':'')} onClick={()=>go(t.id)}><TabIcon id={t.id}/><span>{t.label}</span></button>)}</nav>
 </main>;
}
