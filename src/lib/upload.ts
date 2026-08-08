import { createBrowserClient } from '@supabase/ssr'

export async function uploadBusinessPhoto(file: File, businessId: string): Promise<string | null> {
  const supabase = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
  
  const ext = file.name.split('.').pop()
  const fileName = `${businessId}-${Date.now()}.${ext}`
  
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
  const supabase = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
  
  const ext = file.name.split('.').pop()
  const fileName = `${complaintId}-${Date.now()}.${ext}`
  
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
