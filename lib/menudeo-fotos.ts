/** Sube fotos de un modelo/color de Menudeo al catálogo público (bucket de mayoreo). */
export async function subirFotosMenudeo(params: {
  token: string;
  modelo: string;
  color: string;
  categoria?: string;
  proveedor?: string;
  precio_compra?: string | number;
  precio_venta?: string | number;
  files: File[];
}): Promise<void> {
  const fd = new FormData();
  fd.append('token', params.token);
  fd.append('modelo', params.modelo);
  fd.append('color', params.color);
  fd.append('categoria', params.categoria ?? '');
  fd.append('proveedor', params.proveedor ?? '');
  fd.append('precio_compra', String(params.precio_compra ?? ''));
  fd.append('precio_venta', String(params.precio_venta ?? ''));
  params.files.forEach(f => fd.append('fotos', f));
  const res = await fetch('/api/menudeo/fotos', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'No se pudieron guardar las fotos.');
}
