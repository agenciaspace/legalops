import { Server } from '@hocuspocus/server';
import { TiptapTransformer } from '@hocuspocus/transformer';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import Mention from '@tiptap/extension-mention';
import { createClient } from '@supabase/supabase-js';
import * as Y from 'yjs';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const extensions = [StarterKit.configure({heading:{levels:[2,3]},code:false,codeBlock:false,horizontalRule:false,strike:false,link:false,underline:false,orderedList:false,undoRedo:false}),TableKit,TaskList,TaskItem.configure({nested:true}),Mention];
const active = member => member && ['active','complimentary'].includes(member.club_access_status) && (!member.club_access_expires_at || Date.parse(member.club_access_expires_at)>Date.now());
export async function authorizeSupabase(token, documentName) {
  const match = /^clm:([a-z-]{2,40}):v([1-9][0-9]{0,8})$/.exec(documentName);
  if (!match || !token || token.length>8000) throw new Error('Not authorized');
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:{user},error}=await db.auth.getUser(token);
  if(error || !user) throw new Error('Not authorized');
  const [{data:member},{data:section}]=await Promise.all([
    db.from('community_members').select('display_name,club_access_status,club_access_expires_at').eq('user_id',user.id).maybeSingle(),
    db.from('contract_map_sections').select('content,version').eq('id',match[1]).maybeSingle(),
  ]);
  if(!active(member) || !section || section.version!==Number(match[2])) throw new Error('Membership or document version changed');
  return {token,documentName,userId:user.id,name:member.display_name||'Membro',color:`#${createHash('sha256').update(user.id).digest('hex').slice(0,6)}`,seed:section.content,checkedAt:Date.now()};
}
export function createCollaborationServer({port=8788,address='127.0.0.1',directory='/var/lib/legalops-collaboration',authorize=authorizeSupabase,recheckMs=30000}={}) {
  const file = name => resolve(directory,createHash('sha256').update(name).digest('hex')+'.yjs');
  async function recheck(context) {
    if(!context || Date.now()-context.checkedAt>=recheckMs) {
      const refreshed=await authorize(context?.token,context?.documentName);
      Object.assign(context,refreshed,{checkedAt:Date.now()});
    }
  }
  const server=new Server({port,address,quiet:true,debounce:750,maxDebounce:3000,maxPendingDocuments:30,maxUnauthenticatedQueueSize:256*1024,maxUnauthenticatedQueueMessages:100,websocketOptions:{maxPayload:1024*1024},
    async onAuthenticate({token,documentName}) { return authorize(token,documentName); },
    async onTokenSync({token,documentName,context}) {Object.assign(context,await authorize(token,documentName));},
    async beforeHandleMessage({context,document}) {await recheck(context);if(Y.encodeStateAsUpdate(document).length>4*1024*1024)throw new Error('Document size limit');},
    beforeHandleAwareness({context,states}) {if(context)for(const state of states.values())if(state)state.user={id:context.userId,name:context.name,color:context.color};},
    async onLoadDocument({documentName,document,context}) {
      await mkdir(directory,{recursive:true,mode:0o700});
      try {Y.applyUpdate(document,new Uint8Array(await readFile(file(documentName))));return document;}
      catch(error){if(error.code!=='ENOENT')throw error;}
      const seed=TiptapTransformer.toYdoc(context.seed,'default',extensions);
      Y.applyUpdate(document,Y.encodeStateAsUpdate(seed));seed.destroy();return document;
    },
    async onStoreDocument({documentName,document}) {
      const state=Y.encodeStateAsUpdate(document);
      if(state.length>4*1024*1024)throw new Error('Document size limit');
      const target=file(documentName);await writeFile(target+'.tmp',state,{mode:0o600});await rename(target+'.tmp',target);
      document.broadcastStateless(JSON.stringify({type:'saved',at:new Date().toISOString()}));
    },
  });
  // Revoke idle readers as well as active writers when their membership/session changes.
  const timer=setInterval(async()=>{
    for(const document of server.hocuspocus.documents.values())for(const connection of document.getConnections()) {
      try {await recheck(connection.context);}catch{connection.close({code:4403,reason:'Access or document version changed'});}
    }
  },recheckMs);
  timer.unref();
  const destroy=server.destroy.bind(server);server.destroy=async()=>{clearInterval(timer);await destroy();};
  return server;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){const server=createCollaborationServer({port:Number(process.env.PORT||8788),directory:process.env.COLLAB_DATA_DIR||'/var/lib/legalops-collaboration'});await server.listen();}
