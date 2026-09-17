import {expect,it} from 'vitest'
import {isDirectoryMember} from '@/lib/community-directory'
it('hides imported placeholders without mistaking account access for a completed public profile',()=>{
 const member={display_name:'Membro LegalOps',current_role:null,organization_name:null,club_access_status:'complimentary'}
 expect(isDirectoryMember(member)).toBe(false)
 expect(isDirectoryMember({...member,display_name:'Pessoa real',current_role:'Legal Ops',organization_name:'Empresa'})).toBe(true)
 expect(isDirectoryMember({...member,display_name:'Pessoa real',current_role:'Legal Ops',organization_name:'Empresa',club_access_expires_at:'2000-01-01'})).toBe(false)
})
