import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'

const updateAvatarSchema = z.object({
  avatarUrl: z.string().url().max(500),
})

export const updateResidentAvatar = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updateAvatarSchema.parse(data))
  .handler(async ({ data }) => {
    const { user } = await getAuthSession()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: data.avatarUrl })
      .eq('id', user.id)

    if (error) {
      console.error('Failed to update resident avatar:', error)
      throw new Error(error.message)
    }

    return { success: true, avatarUrl: data.avatarUrl }
  })
