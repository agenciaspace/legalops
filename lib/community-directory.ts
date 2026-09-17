import {hasActiveClubAccess} from './community'
// Access and directory visibility are distinct: imported accounts keep their access.
export function isDirectoryMember(member:{display_name?:string|null;current_role?:string|null;organization_name?:string|null;club_access_status?:string|null;club_access_expires_at?:string|null}) {
 const name=member.display_name?.trim()??''
 return name.length>=2 && !['membro legalops','membro do club'].includes(name.toLowerCase()) && Boolean(member.current_role?.trim() && member.organization_name?.trim()) && hasActiveClubAccess(member)
}
