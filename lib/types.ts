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

export type SourceBoard = 'greenhouse' | 'lever' | 'gupy' | 'workable' | 'indeed'

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
  status: PipelineStatus
  created_at: string
}

export interface PipelineEntryWithJob extends PipelineEntry {
  job: Job
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
