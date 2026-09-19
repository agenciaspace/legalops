export const VERIFICATION = {
  verified: { label: 'Perfil validado', publicLabel: 'Validado', description: 'A administração conferiu sua identidade e seu contexto profissional. O selo não certifica diplomas ou competências.', tone: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  pending: { label: 'Em análise', publicLabel: 'Em análise', description: 'Sua solicitação está na fila da administração. A decisão e eventuais pedidos de ajustes aparecerão aqui. Você pode continuar usando a comunidade.', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
  rejected: { label: 'Ajustes solicitados', publicLabel: 'Não validado', description: 'Veja o motivo abaixo, atualize os dados necessários e solicite uma nova análise.', tone: 'border-rose-200 bg-rose-50 text-rose-800' },
  unverified: { label: 'Validação não solicitada', publicLabel: 'Não validado', description: 'Seu cadastro ainda não passou por conferência. Complete os campos indicados e solicite a análise da administração.', tone: 'border-stone-200 bg-stone-50 text-stone-700' },
} as const
export function verificationState(status?: string | null) { return VERIFICATION[status as keyof typeof VERIFICATION] ?? VERIFICATION.unverified }
export function verificationMissing(profile: { full_name?: string | null; current_role?: string | null; organization_name?: string | null; linkedin_url?: string | null; public_bio?: string | null; areas_of_expertise?: string[] | null } | null) {
  return [
    !profile?.full_name || profile.full_name.trim().length < 3 ? 'Nome completo' : '',
    !profile?.current_role || profile.current_role.trim().length < 2 ? 'Cargo atual' : '',
    !profile?.organization_name || profile.organization_name.trim().length < 2 ? 'Organização' : '',
    !/^https:\/\/(www\.)?linkedin\.com\/in\/[^/?#\s]+\/?$/.test(profile?.linkedin_url ?? '') ? 'LinkedIn' : '',
    !profile?.public_bio || profile.public_bio.trim().length < 20 ? 'Sobre sua atuação' : '',
    !profile?.areas_of_expertise?.length ? 'Temas de experiência' : '',
  ].filter(Boolean)
}
