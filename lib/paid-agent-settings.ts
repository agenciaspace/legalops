export interface PaidAgentSettings {
  interview_prep_enabled: boolean
  cover_letter_enabled: boolean
  outreach_enabled: boolean
}

export const defaultPaidAgentSettings: PaidAgentSettings = {
  interview_prep_enabled: true,
  cover_letter_enabled: true,
  outreach_enabled: true,
}
