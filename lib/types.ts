export type RemoteReality =
  | 'fully_remote'
  | 'remote_with_travel'
  | 'hybrid_disguised'
  | 'onsite'
  | 'unknown'

export type EnrichmentStatus = 'pending' | 'done' | 'failed'

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
export type UserTier = 'free' | 'paid'
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

export type CompanyPlan = 'free' | 'basic' | 'premium' | 'enterprise'
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
export type CompanyJobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'expired'
export type RemotePolicy = 'fully_remote' | 'remote_with_travel' | 'hybrid' | 'onsite' | 'unknown'
export type Seniority = 'junior' | 'mid' | 'senior' | 'lead' | 'head'
export type ContractType = 'clt' | 'pj' | 'intern' | 'temporary' | 'freelance'
export type MatchStatus = 'new' | 'viewed' | 'interested' | 'applied' | 'dismissed'
export type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'hired'

export interface CompanyProfile {
  id: string
  user_id: string
  company_name: string
  cnpj: string | null
  sector: string | null
  size: CompanySize | null
  website: string | null
  logo_url: string | null
  description: string | null
  plan: CompanyPlan
  plan_expires_at: string | null
  jobs_posted_count: number
  jobs_limit: number
  created_at: string
  updated_at: string
}

export interface CompanyJob {
  id: string
  company_id: string
  title: string
  description: string
  location: string | null
  remote_policy: RemotePolicy
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  benefits: string[]
  required_experience_years: number | null
  professional_type: ProfessionalType | null
  areas_of_expertise: string[]
  seniority: Seniority | null
  contract_type: ContractType
  status: CompanyJobStatus
  featured: boolean
  expires_at: string | null
  views_count: number
  applications_count: number
  created_at: string
  updated_at: string
}

export interface CompanyJobWithCompany extends CompanyJob {
  company: Pick<CompanyProfile, 'company_name' | 'logo_url' | 'sector' | 'size'>
}

export interface ScoreBreakdown {
  expertise_overlap: number
  experience_fit: number
  professional_type_match: number
  remote_preference: number
  title_relevance: number
}

export interface JobMatch {
  id: string
  user_id: string
  company_job_id: string | null
  crawled_job_id: string | null
  score: number
  score_breakdown: ScoreBreakdown
  status: MatchStatus
  notified: boolean
  created_at: string
  updated_at: string
}

export interface JobMatchWithDetails extends JobMatch {
  company_job?: CompanyJobWithCompany | null
  crawled_job?: Job | null
}

export interface JobApplication {
  id: string
  user_id: string
  company_job_id: string
  match_id: string | null
  cover_letter: string | null
  status: ApplicationStatus
  company_notes: string | null
  created_at: string
  updated_at: string
}
