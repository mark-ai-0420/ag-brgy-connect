import { useEffect, useState } from 'react'
import { supabase } from '#/lib/supabase'
import { toast } from 'sonner'

const DOC_TYPE_LABELS: Record<string, string> = {
  barangay_clearance: 'Barangay Clearance',
  barangay_id: 'Barangay ID',
  certificate_of_residency: 'Certificate of Residency',
  certificate_of_indigency: 'Certificate of Indigency',
  business_permit: 'Business Permit',
  other: 'Document',
}

const STATUS_MESSAGES: Record<string, string> = {
  in_review: 'is now being reviewed',
  ready: 'is ready for pickup! 🎉',
  completed: 'has been completed ✅',
  rejected: 'could not be processed ❌',
}

export function useRealtimeNotifications(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    

    const channel = supabase
      .channel('doc-request-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'document_requests',
          filter: `requester_id=eq.${userId}`,
        },
        (payload) => {
          const newRecord = payload.new as any
          const oldRecord = payload.old as any
          
          if (newRecord.status !== oldRecord.status) {
            const docLabel = DOC_TYPE_LABELS[newRecord.document_type] ?? 'Your document'
            const statusMsg = STATUS_MESSAGES[newRecord.status] ?? `status updated to ${newRecord.status}`
            
            toast.info(`${docLabel} ${statusMsg}`, {
              duration: 8000,
              description: newRecord.notes ? `Note: ${newRecord.notes}` : undefined,
            })
            
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    const complaintChannel = supabase
      .channel('complaint-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `complainant_id=eq.${userId}`,
        },
        (payload) => {
          const newRecord = payload.new as any
          const oldRecord = payload.old as any
          
          if (newRecord.status !== oldRecord.status) {
            const title = newRecord.title ?? 'Complaint'
            const statusLabels: Record<string, string> = {
              investigating: 'is now under investigation 🔍',
              scheduled_hearing: 'has a hearing scheduled ⚖️',
              resolved: 'has been resolved ✅',
              dismissed: 'was reviewed and closed ℹ️',
            }
            const statusMsg = statusLabels[newRecord.status] ?? `status updated to ${newRecord.status}`
            
            toast.info(`Complaint "${title}" ${statusMsg}`, {
              duration: 8000,
              description: newRecord.admin_notes ? `Notes: ${newRecord.admin_notes}` : undefined,
            })
            
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(complaintChannel)
    }
  }, [userId])

  return { unreadCount, clearUnread: () => setUnreadCount(0) }
}
