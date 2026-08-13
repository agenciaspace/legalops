'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { COMMUNITY_CATEGORIES } from '@/lib/community'

async function getAuthenticatedMember() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/community')

  const { data: profile } = await supabase
    .from('account_profiles')
    .select('full_name, current_role')
    .eq('user_id', user.id)
    .maybeSingle()

  return { supabase, user, profile }
}

export async function createCommunityPost(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const requestedCategory = String(formData.get('category') ?? 'discussao')
  const category = COMMUNITY_CATEGORIES[requestedCategory] ? requestedCategory : 'discussao'

  if (title.length < 3 || title.length > 180 || body.length < 3 || body.length > 10000) return

  const { supabase, user, profile } = await getAuthenticatedMember()
  const fallbackName = user.email?.split('@')[0] || 'Membro LegalOps'

  const { error } = await supabase.from('community_posts').insert({
    author_id: user.id,
    author_name: profile?.full_name?.trim() || fallbackName,
    author_role: profile?.current_role?.trim() || null,
    category,
    title,
    body,
    visibility: 'members',
  })

  if (!error) {
    revalidatePath('/community')
    redirect('/community')
  }
}

export async function toggleCommunityPostLike(formData: FormData) {
  const postId = String(formData.get('post_id') ?? '')
  if (!postId) return

  const { supabase, user } = await getAuthenticatedMember()
  const { data: existing } = await supabase
    .from('community_post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('community_post_likes').delete().eq('post_id', postId).eq('user_id', user.id)
  } else {
    await supabase.from('community_post_likes').insert({ post_id: postId, user_id: user.id })
  }

  revalidatePath('/community')
}
export async function createCommunityComment(formData: FormData) {
  const postId = String(formData.get('post_id') ?? '')
  const body = String(formData.get('body') ?? '').trim()
  if (!postId || body.length < 1 || body.length > 3000) return

  const { supabase, user, profile } = await getAuthenticatedMember()
  const fallbackName = user.email?.split('@')[0] || 'Membro LegalOps'

  await supabase.from('community_comments').insert({
    post_id: postId,
    author_id: user.id,
    author_name: profile?.full_name?.trim() || fallbackName,
    body,
  })

  revalidatePath('/community')
}
