import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { createCollaborationServer } from './server.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check){for(let i=0;i<120;i++){if(check())return;await sleep(50)}throw new Error('Timed out');}
test('authenticated peers merge, persist, validate presence and lose access after revocation', {timeout:25000}, async()=>{
 const directory=await mkdtemp(join(tmpdir(),'clm-collaboration-'));const revoked=new Set();const clients=[];let server;
 const authorize=async(token,documentName)=>{if(!['alice','bob'].includes(token)||revoked.has(token))throw new Error('Not authorized');return {token,documentName,userId:token,name:token.toUpperCase(),color:'#123456',checkedAt:Date.now(),seed:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Published seed'}]}]}}};
 const start=async()=>{server=createCollaborationServer({port:0,directory,authorize,recheckMs:150});await server.listen();return `ws://127.0.0.1:${server.httpServer.address().port}`};
 const peer=(url,token)=>{const doc=new Y.Doc();const provider=new HocuspocusProvider({url,name:'clm:contexto:v1',document:doc,token,WebSocketPolyfill:WebSocket});clients.push(provider);return provider};
 try{
  let url=await start();const alice=peer(url,'alice'),bob=peer(url,'bob');await until(()=>alice.isSynced&&bob.isSynced);
  assert.match(alice.document.getXmlFragment('default').toString(),/Published seed/);
  alice.document.getText('test').insert(0,'A');bob.document.getText('test').insert(0,'B');await until(()=>alice.document.getText('test').length===2&&bob.document.getText('test').length===2);assert.equal(alice.document.getText('test').toString(),bob.document.getText('test').toString());
  alice.setAwarenessField('user',{id:'spoof',name:'Fake lead'});await until(()=>Array.from(bob.awareness.getStates().values()).some(state=>state.user?.name==='ALICE'));
  const denied=peer(url,'intruder');let failed=false;denied.on('authenticationFailed',()=>failed=true);await until(()=>failed);assert.equal(denied.document.getXmlFragment('default').length,0);denied.destroy();
  await until(()=>alice.hasUnsyncedChanges===false);await sleep(1100);assert.equal((await readdir(directory)).filter(f=>f.endsWith('.yjs')).length,1);
  revoked.add('bob');await until(()=>Array.from(server.hocuspocus.documents.values()).every(doc=>doc.getConnections().every(connection=>connection.context.userId!=='bob')));bob.destroy();alice.destroy();await server.destroy();
  url=await start();const restored=peer(url,'alice');await until(()=>restored.isSynced);assert.equal(restored.document.getText('test').length,2);
 }finally{for(const client of clients)client.destroy();if(server)await server.destroy();await rm(directory,{recursive:true,force:true});}
});
