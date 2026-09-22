export const VERIFICATION = {
  verified: { label: 'Cadastro completo', publicLabel: 'Perfil completo', description: 'A completude foi confirmada automaticamente. As informações são declaradas pelo membro e não representam certificação de identidade, diplomas ou competências.', tone: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  pending: { label: 'Cadastro incompleto', publicLabel: 'Perfil incompleto', description: 'Complete os campos obrigatórios para receber o selo automaticamente.', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
  rejected: { label: 'Cadastro incompleto', publicLabel: 'Perfil incompleto', description: 'Complete os campos obrigatórios para receber o selo automaticamente.', tone: 'border-stone-200 bg-stone-50 text-stone-700' },
  unverified: { label: 'Cadastro incompleto', publicLabel: 'Perfil incompleto', description: 'Complete os campos obrigatórios para receber o selo automaticamente.', tone: 'border-stone-200 bg-stone-50 text-stone-700' },
} as const
export function verificationState(status?: string | null) { return VERIFICATION[status as keyof typeof VERIFICATION] ?? VERIFICATION.unverified }
export function verificationMissing(profile: { avatar_path?: string | null; full_name?: string | null; current_role?: string | null; organization_name?: string | null; linkedin_url?: string | null; public_bio?: string | null; areas_of_expertise?: string[] | null } | null) {
  return [
    !profile?.avatar_path ? 'Foto' : '',
    !profile?.full_name || profile.full_name.trim().length < 3 ? 'Nome completo' : '',
    !profile?.current_role || profile.current_role.trim().length < 2 ? 'Cargo atual' : '',
    !profile?.organization_name || profile.organization_name.trim().length < 2 ? 'Organização' : '',
    !/^https:\/\/(www\.)?linkedin\.com\/in\/[^/?#\s]+\/?$/.test(profile?.linkedin_url ?? '') ? 'LinkedIn' : '',
    !profile?.public_bio || profile.public_bio.trim().length < 20 ? 'Sobre sua atuação' : '',
    !profile?.areas_of_expertise?.length ? 'Temas de experiência' : '',
  ].filter(Boolean)
}
