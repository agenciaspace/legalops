export type RemoteReality =
  | 'fully_remote'
  | 'remote_with_travel'
  | 'hybrid_disguised'
  | 'onsite'
  | 'unknown'

export type EnrichmentStatus = 'pending' | 'done' | 'failed'

export type UrlStatus = 'live' | 'dead' | 'unknown'

export type PipelineStatus =
  | 'researching'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'discarded'

export type SourceBoard =
  | 'greenhouse'
  | 'lever'
  | 'gupy'
  | 'workable'
  | 'indeed'
  | 'linkedin'
  | 'cloc'
  | 'legalio'
  | 'legaloperators'
  | 'goinhouse'
  | 'company_site'
  | 'firecrawl'
export type EventType =
  | 'status_change'
  | 'note_added'
  | 'contact_added'
  | 'interview_scheduled'
  | 'follow_up'
  | 'custom'
export type UserTier = 'free' | 'pro' | 'expert'
export type ProfessionalType = 'law_firm' | 'legal_dept' | 'public_sector' | 'freelance' | 'other'
export type EmailAliasSource = 'random' | 'custom'
export type EmailAliasStatus = 'active' | 'disabled'

export interface Job {
  id: string
  title: string
  company: string
  url: string
  source_board: SourceBoard
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  benefits: string[]
  remote_label: string | null
  remote_reality: RemoteReality
  remote_notes: string | null
  enrichment_status: EnrichmentStatus
  enrichment_attempts: number
  posted_at: string | null
  raw_description: string
  suggested_leader_name: string | null
  suggested_leader_title: string | null
  suggested_leader_linkedin: string | null
  url_status: UrlStatus
  url_checked_at: string | null
  created_at: string
}

export interface PipelineEntry {
  id: string
  user_id: string
  job_id: string
  email_alias_id: string | null
  status: PipelineStatus
  created_at: string
  updated_at: string
  applied_at: string | null
}

export interface PipelineEntryWithJob extends PipelineEntry {
  job: Job
  email_alias?: UserEmailAlias | null
}

export interface Leader {
  id: string
  entry_id: string
  user_id: string
  name: string | null
  title: string | null
  linkedin_url: string | null
  confirmed: boolean
  notes: string | null
  created_at: string
}

export interface JobNote {
  id: string
  entry_id: string
  user_id: string
  content: string
  created_at: string
}

export interface Contact {
  id: string
  entry_id: string
  user_id: string
  name: string
  role: string | null
  email: string | null
  linkedin_url: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

export interface ApplicationEvent {
  id: string
  entry_id: string
  user_id: string
  event_type: EventType
  title: string
  description: string | null
  event_date: string
  created_at: string
}

export interface DashboardStats {
  total_tracked: number
  researching: number
  applied: number
  interview: number
  offer: number
  discarded: number
  applied_this_week: number
  interviews_this_week: number
  response_rate: number
}

export interface LinkedInInsight {
  category: 'headline' | 'photo' | 'about' | 'experience' | 'skills' | 'recommendations' | 'activity' | 'keywords' | 'other'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
}

export interface AccountProfile {
  user_id: string
  tier: UserTier
  paid_agent_settings?: Record<string, unknown>
  full_name: string | null
  current_role: string | null
  professional_type: ProfessionalType | null
  years_experience: number | null
  areas_of_expertise: string[]
  linkedin_url: string | null
  linkedin_data: {
    scraped_at?: string
    raw_text?: string
    insights?: LinkedInInsight[]
  } | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface EmailDomain {
  id: string
  domain: string
  label: string
  is_active: boolean
  allow_random: boolean
  allow_custom: boolean
  created_at: string
  updated_at: string
}

export interface UserEmailAlias {
  id: string
  user_id: string
  domain_id: string
  local_part: string
  address: string
  source: EmailAliasSource
  status: EmailAliasStatus
  is_primary: boolean
  provider: string | null
  provider_alias_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ── Marketplace types ──────────────────────────────────────────

export type CompanySize = 'startup' | 'smb' | 'midmarket' | 'enterprise'
export type CompanyRole = 'admin' | 'recruiter' | 'viewer'
export type RemotePreference = 'remote' | 'hybrid' | 'onsite' | 'any'
export type JobPostStatus = 'draft' | 'active' | 'paused' | 'closed' | 'expired'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'
export type MatchStatus = 'suggested' | 'viewed' | 'contacted' | 'applied' | 'rejected'
export type SubscriptionPlan = 'pro' | 'expert' | 'job_post' | 'talent_access' | 'enterprise'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'

export interface PublicProfile extends AccountProfile {
  public_headline: string | null
  public_bio: string | null
  skills: string[]
  certifications: string[]
  tools_used: string[]
  open_to_opportunities: boolean
  desired_salary_min: number | null
  desired_salary_max: number | null
  desired_salary_currency: string
  preferred_remote: RemotePreference | null
  preferred_locations: string[]
  profile_views: number
  is_public: boolean
}

export interface Company {
  id: string
  name: string
  domain: string | null
  logo_url: string | null
  description: string | null
  size: CompanySize | null
  industry: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export interface CompanyAccount {
  id: string
  company_id: string
  user_id: string
  role: CompanyRole
  created_at: string
}

export interface JobPost {
  id: string
  company_id: string
  posted_by: string
  title: string
  description: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  remote_type: 'remote' | 'hybrid' | 'onsite' | null
  location: string | null
  experience_min: number | null
  skills_required: string[]
  tools_required: string[]
  status: JobPostStatus
  expires_at: string | null
  views: number
  applications: number
  payment_status: PaymentStatus
  payment_id: string | null
  created_at: string
  updated_at: string
  company?: Company
}

export interface CandidateMatch {
  id: string
  job_post_id: string
  candidate_id: string
  match_score: number
  match_reasons: { reason: string; weight: number }[]
  status: MatchStatus
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string | null
  company_id: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}
