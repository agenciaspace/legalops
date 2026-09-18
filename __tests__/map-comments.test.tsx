import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Schema } from '@tiptap/pm/model'
import { commentRanges, commentTextIndex, commentThreads, locateComment, makeCommentSelection, validCommentAnchor } from '@/lib/map-comments'
import type { MapContribution, MapNode } from '@/lib/contract-map'
import { MapContent } from '@/components/contract-map/MapContent'
import { DocumentComments } from '@/components/contract-map/DocumentComments'
import { editorCommentDecorations, editorCommentSelection } from '@/components/contract-map/comment-decorations'
const p=(text:string):MapNode=>({type:'paragraph',content:[{type:'text',text}]})
const doc:MapNode={type:'doc',content:[p('Antes prazo depois.'),p('Outro prazo final.')]}
const base:MapContribution={id:'thread',section_id:'contexto',author_id:'member',body:'Confirmar este prazo.',kind:'comment',proposed_content:null,base_version:1,status:'open',created_at:'2026-09-18T04:00:00Z',review_note:null,reviewer_id:null}
const selection=makeCommentSelection(commentTextIndex(doc).text,26,31,'published')!
const anchored={...base,anchor_quote:selection.quote,anchor:selection.anchor}
const schema=new Schema({nodes:{doc:{content:'block+'},paragraph:{group:'block',content:'inline*'},text:{group:'inline'},hardBreak:{inline:true,group:'inline'}},marks:{bold:{}}})

describe('Document comment anchors',()=>{
 it('identifies the selected occurrence of repeated text and follows insertions before it',()=>{
  expect(selection.quote).toBe('prazo')
  expect(locateComment(commentTextIndex(doc).text,'prazo',selection.anchor)).toEqual({start:26,end:31})
  const moved={type:'doc',content:[p('Novo início'),...doc.content!]}
  const range=commentRanges(moved,[anchored])[0]
  expect(range.start).toBe(38)
 })
 it('does not guess a location when a quote is ambiguous or removed',()=>{
  expect(locateComment(commentTextIndex(doc).text,'prazo')).toBeNull()
  expect(locateComment('Texto reescrito','prazo',selection.anchor)).toBeNull()
  expect(locateComment('Antes prazo depois.\nOutro prazo final.\nAntes prazo depois.\nOutro prazo final.\n','prazo',selection.anchor)).toBeNull()
 })
 it('retains a unique legacy quote without anchor metadata',()=>expect(locateComment('Veja este prazo hoje','este prazo')).toEqual({start:5,end:15}))
 it('handles formatting and paragraph boundaries using the same offsets',()=>{
  const content:MapNode={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Texto '},{type:'text',text:'marcado',marks:[{type:'bold'}]}]},p('Próximo')]}
  const pm=schema.nodeFromJSON(content)
  expect(commentTextIndex(content).text).toBe('Texto marcado\nPróximo\n')
  expect(editorCommentSelection(pm,7,19)?.quote).toBe('marcado\nPró')
  const result=editorCommentDecorations(pm,[{...base,anchor_quote:'Texto marcado'}],'thread').find()
  expect(result.map(item=>[item.from,item.to])).toEqual([[1,7],[7,14]])
 })
 it('does not serialize private comment highlights into a shared or published document',()=>{
  const pm=schema.nodeFromJSON(doc);const before=JSON.stringify(pm.toJSON())
  expect(editorCommentDecorations(pm,[anchored],'thread').find()).toHaveLength(1)
  expect(JSON.stringify(pm.toJSON())).toBe(before)
  expect(editorCommentDecorations(pm,[{...anchored,status:'resolved'}]).find()).toHaveLength(0)
 })
 it('groups replies to replies into the original thread',()=>{
  const reply={...base,id:'reply',parent_id:base.id};const nested={...base,id:'nested',parent_id:reply.id}
  const threads=commentThreads([nested,reply,base]);expect(threads).toHaveLength(1);expect(threads[0].replies).toHaveLength(2)
 })
 it('validates anchor bounds and refuses extra properties',()=>{
  expect(validCommentAnchor(selection.anchor)).toBe(true)
  for(const invalid of [{...selection.anchor,end:-1},{...selection.anchor,start:0.5},{...selection.anchor,end:999999},{...selection.anchor,prefix:'x'.repeat(65)},{...selection.anchor,html:'x'}]) expect(validCommentAnchor(invalid)).toBe(false)
 })
 it('opens a comment by clicking its highlighted text',()=>{
  const onActivate=vi.fn();render(<MapContent content={doc} ranges={commentRanges(doc,[anchored])} activeId="thread" onActivate={onActivate}/>)
  const mark=screen.getByRole('button',{name:'Abrir comentário deste trecho'});expect(mark).toHaveTextContent('prazo');fireEvent.click(mark);expect(onActivate).toHaveBeenCalledWith('thread')
 })
})

describe('Comment margin',()=>{
 const props={section:'contexto',version:1,comments:[anchored],ranges:commentRanges(doc,[anchored]),activeId:'thread',draft:null,isLead:false,author:()=> 'Membro',onActivate:vi.fn(),onDraft:vi.fn(),onSent:vi.fn(),onResolved:vi.fn(),onClose:vi.fn()}
 it('keeps replies next to the document and uses the original thread',()=>{
  render(<DocumentComments {...props}/>);fireEvent.click(screen.getByRole('button',{name:'Responder'}));expect(props.onDraft).toHaveBeenCalledWith({parent:'thread'});expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Resolver'})).not.toBeInTheDocument()
 })
 it('preserves the composer text when saving fails',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({error:'Sem conexão.'})}))
  render(<DocumentComments {...props} draft={selection}/>);fireEvent.change(screen.getByRole('textbox',{name:'Sua contribuição'}),{target:{value:'Comentário que precisa ficar'}});fireEvent.click(screen.getByRole('button',{name:'Publicar comentário'}));await screen.findByText('Sem conexão.');expect(screen.getByRole('textbox')).toHaveValue('Comentário que precisa ficar');vi.unstubAllGlobals()
 })
 it('resolves with the authenticated review endpoint and reports success',async()=>{
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true})});vi.stubGlobal('fetch',fetcher)
  render(<DocumentComments {...props} isLead/>);fireEvent.click(screen.getByRole('button',{name:'Resolver'}));await waitFor(()=>expect(props.onResolved).toHaveBeenCalled());expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({action:'review',id:'thread',status:'resolved'});vi.unstubAllGlobals()
 })
})
