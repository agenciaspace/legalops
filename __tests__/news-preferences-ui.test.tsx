import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
const state=vi.hoisted(()=>({refresh:vi.fn()}))
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:state.refresh})}))
import { NewsPreferencesForm } from '@/components/news/NewsPreferencesForm'
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks()})
it('loads the persisted choice, saves explicit opt-in, and refreshes the Club feed',async()=>{
 const call=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({preferences:{enabled:false,audiences:[],topics:[]}}))).mockResolvedValueOnce(new Response(JSON.stringify({preferences:{enabled:true,audiences:['escritorios'],topics:[]}})))
 vi.stubGlobal('fetch',call);render(<NewsPreferencesForm/>)
 await waitFor(()=>expect(screen.getByRole('button',{name:'Salvar preferências'})).toBeEnabled())
 expect(screen.getByLabelText('Receber notícias no meu feed do Club')).not.toBeChecked()
 fireEvent.click(screen.getByLabelText('Receber notícias no meu feed do Club'));fireEvent.click(screen.getByLabelText('Escritórios'))
 fireEvent.click(screen.getByRole('button',{name:'Salvar preferências'}))
 expect(await screen.findByRole('status')).toHaveTextContent('preferências salvas'.replace('p','P'))
 expect(JSON.parse(call.mock.calls[1][1].body)).toEqual({enabled:true,audiences:['escritorios'],topics:[]})
 expect(state.refresh).toHaveBeenCalled()
})
it('blocks saves when preferences could not be loaded',async()=>{
 const call=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Não conseguimos carregar suas preferências.'}),{status:503}))
 vi.stubGlobal('fetch',call);render(<NewsPreferencesForm/>)
 expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos carregar')
 expect(screen.getByRole('button',{name:'Salvar preferências'})).toBeDisabled()
 expect(state.refresh).not.toHaveBeenCalled()
})
