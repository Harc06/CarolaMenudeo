'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {getSupabaseClient} from '../../lib/supabase/client';

type Item={id:number;modelo:string;color:string;categoria:string;proveedor:string|null;precio_compra:number;precio_venta:number;talla_3:number;talla_4:number;talla_5:number;talla_6:number;cantidad:number};
const money=(value:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(value);
const qty=(x:Item)=>Number(x.talla_3||0)+Number(x.talla_4||0)+Number(x.talla_5||0)+Number(x.talla_6||0);
export default function VirtualCatalog(){
 const [items,setItems]=useState<Item[]>([]),[search,setSearch]=useState(''),[opened,setOpened]=useState<string|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{const {data,error}=await getSupabaseClient().from('menudeo_inventario').select('id,modelo,color,categoria,proveedor,precio_compra,precio_venta,talla_3,talla_4,talla_5,talla_6,cantidad').order('modelo');if(error)throw error;setItems((data||[]) as Item[])}catch(e){setItems([]);setError('No se pudo consultar el inventario de Menudeo. Puede requerir permisos de acceso en Supabase.')}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 const models=useMemo(()=>{const grouped=new Map<string,Item[]>();for(const item of items){const key=item.modelo.trim()||'Sin modelo';grouped.set(key,[...(grouped.get(key)||[]),item])}return [...grouped.entries()].sort((a,b)=>a[0].localeCompare(b[0],'es',{numeric:true})).map(([name,variants])=>({name,variants,pairs:variants.reduce((a,x)=>a+qty(x),0),investment:variants.reduce((a,x)=>a+qty(x)*Number(x.precio_compra||0),0)}))},[items]);
 const filtered=models.filter(m=>[m.name,...m.variants.flatMap(x=>[x.color,x.categoria,x.proveedor||''])].some(s=>s.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))));
 const totalPairs=items.reduce((a,x)=>a+qty(x),0),investment=items.reduce((a,x)=>a+qty(x)*Number(x.precio_compra||0),0),estimated=items.reduce((a,x)=>a+qty(x)*Number(x.precio_venta||0),0);
 return <section className="catalog-page">
 <div className="catalog-summary"><div><span>Total inventario</span><strong>{loading?'…':error?'—':money(investment)}</strong><small>Costo de compra</small></div><div><span>Estimado con ganancia</span><strong>{loading?'…':error?'—':money(estimated)}</strong><small>Valor estimado de venta</small></div></div>
 <div className="catalog-title"><div><h1>Modelos cargados</h1><p>Administra categorías, modelos y colores de Menudeo.</p></div><button type="button" onClick={()=>void load()} disabled={loading}>Actualizar</button></div>
 <input className="catalog-search" type="search" aria-label="Buscar modelo, categoría o color" placeholder="Buscar modelo, categoría o color…" value={search} onChange={e=>setSearch(e.target.value)}/>
 <div className="catalog-meta"><span>{loading?'Cargando…':`${models.length} modelos`}</span><span>Modelo · categoría · color</span></div>
 <div className="catalog-stats"><span>Pares totales <b>{error?'—':totalPairs.toLocaleString('es-MX')}</b></span><span>Agotados <b>{error?'—':models.filter(x=>x.pairs===0).length}</b></span></div>
 {error&&<div className="catalog-message" role="alert">{error}</div>}
 {!loading&&!error&&filtered.length===0&&<div className="catalog-message">{search?'No hay modelos que coincidan con tu búsqueda.':'Todavía no hay modelos en el inventario de Carola Menudeo.'}</div>}
 <div className="catalog-grid">{filtered.map(m=><article className="catalog-model" key={m.name}><button type="button" className="catalog-model-trigger" aria-expanded={opened===m.name} onClick={()=>setOpened(opened===m.name?null:m.name)}><span><strong>Modelo {m.name}</strong><small className={m.pairs?'':'catalog-empty'}>{m.pairs?`${m.pairs.toLocaleString('es-MX')} pares disponibles`:'Sin existencias'}</small><b>Inversión actual: {money(m.investment)}</b></span><span className="catalog-chevron">{opened===m.name?'⌄':'›'}</span></button>{opened===m.name&&<div className="catalog-variants">{m.variants.map(v=><div className="catalog-variant" key={v.id}><div className="catalog-variant-head"><strong>{v.color}</strong><span>{v.categoria}</span></div><p>{qty(v)} pares · Venta {money(Number(v.precio_venta||0))} / par</p><div className="catalog-sizes">{([3,4,5,6] as const).map(n=><div key={n}><span>Talla {n}</span><strong>{n===3?v.talla_3:n===4?v.talla_4:n===5?v.talla_5:v.talla_6}</strong></div>)}</div></div>)}</div>}</article>)}</div>
 <p className="catalog-disclaimer">Este catálogo consulta exclusivamente el inventario de Carola Menudeo. No utiliza las bases de datos de Mayoreo ni Admin.</p>
 </section>
}
