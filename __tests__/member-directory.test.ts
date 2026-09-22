import { expect, it } from 'vitest'
import { directoryFilters, directoryUrl } from '@/lib/member-directory'
import { verificationState, verificationMissing } from '@/lib/member-verification'
import { clubTranslator } from '@/lib/club-locale'
it('preserves public search filters and saved contacts while paginating',()=>{
 const filters=directoryFilters({q:'  São Paulo dados ',scope:'contacts',country:'BR',region:'São Paulo',qualification:'MBA',verification:'pending',page:'2'})
 const url=new URL(directoryUrl(filters,{page:3}),'https://legalops.club')
 expect(url.searchParams.get('q')).toBe('São Paulo dados')
 expect(url.searchParams.get('scope')).toBe('contacts')
 expect(url.searchParams.get('qualification')).toBe('MBA')
 expect(url.searchParams.get('page')).toBe('3')
})
it('bounds search and pagination and rejects malformed filter values',()=>{
 expect(directoryFilters({q:'x'.repeat(300),page:'-9',country:'ZZZ',type:'prototype',verification:'rejected',scope:['contacts']})).toMatchObject({q:'x'.repeat(200),page:1,country:'',type:'',verification:'',scope:''})
 expect(directoryFilters({page:'Infinity'}).page).toBe(1)
 expect(directoryFilters({page:'3.5'}).page).toBe(1)
})
it('describes the automatic completeness status without implying manual review',()=>{
 expect(verificationState('verified').publicLabel).toBe('Perfil completo')
 expect(verificationState('pending').publicLabel).toBe('Perfil incompleto')
 expect(verificationState('unverified').label).toBe('Cadastro incompleto')
 expect(verificationState('rejected').publicLabel).toBe('Perfil incompleto')
 expect(verificationState('unknown').publicLabel).toBe('Perfil incompleto')
})
it('requires the admission photo and professional fields without requiring CV or optional qualifications',()=>{
 expect(verificationMissing({avatar_path:'user/photo.jpg',full_name:'Ana Silva',current_role:'Advogada',organization_name:'Autônoma',linkedin_url:'https://www.linkedin.com/in/ana',public_bio:'Atuo em operações jurídicas e contratos.',areas_of_expertise:['Contratos']})).toEqual([])
 expect(verificationMissing({full_name:'Ana Silva',current_role:'Advogada',organization_name:'Autônoma',linkedin_url:'https://www.linkedin.com/in/ana',public_bio:'Atuo em operações jurídicas e contratos.',areas_of_expertise:['Contratos']})).toContain('Foto')
 expect(verificationMissing(null)).toContain('LinkedIn')
})
it('translates the new review states and search controls into English and Spanish',()=>{
 expect(clubTranslator('en')('Cadastro completo')).toBe('Complete profile')
 expect(clubTranslator('es')('Estado / região')).toBe('Estado / región')
})
