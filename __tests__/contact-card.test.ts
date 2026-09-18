import { expect, it } from 'vitest'
import { contactReturnPath, contactUrl, validateContactDetails, vcard, type ContactCard } from '@/lib/contact-card'
const id='42499cb1-fd6f-4b45-aeac-9d10eea4c94d'
it('keeps QR destinations on the community domain and only accepts contact return paths',()=>{
  expect(contactUrl(id)).toBe(`https://legalops.club/contact/${id}`)
  expect(contactReturnPath(`/contact/${id}`)).toBe(`/contact/${id}`)
  for(const path of ['//evil.test','/contact/../admin','/contact/'+id+'?next=//evil.test','https://evil.test','/contact/------------------------------------']) expect(contactReturnPath(path)).toBeNull()
})
it('starts private, accepts optional empty fields and normalizes international phones',()=>{
  expect(validateContactDetails({})).toEqual({details:{email:null,phone:null,website:null,public_enabled:false}})
  expect(validateContactDetails({phone:'+55 (11) 99999-9999',public_enabled:true})).toMatchObject({details:{phone:'+5511999999999',public_enabled:true}})
})
it('rejects malformed email, local phone numbers and unsafe URLs',()=>{
  for(const input of [{email:'a\r\nb@test.com'},{phone:'11999999999'},{website:'javascript:alert(1)'},{website:'https://user:pass@example.com'}]) expect(validateContactDetails(input).error).toBeTruthy()
})
const card:ContactCard={user_id:id,display_name:'Ana; Silva, João\nEMAIL:fake@example.com',organization_name:'Empresa',current_role:'Jurídico',email:'ana@example.com',phone:'+5511999999999',website:'https://example.com',linkedin_url:null,public_enabled:false}
it('exports a vCard with selected contact fields and escapes property injection',()=>{
  const output=vcard(card)
  expect(output).toContain('BEGIN:VCARD\r\nVERSION:3.0\r\n')
  expect(output).toContain('FN:Ana\\; Silva\\, João\\nEMAIL:fake@example.com')
  expect(output).not.toContain('\r\nEMAIL:fake@example.com')
  expect(output).toContain('EMAIL;TYPE=INTERNET:ana@example.com\r\n')
  expect(output).toContain('TEL;TYPE=CELL:+5511999999999\r\n')
  expect(output).toContain('END:VCARD\r\n')
})
it('folds long international text by UTF-8 bytes and leaves omitted fields out',()=>{
  const output=vcard({...card,display_name:'João '.repeat(25),email:null,phone:null})
  for(const line of output.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  expect(output).not.toContain('EMAIL;')
  expect(output).not.toContain('TEL;')
  expect(output.replace(/\r\n /g,'')).toContain('FN:'+'João '.repeat(25))
})
