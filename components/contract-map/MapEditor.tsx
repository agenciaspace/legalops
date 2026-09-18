'use client'
import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import Mention from '@tiptap/extension-mention'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { createClient } from '@/lib/supabase'
import type { MapNode } from '@/lib/contract-map'
import { cleanMapMentions } from '@/lib/map-diff'
import type { MentionMember } from './MentionField'
type Props={collaborationUrl?:string;content:MapNode;sectionId:string;version:number;userId:string;userName:string;onChange:(value:MapNode)=>void;onQuote:(quote:string)=>void;onMentions:(ids:string[])=>void;onReady:(ready:boolean)=>void}
export function MapEditor(props:Props) {
 const [provider,setProvider]=useState<HocuspocusProvider|null>(null)
 const [ready,setReady]=useState(false)
 const [status,setStatus]=useState('Conectando ao rascunho compartilhado…')
 const [people,setPeople]=useState<string[]>([])
 useEffect(()=>{
  let synced=false
  const doc=new Y.Doc();const client=createClient()
  const connection=new HocuspocusProvider({url:props.collaborationUrl??'wss://legalops.dev/collaboration',name:`clm:${props.sectionId}:v${props.version}`,document:doc,token:async()=>{const {data}=await client.auth.getSession();return data.session?.access_token??''},
   onStatus:({status})=>{if(status==='disconnected'){synced=false;setStatus('Sem conexão. O texto continua aqui; aguardando reconexão.');setReady(false);props.onReady(false)}else if(status==='connecting')setStatus('Conectando ao rascunho compartilhado…')},
   onSynced:({state})=>{synced=state;if(state){setReady(true);props.onReady(true);setStatus('Rascunho compartilhado · conectado')}},
   onClose:()=>{synced=false;setReady(false);props.onReady(false);setStatus('Conexão encerrada. Atualize a jornada para continuar; seu texto permanece aqui.')},
   onAuthenticationFailed:()=>{setStatus('Acesso ou versão mudou. Atualize a jornada e abra o editor novamente.');setReady(false);props.onReady(false)},
   onStateless:({payload})=>{try{if(JSON.parse(payload).type==='saved')setStatus('Rascunho salvo no servidor')}catch{}},
   onUnsyncedChanges:({number})=>{props.onReady(number===0&&synced);if(number>0)setStatus('Sincronizando alterações…')},
   onAwarenessUpdate:({states})=>setPeople(Array.from(new Set(states.map(state=>String(state.user?.name??'')).filter(Boolean)))),
  })
  setProvider(connection)
  return()=>{connection.destroy();doc.destroy();props.onReady(false)}
 },[props.sectionId,props.version])
 return <div><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#625E59]"><p role="status">{status}</p>{people.length>0&&<p aria-label="Pessoas no rascunho">{people.join(' · ')}</p>}</div><p className="mb-3 text-xs leading-5 text-[#625E59]">Membros editam juntos este rascunho. Ele só altera o documento público depois da revisão de um lead.</p>{provider&&<EditorSurface {...props} provider={provider} ready={ready}/>}</div>
}
function EditorSurface({provider,ready,...props}:Props&{provider:HocuspocusProvider;ready:boolean}) {
 const [quote,setQuote]=useState('')
 const editor=useEditor({
  extensions:[StarterKit.configure({heading:{levels:[2,3]},code:false,codeBlock:false,horizontalRule:false,strike:false,link:false,underline:false,orderedList:false,undoRedo:false}),TableKit.configure({table:{resizable:false}}),TaskList,TaskItem.configure({nested:true}),
   Collaboration.configure({document:provider.document}),CollaborationCaret.configure({provider,user:{id:props.userId,name:props.userName,color:'#A94E38'}}),
   Mention.configure({HTMLAttributes:{class:'map-mention'},suggestion:{
    items:async({query})=>{try{const response=await fetch(`/api/community/contract-map/members?q=${encodeURIComponent(query)}`);const result=await response.json();return result.members??[]}catch{return[]}},
    render:()=>{let menu:HTMLDivElement|null=null;let current:any;let selected=0
     const update=(data:any)=>{current=data;selected=0;if(!menu){menu=document.createElement('div');menu.className='map-mention-menu';menu.setAttribute('role','listbox');document.body.append(menu)}menu.replaceChildren();data.items.forEach((member:MentionMember,index:number)=>{const button=document.createElement('button');button.type='button';button.textContent=`@${member.display_name}`;button.setAttribute('role','option');button.onmousedown=e=>e.preventDefault();button.onclick=()=>data.command({id:member.user_id,label:member.display_name});if(index===0)button.setAttribute('aria-selected','true');menu!.append(button)});const box=data.clientRect?.();if(box){menu.style.left=`${Math.max(8,Math.min(box.left,window.innerWidth-270))}px`;menu.style.top=`${Math.max(8,Math.min(box.bottom+6,window.innerHeight-220))}px`}}
     return{onStart:update,onUpdate:update,onKeyDown:({event}:any)=>{if(event.key==='Escape'){menu?.remove();menu=null;return true}if(['ArrowDown','ArrowUp'].includes(event.key)&&current?.items.length){selected=(selected+(event.key==='ArrowDown'?1:-1)+current.items.length)%current.items.length;menu?.querySelectorAll('button').forEach((button,index)=>button.setAttribute('aria-selected',String(index===selected)));return true}if(event.key==='Enter'&&current?.items[selected]){const member=current.items[selected];current.command({id:member.user_id,label:member.display_name});return true}return false},onExit:()=>{menu?.remove();menu=null}}
    },
   }}),
  ],immediatelyRender:false,editable:ready,
  editorProps:{attributes:{class:'contract-map-prose min-h-64 p-4 outline-none','aria-label':'Texto da proposta',role:'textbox','aria-multiline':'true'}},
  onSelectionUpdate:({editor})=>{const {from,to}=editor.state.selection;setQuote(editor.state.doc.textBetween(from,to,' ').slice(0,1000))},
  onUpdate:({editor})=>{
   const json=editor.getJSON() as MapNode;props.onChange(cleanMapMentions(json));const ids:string[]=[]
   editor.state.doc.descendants(node=>{if(node.type.name==='mention'&&node.attrs.id)ids.push(node.attrs.id)})
   props.onMentions(Array.from(new Set(ids)).slice(0,10))
  },
 })
 useEffect(()=>{editor?.setEditable(ready);if(ready&&editor)props.onChange(cleanMapMentions(editor.getJSON() as MapNode))},[ready,editor])
 if(!editor)return <p className="p-4 text-sm">Carregando editor…</p>
 return <div className="overflow-hidden rounded-xl border border-[#CEC8BD] bg-white"><div role="toolbar" aria-label="Formatar e colaborar" className="flex flex-wrap gap-1 border-b border-[#CEC8BD] bg-[#FAF7F1] p-2">
  <button disabled={!ready} type="button" onClick={()=>editor.chain().focus().toggleBold().run()} className="map-format font-bold">Negrito</button>
  <button disabled={!ready} type="button" onClick={()=>editor.chain().focus().toggleItalic().run()} className="map-format italic">Itálico</button>
  <button disabled={!ready} type="button" onClick={()=>editor.chain().focus().toggleHeading({level:3}).run()} className="map-format">Subtítulo</button>
  <button disabled={!ready} type="button" onClick={()=>editor.chain().focus().toggleBulletList().run()} className="map-format">Lista</button>
  <button disabled={!ready} type="button" onClick={()=>editor.chain().focus().toggleTaskList().run()} className="map-format">Checklist</button>
  <button disabled={!ready} type="button" onClick={()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run()} className="map-format">Tabela</button>
  <button disabled={!ready} type="button" onClick={()=>editor.chain().focus().insertContent('@').run()} className="map-format">@ Mencionar</button>
  <button disabled={!ready||!quote} type="button" onClick={()=>props.onQuote(quote)} className="map-format">Comentar trecho</button>
  <button disabled={!ready} type="button" onClick={()=>editor.chain().focus().undo().run()} className="map-format">Desfazer</button>
 </div><EditorContent editor={editor}/><div className="flex flex-wrap gap-1 border-t border-[#CEC8BD] p-2"><button disabled={!ready} type="button" className="map-format" onClick={()=>editor.chain().focus().addRowAfter().run()}>+ Linha</button><button disabled={!ready} type="button" className="map-format" onClick={()=>editor.chain().focus().addColumnAfter().run()}>+ Coluna</button><button disabled={!ready} type="button" className="map-format" onClick={()=>editor.chain().focus().deleteRow().run()}>Excluir linha</button><button disabled={!ready} type="button" className="map-format" onClick={()=>editor.chain().focus().deleteTable().run()}>Remover tabela</button></div></div>
}
