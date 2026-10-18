'use client';
import {useState} from 'react';
import {getSupabaseClient} from '../../lib/supabase/client';
const categories=['Bota','Botín','Zapatilla','Mocasín','Flat','Sandalia','Huarache'] as const;
type Category=typeof categories[number];
type Fields={modelo:string;proveedor:string;precio_compra:string;precio_venta:string;categoria:Category|'',color:string;talla_3:string;talla_4:string;talla_5:string;talla_6:string};
const initial:Fields={modelo:'',proveedor:'',precio_compra:'',precio_venta:'',categoria:'',color:'',talla_3:'0',talla_4:'0',talla_5:'0',talla_6:'0'};
export default function CatalogForm({mode,onClose,onSaved}:{mode:'modelo'|'categoria';onClose:()=>void;onSaved:()=>void}){
 const [form,setForm]=useState<Fields>(initial),[categoryName,setCategoryName]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const set=(field:keyof Fields,value:string)=>setForm(x=>({...x,[field]:value}));
 const save=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setMessage('');
 if(mode==='categoria'){setMessage('La base de Menudeo actualmente permite solo siete categorías predefinidas. Para guardar nuevas categorías necesitamos ampliar su estructura de forma segura; no se ha modificado ninguna base de datos.');return}
 const priceBuy=Number(form.precio_compra),priceSell=Number(form.precio_venta);
 const sizes=[form.talla_3,form.talla_4,form.talla_5,form.talla_6].map(Number);
 if(!form.modelo.trim()||!form.color.trim()||!form.categoria||form.precio_compra.trim()===''||form.precio_venta.trim()===''||!Number.isFinite(priceBuy)||!Number.isFinite(priceSell)||priceBuy<0||priceSell<0||sizes.some(x=>!Number.isInteger(x)||x<0)){setMessage('Completa modelo, color, categoría, precios válidos y existencias enteras no negativas.');return}
 setBusy(true);
 try{const {error}=await getSupabaseClient().from('menudeo_inventario').insert({modelo:form.modelo.trim(),proveedor:form.proveedor.trim()||null,precio_compra:priceBuy,precio_venta:priceSell,categoria:form.categoria,color:form.color.trim(),talla_3:sizes[0],talla_4:sizes[1],talla_5:sizes[2],talla_6:sizes[3]});if(error)throw error;onSaved();onClose()}catch{setMessage('No se pudo guardar el modelo. Supabase Menudeo requiere permisos de escritura; no se registró ningún producto.')}finally{setBusy(false)}
 };
 return <div className="catalog-form-overlay" onClick={onClose}><section className="catalog-form-sheet" role="dialog" aria-modal="true" aria-labelledby="catalog-form-title" onClick={e=>e.stopPropagation()}><div className="catalog-form-header"><div><h2 id="catalog-form-title">{mode==='modelo'?'Agregar modelo':'Agregar categoría'}</h2><p>{mode==='modelo'?'Registra una variante con datos de compra, venta, proveedor y existencias.':'Organiza los modelos por categoría.'}</p></div><button type="button" aria-label="Cerrar formulario" onClick={onClose}>×</button></div><form onSubmit={save} className="catalog-form-body"><div className="catalog-form-scroll">{mode==='modelo'?<>
 <label>1. Modelo<input required placeholder="Ej. 519" value={form.modelo} onChange={e=>set('modelo',e.target.value)}/></label>
 <label>2. Proveedor<input placeholder="Nombre del proveedor" value={form.proveedor} onChange={e=>set('proveedor',e.target.value)}/></label>
 <label>3. Precio de compra<input required type="number" inputMode="decimal" min="0" step=".01" placeholder="$0.00" value={form.precio_compra} onChange={e=>set('precio_compra',e.target.value)}/></label>
 <label>4. Precio de venta<input required type="number" inputMode="decimal" min="0" step=".01" placeholder="$0.00" value={form.precio_venta} onChange={e=>set('precio_venta',e.target.value)}/></label>
 <label>5. Categoría<select required value={form.categoria} onChange={e=>set('categoria',e.target.value)}><option value="">Seleccionar categoría…</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
 <label>6. Etiqueta de colores<input required placeholder="Ej. Negro, latte, maquillaje" value={form.color} onChange={e=>set('color',e.target.value)}/></label>
 <fieldset><legend>7. Existencias por talla</legend><div className="catalog-form-sizes">{([3,4,5,6] as const).map(n=><label key={n}>Talla {n}<input required type="number" min="0" step="1" inputMode="numeric" value={form[`talla_${n}`]} onChange={e=>set(`talla_${n}`,e.target.value)}/></label>)}</div></fieldset>
 </>:<><label>Nombre de la categoría<input required value={categoryName} onChange={e=>setCategoryName(e.target.value)} placeholder="Ej. Tenis"/></label><p className="catalog-form-help">Las categorías actuales son: {categories.join(', ')}. Para agregar otras hay que habilitarlas en Supabase Menudeo.</p></>}
 {message&&<p className="catalog-form-error" role="alert">{message}</p>}</div><div className="catalog-form-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={busy}>{busy?'Guardando…':mode==='modelo'?'Guardar modelo':'Agregar categoría'}</button></div></form></section></div>
}
