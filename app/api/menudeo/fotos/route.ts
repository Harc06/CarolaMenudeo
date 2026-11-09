import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/*
 * Sube fotos de modelos de Menudeo al bucket "Productos" de mayoreo y las asocia
 * a modelo/color en las tablas de mayoreo, para que aparezcan en calzadocarola.com/menudeo.
 * Requiere MAYOREO_SERVICE_ROLE_KEY (solo servidor, nunca en el navegador).
 * Solo escribe modelos, variantes e imagenes: NO toca inventario_mayoreo.
 */
export const dynamic = 'force-dynamic';

const MENUDEO_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const MENUDEO_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const MAYOREO_URL = 'https://gfkjdpuhbxfwajbkzfap.supabase.co';
const MAX_FILES = 6;
const MAX_BYTES = 5 * 1024 * 1024;

// Categorías de Menudeo -> nombre equivalente en el catálogo de mayoreo
const CATEGORY_MAP: Record<string, string> = {
  'Bota': 'Bota', 'Botín': 'Botín', 'Zapatilla': 'Zapatilla', 'Mocasín': 'Mocasines',
  'Flat': 'Flats', 'Sandalia': 'Sandalia', 'Huarache': 'Huarache',
};

const norm = (s: string | null | undefined) => String(s ?? '').trim().toLocaleLowerCase('es');
const safePath = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'sin-nombre';
const extOf = (file: File) => (file.name.split('.').pop() || (file.type === 'image/png' ? 'png' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';

export async function POST(req: Request) {
  try {
    if (!MENUDEO_URL || !MENUDEO_KEY) return NextResponse.json({ error: 'Configuración de Menudeo incompleta.' }, { status: 503 });
    const serviceKey = process.env.MAYOREO_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: 'Falta configurar la subida de fotos en el servidor.' }, { status: 503 });

    const form = await req.formData();
    const token = String(form.get('token') || '');
    const modelo = String(form.get('modelo') || '').trim();
    const color = String(form.get('color') || '').trim();
    const categoria = String(form.get('categoria') || '');
    const proveedor = String(form.get('proveedor') || '').trim();
    const precioCompra = form.get('precio_compra') === null || form.get('precio_compra') === '' ? null : Number(form.get('precio_compra'));
    const precioVenta = form.get('precio_venta') === null || form.get('precio_venta') === '' ? null : Number(form.get('precio_venta'));
    const files = form.getAll('fotos').filter((f): f is File => f instanceof File && f.size > 0);

    if (!token) return NextResponse.json({ error: 'Inicia sesión para subir fotos.' }, { status: 401 });
    if (!modelo || !color) return NextResponse.json({ error: 'Falta el modelo o el color.' }, { status: 400 });
    if (!files.length || files.length > MAX_FILES) return NextResponse.json({ error: `Sube entre 1 y ${MAX_FILES} fotos.` }, { status: 400 });
    for (const f of files) {
      if (!f.type.startsWith('image/')) return NextResponse.json({ error: 'Solo se aceptan imágenes.' }, { status: 400 });
      if (f.size > MAX_BYTES) return NextResponse.json({ error: 'Cada foto debe pesar máximo 5 MB.' }, { status: 400 });
    }

    // 1) Validar la sesión PIN de Menudeo (la RPC falla si el token caducó)
    const menudeo = createClient(MENUDEO_URL, MENUDEO_KEY, { auth: { persistSession: false } });
    const { error: authError } = await menudeo.rpc('menudeo_pin_list_models', { p_token: token });
    if (authError) return NextResponse.json({ error: 'La sesión caducó. Vuelve a ingresar tu PIN.' }, { status: 401 });

    // 2) Mayoreo con llave de servicio
    const w = createClient(MAYOREO_URL, serviceKey, { auth: { persistSession: false } });

    const { data: modelos, error: mErr } = await w.from('modelos').select('id,modelo,categoria');
    if (mErr) throw new Error(mErr.message);
    let modeloRow = (modelos || []).find(x => norm(x.modelo) === norm(modelo));
    if (!modeloRow) {
      const categoriaMayoreo = CATEGORY_MAP[categoria];
      if (!categoriaMayoreo) return NextResponse.json({ error: 'Selecciona una categoría válida.' }, { status: 400 });
      const { data: nuevo, error } = await w.from('modelos').insert({ modelo, categoria: categoriaMayoreo, activo: true }).select('id,modelo,categoria').single();
      if (error) throw new Error(error.message);
      modeloRow = nuevo;
    }

    const { data: proveedores, error: pErr } = await w.from('proveedores').select('id,nombre').eq('activo', true);
    if (pErr) throw new Error(pErr.message);
    const proveedorRow = (proveedores || []).find(x => norm(x.nombre) === norm(proveedor));

    const { data: variantes, error: vErr } = await w.from('variantes').select('id,color').eq('modelo_id', modeloRow.id);
    if (vErr) throw new Error(vErr.message);
    let variante = (variantes || []).find(x => norm(x.color) === norm(color));
    if (!variante) {
      const { data: nueva, error } = await w.from('variantes').insert({
        modelo_id: modeloRow.id, color, activo: true,
        proveedor_id: proveedorRow?.id ?? null,
        precio_compra: Number.isFinite(precioCompra as number) ? precioCompra : null,
        precio_venta: Number.isFinite(precioVenta as number) ? precioVenta : null,
      }).select('id,color').single();
      if (error) throw new Error(error.message);
      variante = nueva;
    }

    const { data: ultimas, error: oErr } = await w.from('imagenes').select('orden').eq('variante_id', variante.id).order('orden', { ascending: false }).limit(1);
    if (oErr) throw new Error(oErr.message);
    let orden = Number(ultimas?.[0]?.orden || 0) + 1;

    const subidas: string[] = [];
    for (const file of files) {
      const path = `${safePath(modeloRow.modelo)}/${safePath(variante.color)}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extOf(file)}`;
      const { error: upErr } = await w.storage.from('Productos').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (upErr) throw new Error('No se pudo subir la foto: ' + upErr.message);
      const { data: pub } = w.storage.from('Productos').getPublicUrl(path);
      const { error: insErr } = await w.from('imagenes').insert({ variante_id: variante.id, url: pub.publicUrl, orden });
      if (insErr) {
        await w.storage.from('Productos').remove([path]);
        throw new Error('La foto se subió pero no se pudo registrar: ' + insErr.message);
      }
      subidas.push(pub.publicUrl);
      orden++;
    }

    return NextResponse.json({ ok: true, modelo: modeloRow.modelo, color: variante.color, fotos: subidas.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'No se pudieron guardar las fotos.' }, { status: 500 });
  }
}
