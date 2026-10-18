'use client';
import {useEffect,useRef,useState} from 'react';

export type StyledOption={value:string;label:string;disabled?:boolean};
export default function StyledSelect({value,onChange,options,placeholder='Seleccionar…',disabled=false}:{value:string;onChange:(value:string)=>void;options:StyledOption[];placeholder?:string;disabled?:boolean}){
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const selected=options.find(o=>o.value===value);
 useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false)};const key=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};document.addEventListener('pointerdown',close);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',key)}},[open]);
 return <div className="carola-select" ref={root}><button type="button" className={'carola-select-trigger'+(open?' is-open':'')} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={()=>setOpen(v=>!v)}><span>{selected?.label||placeholder}</span><span className="carola-select-chevron" aria-hidden="true">⌄</span></button>{open&&<div className="carola-select-menu" role="listbox" aria-label={placeholder}>{options.map(option=><button type="button" role="option" aria-selected={option.value===value} disabled={option.disabled} key={option.value} className={'carola-select-option'+(option.value===value?' is-selected':'')} onClick={()=>{onChange(option.value);setOpen(false)}}><span>{option.label}</span>{option.value===value&&<span aria-hidden="true">✓</span>}</button>)}</div>}</div>
}
