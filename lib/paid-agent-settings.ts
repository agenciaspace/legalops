export interface PaidAgentSettings {
  interviewPrepEnabled: boolean
  coverLetterEnabled: boolean
}

export const DEFAULT_PAID_AGENT_SETTINGS: PaidAgentSettings = {
  interviewPrepEnabled: false,
  coverLetterEnabled: false,
}
