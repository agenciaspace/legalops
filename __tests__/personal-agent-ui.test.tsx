import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {PersonalAgent} from '@/app/(main)/community/assistant/PersonalAgent'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const turn={id:'old',question:'Pergunta anterior',answer:'Resposta anterior',sources:[],status:'completed',created_at:'2026-09-17T12:00:00Z'}
it('keeps a single conversation and appends question and answer in sequence',async()=>{
 const fetch=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({turns:[turn],preferences:{focus:'',topics:[]},used:1,has_more:false})}).mockResolvedValueOnce({ok:true,json:async()=>({turn:{...turn,id:'new',question:'E como aplicar?',answer:'Próximo passo'}})})
 vi.stubGlobal('fetch',fetch);render(<PersonalAgent />)
 await screen.findByText('Resposta anterior')
 const input=screen.getByRole('textbox',{name:'Mensagem para seu agente'});fireEvent.change(input,{target:{value:'E como aplicar?'}});fireEvent.keyDown(input,{key:'Enter',shiftKey:false})
 await screen.findByText('Próximo passo')
 expect(screen.getByText('Resposta anterior')).toBeInTheDocument()
 expect(screen.getAllByRole('article',{name:'Sua mensagem'})).toHaveLength(2)
 expect(fetch.mock.calls[1][1].body).toBe(JSON.stringify({question:'E como aplicar?',page:'/'}))
 expect(screen.getByText(/2\/30 perguntas/)).toBeInTheDocument()
})
it('preserves the draft on a failed send and prevents duplicate submissions while waiting',async()=>{
 let fail:(value:unknown)=>void=()=>{}
 const fetch=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({turns:[],preferences:{focus:'',topics:[]},used:0})}).mockImplementationOnce(()=>new Promise(resolve=>{fail=resolve}))
 vi.stubGlobal('fetch',fetch);render(<PersonalAgent />);await screen.findByText('Como posso ajudar hoje?')
 const input=screen.getByRole('textbox',{name:'Mensagem para seu agente'});fireEvent.change(input,{target:{value:'Uma pergunta importante'}})
 fireEvent.keyDown(input,{key:'Enter'});fireEvent.keyDown(input,{key:'Enter'})
 expect(fetch).toHaveBeenCalledTimes(2)
 fail({ok:false,json:async()=>({error:'Falha temporária'})})
 await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Falha temporária'))
 expect(input).toHaveValue('Uma pergunta importante');expect(input).toBeEnabled()
})
it('loads older messages in the same conversation without duplicating turns',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({turns:[turn],preferences:{focus:'',topics:[]},used:1,has_more:true})}).mockResolvedValueOnce({ok:true,json:async()=>({turns:[{...turn,id:'older',question:'Primeira pergunta',answer:'Primeira resposta'},turn],has_more:false})}))
 render(<PersonalAgent />);fireEvent.click(await screen.findByRole('button',{name:'Carregar mensagens anteriores'}));await screen.findByText('Primeira resposta')
 expect(screen.getAllByText('Resposta anterior')).toHaveLength(1)
})
it('formats agent responses and copies the complete answer',async()=>{
 const answer='## Próximos passos\n\n**Prioridade:** revisar contratos.\n\n- Primeiro item\n- Segundo item\n\n[Comunidade](https://legalops.club/community)'
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({turns:[{...turn,answer}],preferences:{focus:'',topics:[]},used:1})}))
 const writeText=vi.fn().mockResolvedValue(undefined)
 Object.defineProperty(navigator,'clipboard',{value:{writeText},configurable:true})
 render(<PersonalAgent/>)
 expect(await screen.findByRole('heading',{name:'Próximos passos'})).toBeInTheDocument()
 expect(screen.getByText('Prioridade:').tagName).toBe('STRONG')
 expect(screen.getAllByRole('listitem')).toHaveLength(2)
 fireEvent.click(screen.getByRole('button',{name:'Copiar resposta'}))
 await screen.findByRole('button',{name:'Resposta copiada'})
 expect(writeText).toHaveBeenCalledWith(answer)
})
