'use client';
import {useEffect,useRef,useState} from 'react';
import type {QuoteRecord} from './NoteSheet';
const money=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n);
export default function QuoteShare({quote,onClose}:{quote:QuoteRecord;onClose:()=>void}){
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [pdfFile,setPdfFile]=useState<File|null>(null);
 const sharing=useRef(false);
 const rows=quote.lineas.map(l=>({description:l.tipo==='caja'?'Caja · '+l.color:l.tipo==='envio'?'Envío · '+l.color:'Modelo '+l.modelo+' · '+l.color+(quote.modalidad==='Menudeo'?' · Talla '+l.talla:''),qty:Number(l.cantidad),price:Number(l.precio)}));
 const plain=['CALZADO ARALY','COTIZACIÓN '+quote.modalidad.toUpperCase(),'Cliente: '+quote.cliente,'Teléfono: '+quote.telefono,'Fecha: '+quote.fecha,...rows.map(r=>r.qty+' × '+r.description+' · '+money(r.price)+' c/u = '+money(r.qty*r.price)),'TOTAL: '+money(Number(quote.total)),'Cotización informativa. No es comprobante de pago.'].join('\n');
 
 const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));

 const notice='Cambios y devoluciones aplican solamente hasta 30 días después por detalles de fábrica únicamente.';
 const PAGE_SIZE=20;
 const pages=Array.from({length:Math.max(1,Math.ceil(rows.length/PAGE_SIZE))},(_,i)=>rows.slice(i*PAGE_SIZE,(i+1)*PAGE_SIZE));
 const logo='/araly-logo-horizontal.svg';

 const logoImage=async()=>{const img=new Image();img.src=logo;await img.decode();const canvas=document.createElement('canvas');canvas.width=900;canvas.height=300;const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo preparar el logotipo');ctx.drawImage(img,0,0,900,300);return canvas.toDataURL('image/png')};
 const renderPage=async(part:typeof rows,index:number,totalPages:number)=>{const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo generar la nota');ctx.fillStyle='#fff';ctx.fillRect(0,0,1240,1754);const img=new Image();img.src=logo;await img.decode();ctx.drawImage(img,90,83,420,140);ctx.fillStyle='#27313b';ctx.textAlign='left';ctx.font='25px Arial';ctx.fillText('Cliente: '+quote.cliente,90,330);ctx.fillText('Teléfono: '+quote.telefono,90,370);ctx.fillText('Fecha: '+quote.fecha,90,410);ctx.strokeStyle='#d6a3a9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(90,450);ctx.lineTo(1150,450);ctx.stroke();ctx.fillStyle='#f8ebed';ctx.fillRect(90,475,1060,55);ctx.fillStyle='#27313b';ctx.font='bold 22px Arial';ctx.fillText('Producto',105,511);ctx.textAlign='center';ctx.fillText('Cantidad',695,511);ctx.fillText('Precio unitario',875,511);ctx.textAlign='right';ctx.fillText('Importe',1135,511);const rowHeight=Math.min(65,Math.max(42,900/Math.max(part.length,1)));part.forEach((row,i)=>{const y=575+i*rowHeight;ctx.fillStyle='#27313b';ctx.font='22px Arial';ctx.textAlign='left';const description=row.description;ctx.fillText(description.length>39?description.slice(0,38)+'…':description,105,y);ctx.textAlign='center';ctx.fillText(String(row.qty),695,y);ctx.fillText(money(row.price),875,y);ctx.textAlign='right';ctx.fillText(money(row.qty*row.price),1135,y);ctx.strokeStyle='#ece5e6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(90,y+15);ctx.lineTo(1150,y+15);ctx.stroke()});ctx.fillStyle='#27313b';ctx.textAlign='right';ctx.font='bold 36px Arial';if(index===totalPages-1)ctx.fillText('TOTAL: '+money(Number(quote.total)),1135,1580);ctx.strokeStyle='#d6a3a9';ctx.beginPath();ctx.moveTo(90,1620);ctx.lineTo(1150,1620);ctx.stroke();ctx.textAlign='center';ctx.font='18px Arial';ctx.fillStyle='#666';ctx.fillText(notice,620,1660);ctx.font='16px Arial';ctx.fillText('Página '+(index+1)+' de '+totalPages,620,1690);return canvas};
 const makeImages=async()=>Promise.all(pages.map((part,i)=>renderPage(part,i,pages.length)));
 const download=(blob:Blob,name:string)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)};
 const [pdfLoading,setPdfLoading]=useState(true);
 const [pdfError,setPdfError]=useState('');
 useEffect(()=>{let cancelled=false;(async()=>{try{const {jsPDF}=await import('jspdf');const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});const canvases=await makeImages();canvases.forEach((canvas,i)=>{if(i)doc.addPage();doc.addImage(canvas.toDataURL('image/jpeg',0.86),'JPEG',0,0,210,297)});const blob=doc.output('blob');if(!cancelled)setPdfFile(new File([blob],'cotizacion-araly-'+quote.fecha+'.pdf',{type:'application/pdf'}))}catch(e){if(!cancelled)setPdfError(e instanceof Error?e.message:'No se pudo generar el PDF')}finally{if(!cancelled)setPdfLoading(false)}})();return()=>{cancelled=true}},[quote.id]);
 const sharePdf=async()=>{if(!pdfFile||sharing.current)return;sharing.current=true;setError('');try{
   // Admin Carola utiliza el archivo y una descarga directa si iOS no puede abrir el menú nativo.
   if(navigator.share&&navigator.canShare?.({files:[pdfFile]})){
     try{await navigator.share({files:[pdfFile],title:'Nota Calzado Araly'});return}
     catch(e){if(e instanceof Error&&e.name==='AbortError')return;console.warn('Safari no pudo compartir el PDF; se ofrecerá la descarga.',e)}
   }
   download(pdfFile,pdfFile.name);
   setError('PDF descargado. Puedes abrirlo desde Archivos y compartirlo o imprimirlo.');
 }catch(e){setError(e instanceof Error?e.message:'No se pudo preparar el archivo')}finally{sharing.current=false}};
 const cachedImage=useRef<Blob|null>(null);
 const buildImage=async()=>{if(cachedImage.current)return cachedImage.current;const canvases=await makeImages();const joined=document.createElement('canvas');joined.width=canvases[0].width;joined.height=canvases.reduce((sum,c)=>sum+c.height,0);const ctx=joined.getContext('2d');if(!ctx)throw Error('No se pudieron unir las páginas');let y=0;for(const canvas of canvases){ctx.drawImage(canvas,0,y);y+=canvas.height}const blob=await new Promise<Blob>((resolve,reject)=>joined.toBlob(result=>result?resolve(result):reject(Error('No se pudo crear la imagen')),'image/png'));cachedImage.current=blob;return blob};
 const copyImages=async()=>{if(busy)return;setError('');if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined'){setError('Este navegador no permite copiar imágenes. Utiliza la opción de guardar.');return}setBusy(true);try{const promise=buildImage();await navigator.clipboard.write([new ClipboardItem({'image/png':promise})]);setError('Imagen completa copiada: '+pages.length+' página(s).')}catch(e){setError(e instanceof Error?e.message:'No se pudo copiar la imagen')}finally{setBusy(false)}};
 return <div className="sale-modal-overlay" onClick={onClose}><section className="sale-sheet" role="dialog" aria-modal="true" aria-label="Compartir cotización" onClick={e=>e.stopPropagation()}><div className="sale-sheet-head"><h2>Compartir cotización</h2><button type="button" className="sale-sheet-close" onClick={onClose} aria-label="Cerrar">×</button></div><p>Nota de Calzado Araly · {quote.cliente} · {money(Number(quote.total))}</p><div className="sale-sheet-options"><button type="button" disabled={busy} onClick={()=>void copyImages()}>🖼️ Copiar imagen{pages.length>1?' ('+pages.length+' páginas)':''}</button><button type="button" disabled={busy||pdfLoading||!pdfFile} onClick={()=>void sharePdf()}>{pdfLoading?'Preparando PDF…':'↗️ Compartir PDF'}</button><button type="button" disabled={busy||pdfLoading||!pdfFile} onClick={()=>pdfFile&&download(pdfFile,pdfFile.name)}>⬇️ Guardar PDF</button>{pdfError&&<p role="alert">{pdfError}</p>}</div>{error&&<p role="status">{error}</p>}</section></div>;
}
