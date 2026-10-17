'use client';
import { useState } from 'react';

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
 const go=(next:Tab)=>{setTab(next);setExtra(null);window.scrollTo({top:0,behavior:'smooth'})};
 const active=tabs.find(t=>t.id===tab)!;
 return <main className="app-shell">
  <div className="app-body">
   <header className="app-header">
    <div className="identity"><div className="identity-mark">C</div><div><span className="identity-name">Carola</span><span className="identity-sub">Menudeo</span></div></div>
    <span className="header-pill">Administración</span>
   </header>
   {tab==='inicio'&&!extra?<section className="home-screen">
     <section className="today-card">
       <h2>Tu negocio hoy</h2>
       <div className="today-top"><div><strong className="today-amount">—</strong><span>Ventas hoy</span></div><div className="today-compare">vs ayer <span>Sin datos</span></div></div>
       <div className="today-bottom"><div><strong>—</strong><span>Balance</span></div><div className="expense"><strong>—</strong><span>Gastos hoy</span></div></div>
       <button className="sale-action" onClick={()=>go('ventas')}><TabIcon id="ventas"/> Registrar venta</button>
       <p className="today-footnote">Los importes aparecerán cuando configuremos el registro de ventas y gastos.</p>
     </section>
     <h2 className="section-heading">Descubre todo lo que puedes hacer</h2>
     <div className="shortcut-strip" aria-label="Accesos rápidos">{shortcuts.map(x=><button type="button" key={x.name} className="shortcut-card" onClick={()=>{setExtra(x.name);window.scrollTo({top:0,behavior:'smooth'})}}><span className="shortcut-emoji" aria-hidden="true">{x.symbol}</span><span>{x.name}</span></button>)}</div>
     <div className="scroll-hint">Desliza para ver más <span>→</span></div>
     <section className="insights"><h2>Estadísticas</h2><p>Resumen de tu negocio</p><div className="insight-grid"><div><span>Producto estrella del mes</span><strong>Sin registros</strong></div><div><span>Ganancias del mes</span><strong>Sin registros</strong></div></div><button onClick={()=>{setExtra('Estadísticas');window.scrollTo({top:0,behavior:'smooth'})}}>Ver todo →</button></section>
   </section>:<section className="section-screen" key={extra||tab}>
      <div className="eyebrow">CAROLA MENUDEO</div><h1>{extra||active.label}</h1>
      <div className="section-placeholder"><div className="placeholder-icon"><TabIcon id={tab}/></div><h2>Apartado de {(extra||active.label).toLowerCase()}</h2><p>Este espacio ya está creado. Aquí agregaremos las funciones que definamos para {(extra||active.label).toLowerCase()}.</p><span className="pending-label">Pendiente de configurar</span></div>
   </section>}
  </div>
  <nav className="bottom-nav" aria-label="Navegación principal">{tabs.map(t=><button key={t.id} type="button" aria-current={tab===t.id?'page':undefined} className={'nav-tab'+(tab===t.id?' selected':'')} onClick={()=>go(t.id)}><TabIcon id={t.id}/><span>{t.label}</span></button>)}</nav>
 </main>;
}
