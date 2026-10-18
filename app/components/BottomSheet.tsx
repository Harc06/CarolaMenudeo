'use client';
import type {ReactNode} from 'react';
import {useEffect} from 'react';
export default function BottomSheet({title,description,onClose,children,className=''}:{title:string;description?:string;onClose:()=>void;children:ReactNode;className?:string}){
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};document.addEventListener('keydown',onKey);const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=previous}},[onClose]);
 return <div className="shared-sheet-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className={`shared-sheet ${className}`} role="dialog" aria-modal="true" aria-label={title}><header className="shared-sheet-header"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div><button type="button" aria-label="Cerrar" onClick={onClose}>×</button></header>{children}</section></div>
}
