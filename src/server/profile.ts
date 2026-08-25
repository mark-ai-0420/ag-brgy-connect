import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'

export const updateResidentAvatar = createServerFn({ method: 'POST' })
  .validator((data: { avatarUrl: string; profileId?: string }) => data)
  .handler(async ({ data }) => {
    const { user } = await getAuthSession()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const targetId = data.profileId || user.id

    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: data.avatarUrl })
      .eq('id', targetId)

    if (error) {
      console.error('Failed to update resident avatar:', error)
      throw new Error(error.message)
    }

    return { success: true, avatarUrl: data.avatarUrl }
  })
