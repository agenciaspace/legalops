'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MemberAvatar } from './MemberAvatar'
export function ProfilePhoto({userId,path,name}:{userId:string;path:string|null;name:string}) {
 const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [failed,setFailed]=useState(false);const [preview,setPreview]=useState<string|null>(null);const [removed,setRemoved]=useState(false)
 async function upload(file:File|undefined) {
  if(!file||busy)return
  setMessage('');setFailed(false);setBusy(true)
  try{
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Use uma foto JPG, PNG ou WebP de até 10 MB.')
   const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');const scale=Math.min(800/bitmap.width,800/bitmap.height,1);canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Seu navegador não conseguiu preparar a foto.');ctx.fillStyle='#F5F1E8';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close()
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Não conseguimos preparar a foto.')),'image/jpeg',.85))
   const response=await fetch('/api/club/avatar',{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob});const data=await response.json();if(!response.ok)throw new Error(data.error)
   setRemoved(false);setPreview(data.url);setMessage('Foto salva. Ela já aparece nas suas publicações.');router.refresh()
  }catch(error){setFailed(true);setMessage(error instanceof Error?error.message:'Não conseguimos salvar sua foto.')}
  finally{setBusy(false)}
 }
 async function remove() {
  if(busy)return
  setBusy(true);setMessage('');setFailed(false)
  try {const response=await fetch('/api/club/avatar',{method:'DELETE'});const data=await response.json();if(!response.ok)throw new Error(data.error);setRemoved(true);setPreview(null);setMessage('Foto removida.');router.refresh()}
  catch(error){setFailed(true);setMessage(error instanceof Error?error.message:'Não conseguimos remover a foto.')}
  finally{setBusy(false)}
 }
 return <section className="mb-6 rounded-xl bg-[#F5F1E8] p-4"><h2 className="text-lg font-semibold">Sua foto na comunidade</h2><div className="mt-4 flex flex-wrap items-center gap-4">{preview?<img src={preview} alt={`Foto de ${name}`} className="h-20 w-20 rounded-full object-cover"/>:<MemberAvatar userId={userId} path={removed?null:path} name={name} size="h-20 w-20"/>}<label className="min-w-0 flex-1 text-sm font-medium">{busy?'Salvando foto…':!removed&&(path||preview)?'Trocar foto':'Adicionar sua foto'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event=>void upload(event.target.files?.[0])} className="mt-2 block min-h-12 w-full max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#24231F] file:px-3 file:py-3 file:text-sm file:text-white"/></label></div>{!removed&&(path||preview)?<button type="button" disabled={busy} onClick={()=>void remove()} className="mt-2 min-h-11 text-sm underline">Remover foto</button>:null}<p className="mt-3 text-xs leading-6 text-[#625E59]">JPG, PNG ou WebP, até 10 MB. Sua foto é exibida aos membros do Club, junto do seu nome e local de trabalho.</p>{message?<p role={failed?'alert':'status'} className={`mt-3 text-sm ${failed?'text-red-700':'text-green-800'}`}>{message}</p>:null}</section>
}
