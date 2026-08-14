'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const EMPLOYER_TYPES = new Set(['law_firm', 'legal_department'])
const WORK_MODELS = new Set(['remote', 'hybrid', 'onsite'])

export async function submitEmployerJobRequest(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/employers/jobs/new')

  const employerType = String(formData.get('employer_type') ?? '')
  const organizationName = String(formData.get('organization_name') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const workModel = String(formData.get('work_model') ?? '')
  const description = String(formData.get('description') ?? '').trim()
  const applicationUrl = String(formData.get('application_url') ?? '').trim()
  const contactEmail = String(formData.get('contact_email') ?? '').trim()
  const safeEmployerType = EMPLOYER_TYPES.has(employerType) ? employerType : 'law_firm'

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
  const validApplicationUrl = !applicationUrl || /^https?:\/\//i.test(applicationUrl)
  const valid = EMPLOYER_TYPES.has(employerType)
    && WORK_MODELS.has(workModel)
    && organizationName.length >= 2
    && organizationName.length <= 160
    && title.length >= 3
    && title.length <= 180
    && description.length >= 30
    && description.length <= 10000
    && location.length <= 160
    && validEmail
    && contactEmail.length <= 254
    && validApplicationUrl
    && applicationUrl.length <= 2048

  if (!valid) redirect(`/employers/jobs/new?type=${safeEmployerType}&error=1`)

  const { error } = await supabase.from('employer_job_requests').insert({
    user_id: user.id,
    employer_type: employerType,
    organization_name: organizationName,
    title,
    location: location || null,
    work_model: workModel,
    description,
    application_url: applicationUrl || null,
    contact_email: contactEmail,
    status: 'submitted',
  })

  if (error) redirect(`/employers/jobs/new?type=${safeEmployerType}&error=1`)
  redirect(`/employers/jobs/new?type=${safeEmployerType}&saved=1`)
}
