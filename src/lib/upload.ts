import { supabase } from '#/lib/supabase'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

function sanitizeUploadFile(file: File): { cleanExt: string } | null {
  if (!file || file.size > MAX_FILE_SIZE_BYTES) {
    console.error('File exceeds maximum size of 5MB')
    return null
  }
  const rawExt = (file.name.split('.').pop() || '').toLowerCase()
  const cleanExt = rawExt.replace(/[^a-z0-9]/g, '')
  if (!ALLOWED_EXTENSIONS.includes(cleanExt)) {
    console.error(`Invalid extension .${cleanExt}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
    return null
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    console.error(`Invalid MIME type ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`)
    return null
  }
  return { cleanExt }
}

export async function uploadBusinessPhoto(file: File, businessId: string): Promise<string | null> {
  const check = sanitizeUploadFile(file)
  if (!check) return null

  const cleanBusinessId = businessId.replace(/[^a-zA-Z0-9_-]/g, '')
  const fileName = `${cleanBusinessId}-${Date.now()}.${check.cleanExt}`
  
  const { error } = await supabase.storage
    .from('business-photos')
    .upload(fileName, file, { cacheControl: '3600', upsert: true })
  
  if (error) {
    console.error('Upload error:', error)
    return null
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('business-photos')
    .getPublicUrl(fileName)
  
  return publicUrl
}

export async function uploadComplaintPhoto(file: File, complaintId: string): Promise<string | null> {
  const check = sanitizeUploadFile(file)
  if (!check) return null

  const cleanComplaintId = complaintId.replace(/[^a-zA-Z0-9_-]/g, '')
  const fileName = `${cleanComplaintId}-${Date.now()}.${check.cleanExt}`
  
  const { error } = await supabase.storage
    .from('complaint-photos')
    .upload(fileName, file, { cacheControl: '3600', upsert: true })
  
  if (error) {
    console.error('Upload error:', error)
    return null
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('complaint-photos')
    .getPublicUrl(fileName)
  
  return publicUrl
}

export async function uploadOfficialPhoto(file: File, officialId?: string): Promise<string | null> {
  const check = sanitizeUploadFile(file)
  if (!check) return null

  const cleanOfficialId = (officialId || 'official').replace(/[^a-zA-Z0-9_-]/g, '')
  const fileName = `${cleanOfficialId}-${Date.now()}.${check.cleanExt}`
  
  const { error } = await supabase.storage
    .from('official-photos')
    .upload(fileName, file, { cacheControl: '3600', upsert: true })
  
  if (error) {
    console.error('Upload error:', error)
    return null
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('official-photos')
    .getPublicUrl(fileName)
  
  return publicUrl
}

export async function uploadAnnouncementPhoto(file: File, id?: string): Promise<string | null> {
  const check = sanitizeUploadFile(file)
  if (!check) return null

  const cleanId = (id || 'announcement').replace(/[^a-zA-Z0-9_-]/g, '')
  const fileName = `${cleanId}-${Date.now()}.${check.cleanExt}`

  const { error } = await supabase.storage
    .from('announcement-photos')
    .upload(fileName, file, { cacheControl: '3600', upsert: true })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('announcement-photos')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function uploadEventPhoto(file: File, id?: string): Promise<string | null> {
  const check = sanitizeUploadFile(file)
  if (!check) return null

  const cleanId = (id || 'event').replace(/[^a-zA-Z0-9_-]/g, '')
  const fileName = `${cleanId}-${Date.now()}.${check.cleanExt}`

  const { error } = await supabase.storage
    .from('event-photos')
    .upload(fileName, file, { cacheControl: '3600', upsert: true })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('event-photos')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function uploadAvatarPhoto(file: File, userId: string): Promise<string | null> {
  const check = sanitizeUploadFile(file)
  if (!check) return null

  const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '')
  const fileName = `avatar-${cleanUserId}-${Date.now()}.${check.cleanExt}`

  // Try 'avatars' bucket first, fallback to 'business-photos'
  const buckets = ['avatars', 'business-photos']

  for (const bucket of buckets) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName)
        return publicUrl
      }
    } catch (e) {
      console.warn(`Upload to ${bucket} failed:`, e)
    }
  }

  console.error('Failed to upload avatar photo to storage')
  return null
}

