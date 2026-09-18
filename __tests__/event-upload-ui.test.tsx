import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
const mocks=vi.hoisted(()=>({refresh:vi.fn()}))
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:mocks.refresh})}))
import { EventUpload } from '@/components/community/EventUpload'
class UploadRequest {
  static requests: UploadRequest[]=[]
  upload: any={}; status=0; responseText=''; timeout=0; form!: FormData
  onload=()=>{}; onerror=()=>{}; ontimeout=()=>{}
  open(){}
  send(form:FormData){this.form=form;UploadRequest.requests.push(this)}
  respond(status:number,body:unknown){this.status=status;this.responseText=JSON.stringify(body);this.onload()}
}
function file(name:string,content:string){
  const value=new File([content],name,{type:'application/pdf'})
  Object.defineProperty(value,'arrayBuffer',{value:async()=>new TextEncoder().encode(content).buffer})
  return value
}
beforeEach(()=>{UploadRequest.requests=[];vi.stubGlobal('XMLHttpRequest',UploadRequest);vi.stubGlobal('crypto',webcrypto);mocks.refresh.mockClear()})
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('shows progress, blocks double submissions, and retries only failed files in the same post',async()=>{
  render(<EventUpload eventId="event" photos={false}/> )
  fireEvent.change(screen.getByLabelText('Adicionar documentos'),{target:{files:[file('one.pdf','%PDF-one'),file('two.pdf','%PDF-two')]}})
  await screen.findByText('two.pdf')
  fireEvent.click(screen.getByRole('button',{name:'Publicar no evento'}))
  await waitFor(()=>expect(UploadRequest.requests).toHaveLength(1))
  expect(screen.getByRole('button',{name:'Publicando…'})).toBeDisabled()
  act(()=>UploadRequest.requests[0].upload.onprogress({lengthComputable:true,loaded:50,total:100}))
  expect(screen.getByText('Enviando 50%')).toBeInTheDocument()
  act(()=>UploadRequest.requests[0].upload.onload())
  expect(screen.getByText('Salvando publicação…')).toBeInTheDocument()
  act(()=>UploadRequest.requests[0].respond(201,{duplicate:false}))
  await waitFor(()=>expect(UploadRequest.requests).toHaveLength(2))
  act(()=>UploadRequest.requests[1].respond(503,{error:'Falha no envio.'}))
  await screen.findByRole('button',{name:'Tentar novamente os que falharam'})
  expect(screen.getByText('Publicado')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Tentar novamente os que falharam'}))
  await waitFor(()=>expect(UploadRequest.requests).toHaveLength(3))
  expect((UploadRequest.requests[2].form.get('file') as File).name).toBe('two.pdf')
  expect(UploadRequest.requests[2].form.get('publication_id')).toBe(UploadRequest.requests[0].form.get('publication_id'))
  act(()=>UploadRequest.requests[2].respond(200,{duplicate:true}))
  await screen.findByRole('button',{name:'Nova publicação'})
  expect(screen.getByRole('status')).toHaveTextContent('não foram repetidos')
  expect(mocks.refresh).toHaveBeenCalledTimes(2)
})
it('deduplicates selected files by content even when filenames differ',async()=>{
  render(<EventUpload eventId="event" photos={false}/> )
  fireEvent.change(screen.getByLabelText('Adicionar documentos'),{target:{files:[file('one.pdf','%PDF-same'),file('copy.pdf','%PDF-same')]}})
  await screen.findByText('one.pdf')
  expect(screen.queryByText('copy.pdf')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('já selecionado')
})
