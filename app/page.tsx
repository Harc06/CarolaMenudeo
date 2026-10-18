'use client';
import { useEffect, useState } from 'react';
import NoteSheet, { type SaleRecord, type NoteKind } from './components/NoteSheet';
import VirtualCatalog from './components/VirtualCatalog';

type Tab = 'inicio' | 'ventas' | 'compras' | 'inventario';
type Extra = 'Catálogo virtual' | 'Deudas' | 'Cotizaciones' | 'Estadísticas' | 'Clientes' | 'Proveedores' | 'Empleados';
const shortcuts: {name:Extra; symbol:string}[] = [{name:'Catálogo virtual',symbol:'🛍️'},{name:'Deudas',symbol:'💸'},{name:'Cotizaciones',symbol:'📝'},{name:'Estadísticas',symbol:'📊'},{name:'Clientes',symbol:'👤'},{name:'Proveedores',symbol:'🚚'},{name:'Empleados',symbol:'👥'}];
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
 useEffect(()=>{try{setSales(JSON.parse(localStorage.getItem('carola_menudeo_sales_drafts_v1')||'[]') as SaleRecord[])}catch{setSales([])}},[]);
 const go=(next:Tab)=>{setTab(next);setExtra(null);setSaleOptionsOpen(false);setSaleFlow(null);window.scrollTo({top:0,behavior:'smooth'})};
 const chooseSale=(option:NoteKind)=>{setSaleOptionsOpen(false);setSaleFlow(option)};
 const active=tabs.find(t=>t.id===tab)!;
 return <main className="app-shell">
  <div className="app-body">
   <header className="app-header">
    <div className="identity"><div className="identity-mark">C</div><div><span className="identity-name">Carola</span><span className="identity-sub">Menudeo</span></div></div>
    <span className="header-pill">Administración</span>
   </header>
   {extra==='Catálogo virtual'?<VirtualCatalog/>:tab==='ventas'&&!extra?<section className="section-screen sales-register"><div className="eyebrow">CAROLA MENUDEO</div><h1>Registro de ventas</h1><p>Ventas guardadas en este dispositivo, pendientes de sincronización con la base de datos. No se ha descontado inventario.</p><button type="button" className="sale-action" onClick={()=>chooseSale('Realizar venta')}>+ Realizar venta</button>{sales.length===0?<div className="section-placeholder"><h2>Sin ventas registradas</h2><p>Al guardar una venta aparecerá aquí.</p></div>:<div className="sales-list">{sales.map(s=><article className="sales-entry" key={s.id}><div className="sales-entry-head"><div><strong>{s.cliente}</strong><small>{s.fecha} · {s.metodoPago}</small></div><strong>{new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(s.total)}</strong></div><div className="sales-entry-lines">{s.lineas.map((l,i)=><p key={i}>{l.cantidad} × Modelo {l.modelo} · {l.color} · Talla {l.talla} · {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(l.precio)} c/u</p>)}</div>{s.detalle&&<p><b>Detalle:</b> {s.detalle}</p>}<span className="sales-pending">Pendiente de sincronizar</span></article>)}</div>}</section>:tab==='inicio'&&!extra?<section className="home-screen">
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
     <section className="insights"><h2>Estadísticas</h2><p>Resumen de tu negocio</p><div className="insight-grid"><div><span>Producto estrella del mes</span><strong>Sin registros</strong></div><div><span>Ganancias del mes</span><strong>Sin registros</strong></div></div><button onClick={()=>{setExtra('Estadísticas');window.scrollTo({top:0,behavior:'smooth'})}}>Ver todo →</button></section>
   </section>:<section className="section-screen" key={extra||tab}>
      <div className="eyebrow">CAROLA MENUDEO</div><h1>{saleFlow||extra||active.label}</h1>
      <div className="section-placeholder"><div className="placeholder-icon"><TabIcon id={tab}/></div><h2>{saleFlow||`Apartado de ${(extra||active.label).toLowerCase()}`}</h2><p>{saleFlow?'La opción ya está preparada. Aquí configuraremos el formulario y los datos de esta operación.':`Este espacio ya está creado. Aquí agregaremos las funciones que definamos para ${(extra||active.label).toLowerCase()}.`}</p><span className="pending-label">Pendiente de configurar</span></div>
   </section>}
  </div>
  {saleOptionsOpen&&<div className="sale-modal-overlay" onClick={()=>setSaleOptionsOpen(false)}><section className="sale-sheet" role="dialog" aria-modal="true" aria-labelledby="sale-sheet-title" onClick={e=>e.stopPropagation()}><div className="sale-sheet-head"><h2 id="sale-sheet-title">Nueva venta</h2><button type="button" className="sale-sheet-close" aria-label="Cerrar opciones de venta" onClick={()=>setSaleOptionsOpen(false)}>×</button></div><p>Selecciona qué quieres hacer.</p><div className="sale-sheet-options"><button type="button" onClick={()=>chooseSale('Realizar venta')}><span className="sale-option-emoji">🛍️</span><span className="sale-option-copy"><strong>Realizar venta</strong><small>Registra una venta de productos.</small></span><span className="sale-option-arrow">›</span></button><button type="button" onClick={()=>chooseSale('Cotización libre')}><span className="sale-option-emoji">📝</span><span className="sale-option-copy"><strong>Cotización libre</strong><small>Prepara una cotización sin seleccionar productos del inventario.</small></span><span className="sale-option-arrow">›</span></button></div></section></div>}
  {saleFlow&&<NoteSheet kind={saleFlow} onClose={()=>setSaleFlow(null)} onSale={sale=>{setSales(current=>[sale,...current]);setTab('ventas');setExtra(null)}}/>}
  <nav className="bottom-nav" aria-label="Navegación principal">{tabs.map(t=><button key={t.id} type="button" aria-current={tab===t.id?'page':undefined} className={'nav-tab'+(tab===t.id?' selected':'')} onClick={()=>go(t.id)}><TabIcon id={t.id}/><span>{t.label}</span></button>)}</nav>
 </main>;
}
