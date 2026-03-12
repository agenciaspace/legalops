import { createServerSupabaseClient } from '@/lib/supabase-server'
import { KanbanBoard } from '@/components/KanbanBoard'
import type { PipelineEntryWithJob } from '@/lib/types'

export default async function PipelinePage() {
  const supabase = await createServerSupabaseClient()

  const { data: entries } = await supabase
    .from('user_pipeline_entries')
    .select('*, job:jobs(*)')
    .order('created_at', { ascending: false })

  return <KanbanBoard initialEntries={(entries ?? []) as PipelineEntryWithJob[]} />
}
