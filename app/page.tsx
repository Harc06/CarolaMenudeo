'use client';
import { useState } from 'react';

type Tab = 'inicio' | 'ventas' | 'compras' | 'inventario';
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
 const active=tabs.find(t=>t.id===tab)!;
 return <main className="app-shell">
  <div className="app-body">
   <header className="app-header">
    <div className="identity"><div className="identity-mark">C</div><div><span className="identity-name">Carola</span><span className="identity-sub">Menudeo</span></div></div>
    <span className="header-pill">Administración</span>
   </header>
   {tab==='inicio'?<section className="home-screen">
     <div className="welcome"><span className="eyebrow">TU ESPACIO DE TRABAJO</span><h1>Hola, bienvenido a Carola.</h1><p>Todo tu negocio, en un solo lugar.</p></div>
     <section className="home-card"><div className="home-card-symbol">✦</div><span className="eyebrow">CAROLA MENUDEO</span><h2>Tu negocio, más organizado.</h2><p>Estamos preparando cada apartado para que administres tus ventas, compras e inventario de manera sencilla.</p></section>
     <h2 className="section-heading">Tus apartados</h2>
     <div className="quick-grid">{tabs.filter(t=>t.id!=='inicio').map(t=><button className="quick-card" key={t.id} onClick={()=>setTab(t.id)}><span className="quick-icon"><TabIcon id={t.id}/></span><span>{t.label}</span><span className="quick-arrow">›</span></button>)}</div>
   </section>:<section className="section-screen" key={tab}>
      <div className="eyebrow">CAROLA MENUDEO</div><h1>{active.label}</h1>
      <div className="section-placeholder"><div className="placeholder-icon"><TabIcon id={tab}/></div><h2>Apartado de {active.label.toLowerCase()}</h2><p>Este espacio ya está creado. Aquí agregaremos las funciones que definamos para {active.label.toLowerCase()}.</p><span className="pending-label">Pendiente de configurar</span></div>
   </section>}
  </div>
  <nav className="bottom-nav" aria-label="Navegación principal">{tabs.map(t=><button key={t.id} type="button" aria-current={tab===t.id?'page':undefined} className={'nav-tab'+(tab===t.id?' selected':'')} onClick={()=>setTab(t.id)}><TabIcon id={t.id}/><span>{t.label}</span></button>)}</nav>
 </main>;
}
