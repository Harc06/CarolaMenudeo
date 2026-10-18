'use client';
import {useEffect,useState} from 'react';
import {getSupabaseClient} from '../../lib/supabase/client';
import BottomSheet from './BottomSheet';
const categories=['Bota','Botín','Zapatilla','Mocasín','Flat','Sandalia','Huarache'] as const;
type Category=typeof categories[number];
type Fields={modelo:string;proveedor:string;precio_compra:string;precio_venta:string;categoria:Category|'',color:string;talla_3:string;talla_4:string;talla_5:string;talla_6:string};
const initial:Fields={modelo:'',proveedor:'',precio_compra:'',precio_venta:'',categoria:'',color:'',talla_3:'0',talla_4:'0',talla_5:'0',talla_6:'0'};
export default function CatalogForm({mode,onClose,onSaved}:{mode:'modelo'|'categoria';onClose:()=>void;onSaved:()=>void}){
 const [pin,setPin]=useState(''),[token,setToken]=useState(''),[pinError,setPinError]=useState(''),[loggingIn,setLoggingIn]=useState(false);
 useEffect(()=>{const saved=sessionStorage.getItem('menudeo_admin_token');if(saved)setToken(saved)},[]);
 const [form,setForm]=useState<Fields>(initial),[categoryName,setCategoryName]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const set=(field:keyof Fields,value:string)=>setForm(x=>({...x,[field]:value}));
 const unlock=async()=>{setPinError('');setLoggingIn(true);try{const {data,error}=await getSupabaseClient().rpc('menudeo_pin_login',{p_pin:pin});if(error)throw error;if(!data){setPinError('PIN incorrecto o acceso temporalmente bloqueado.');return}setToken(String(data));sessionStorage.setItem('menudeo_admin_token',String(data));setPin('')}catch{setPinError('No fue posible validar el PIN con Supabase Menudeo.')}finally{setLoggingIn(false)}};
 const save=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setMessage('');
 if(mode==='categoria'){setMessage('La base de Menudeo actualmente permite solo siete categorías predefinidas. Para guardar nuevas categorías necesitamos ampliar su estructura de forma segura; no se ha modificado ninguna base de datos.');return}
 const priceBuy=Number(form.precio_compra),priceSell=Number(form.precio_venta);
 const sizes=[form.talla_3,form.talla_4,form.talla_5,form.talla_6].map(Number);
 if(!form.modelo.trim()||!form.color.trim()||!form.categoria||form.precio_compra.trim()===''||form.precio_venta.trim()===''||!Number.isFinite(priceBuy)||!Number.isFinite(priceSell)||priceBuy<0||priceSell<0||sizes.some(x=>!Number.isInteger(x)||x<0)){setMessage('Completa modelo, color, categoría, precios válidos y existencias enteras no negativas.');return}
 setBusy(true);
 try{const {error}=await getSupabaseClient().rpc('menudeo_pin_add_model',{p_token:token,p_modelo:form.modelo.trim(),p_proveedor:form.proveedor.trim()||null,p_precio_compra:priceBuy,p_precio_venta:priceSell,p_categoria:form.categoria,p_color:form.color.trim(),p_talla_3:sizes[0],p_talla_4:sizes[1],p_talla_5:sizes[2],p_talla_6:sizes[3]});if(error)throw error;onSaved();onClose()}catch(e){const detail=e&&typeof e==='object'&&'code' in e?String(e.code):'';setMessage(detail==='42501'||detail==='PGRST301'?'Supabase bloqueó el guardado por permisos (RLS). No se modificó el inventario. Se necesita un acceso administrativo seguro; no se habilitarán escrituras públicas.':detail==='23514'?'Los datos no cumplen una restricción de la base de Menudeo. Revisa categoría y existencias.':detail==='23505'?'Esta variante ya existe en el inventario.':'No se pudo guardar el modelo en Supabase Menudeo. Comprueba la conexión y los permisos.')}finally{setBusy(false)}
 };
 return <BottomSheet title={mode==='modelo'?'Agregar modelo':'Agregar categoría'} description={mode==='modelo'?'Registra una variante con datos de compra, venta, proveedor y existencias.':'Organiza los modelos por categoría.'} onClose={onClose} className="catalog-form-sheet">{!token?<div className="catalog-pin-panel"><h3>Acceso administrativo</h3><p>Ingresa tu PIN para poder guardar modelos en el inventario de Menudeo.</p><form onSubmit={e=>{e.preventDefault();void unlock()}}><input type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} minLength={4} required autoComplete="off" aria-label="PIN administrativo" placeholder="PIN de 4 dígitos" value={pin} onChange={e=>setPin(e.target.value.replace(/[^0-9]/g,''))}/><button type="submit" disabled={loggingIn||pin.length!==4}>{loggingIn?'Validando…':'Desbloquear'}</button></form>{pinError&&<p role="alert" className="catalog-form-error">{pinError}</p>}</div>:<form onSubmit={save} className="catalog-form-body"><div className="catalog-form-scroll">{mode==='modelo'?<>
 <label>1. Modelo<input required placeholder="Ej. 519" value={form.modelo} onChange={e=>set('modelo',e.target.value)}/></label>
 <label>2. Proveedor<input placeholder="Nombre del proveedor" value={form.proveedor} onChange={e=>set('proveedor',e.target.value)}/></label>
 <label>3. Precio de compra<input required type="number" inputMode="decimal" min="0" step=".01" placeholder="$0.00" value={form.precio_compra} onChange={e=>set('precio_compra',e.target.value)}/></label>
 <label>4. Precio de venta<input required type="number" inputMode="decimal" min="0" step=".01" placeholder="$0.00" value={form.precio_venta} onChange={e=>set('precio_venta',e.target.value)}/></label>
 <label>5. Categoría<select required value={form.categoria} onChange={e=>set('categoria',e.target.value)}><option value="">Seleccionar categoría…</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
 <label>6. Etiqueta de colores<input required placeholder="Ej. Negro, latte, maquillaje" value={form.color} onChange={e=>set('color',e.target.value)}/></label>
 <fieldset><legend>7. Existencias por talla</legend><div className="catalog-form-sizes">{([3,4,5,6] as const).map(n=><label key={n}>Talla {n}<input required type="number" min="0" step="1" inputMode="numeric" value={form[`talla_${n}`]} onChange={e=>set(`talla_${n}`,e.target.value)}/></label>)}</div></fieldset>
 </>:<><label>Nombre de la categoría<input required value={categoryName} onChange={e=>setCategoryName(e.target.value)} placeholder="Ej. Tenis"/></label><p className="catalog-form-help">Las categorías actuales son: {categories.join(', ')}. Para agregar otras hay que habilitarlas en Supabase Menudeo.</p></>}
 {message&&<p className="catalog-form-error" role="alert">{message}</p>}</div><div className="catalog-form-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={busy}>{busy?'Guardando…':mode==='modelo'?'Guardar modelo':'Agregar categoría'}</button></div></form>}</BottomSheet>
}
