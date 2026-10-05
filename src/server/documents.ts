import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createSupabaseServerClient } from '#/lib/supabase.server';
import { getTenantBarangay } from '#/server/tenant';

export interface TrackingStage {
  step: number;
  label: string;
  description: string;
  state: 'completed' | 'current' | 'upcoming' | 'rejected';
  timestamp?: string;
}

export interface DocumentTrackingResult {
  found: boolean;
  request?: {
    id: string;
    control_number: string;
    document_type: string;
    document_title: string;
    barangay: string;
    barangay_id?: string;
    barangay_name: string;
    status: 'pending' | 'in_review' | 'ready' | 'completed' | 'rejected';
    status_label: string;
    purpose: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    timeline: TrackingStage[];
    hall_info: {
      address: string;
      hours: string;
      contact: string;
    };
  };
  error?: string;
}

const DOCUMENT_TITLES: Record<string, string> = {
  barangay_clearance: 'Barangay Clearance',
  barangay_id: 'Barangay Resident ID',
  certificate_of_residency: 'Certificate of Residency',
  certificate_of_indigency: 'Certificate of Indigency',
  business_permit: 'Barangay Business Clearance',
  other: 'Barangay Certification',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const trackDocumentRequest = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z
      .object({
        referenceCode: z.string().trim().min(1, 'Please enter a reference code or Request ID'),
      })
      .parse(data)
  )
  .handler(async ({ data }): Promise<DocumentTrackingResult> => {
    try {
      const supabase = createSupabaseServerClient();
      const code = data.referenceCode.trim();

      // 1. Try secure RPC function (runs under SECURITY DEFINER, works seamlessly for anonymous tracking)
      const { data: rpcRows, error: rpcError } = await supabase.rpc('get_verified_document', {
        lookup_code: code,
      });

      let records: any[] = [];
      if (!rpcError && Array.isArray(rpcRows) && rpcRows.length > 0) {
        records = rpcRows;
      } else {
        // 2. Direct query fallback
        let query = supabase.from('document_requests').select('*');
        if (UUID_REGEX.test(code)) {
          query = query.eq('id', code);
        } else {
          query = query.ilike('control_number', code);
        }
        const { data: fallbackRecords, error: fallbackError } = await query.limit(1);
        if (fallbackRecords && fallbackRecords.length > 0) {
          records = fallbackRecords;
        } else if (fallbackError && (!rpcRows || rpcRows.length === 0)) {
          console.warn('Notice querying document request fallback:', fallbackError.message);
        }
      }

      if (!records || records.length === 0) {
        return {
          found: false,
          error: `No document request found for reference code "${code}". Please check your tracking number (e.g., BD1-8F3A29D1, BD2-4E90B17A, or request ID).`,
        };
      }

      const req = records[0];
      const tenant = await getTenantBarangay({ data: req.barangay_id || req.barangay });
      const barangayUnit = tenant.slug;
      const barangayName = req.barangay_name || tenant.name;
      const codePrefix = req.barangay_code_prefix || tenant.code_prefix || (req.barangay === 'daine_2' ? 'BD2' : 'BD1');
      const ctrlNo = req.control_number || `${codePrefix}-${req.id.slice(0, 8).toUpperCase()}`;
      const docTitle = DOCUMENT_TITLES[req.document_type] || req.document_type.replace(/_/g, ' ').toUpperCase();

      let statusLabel = 'Submitted';
      if (req.status === 'in_review') statusLabel = 'Under Review';
      else if (req.status === 'ready') statusLabel = 'Ready for Pickup';
      else if (req.status === 'completed') statusLabel = 'Issued / Completed';
      else if (req.status === 'rejected') statusLabel = 'Requires Attention';

      // Construct lifecycle timeline
      const timeline: TrackingStage[] = [
        {
          step: 1,
          label: 'Request Submitted',
          description: 'Document request logged in the barangay registry.',
          state: 'completed',
          timestamp: req.created_at,
        },
        {
          step: 2,
          label: 'Secretary Verification',
          description: 'Records and resident eligibility review.',
          state:
            req.status === 'rejected'
              ? 'rejected'
              : req.status === 'pending'
                ? 'current'
                : 'completed',
          timestamp: req.status !== 'pending' ? req.updated_at : undefined,
        },
        {
          step: 3,
          label: 'Barangay Captain Sign-off',
          description: 'Executive clearance and security QR seal generation.',
          state:
            req.status === 'rejected'
              ? 'rejected'
              : req.status === 'pending'
                ? 'upcoming'
                : req.status === 'in_review'
                  ? 'current'
                  : 'completed',
          timestamp: ['ready', 'completed'].includes(req.status) ? req.updated_at : undefined,
        },
        {
          step: 4,
          label: req.status === 'completed' ? 'Claimed / Completed' : 'Ready for Pickup',
          description:
            req.status === 'completed'
              ? 'Certificate claimed by resident.'
              : 'Available at the Barangay Hall Operations Desk.',
          state:
            req.status === 'rejected'
              ? 'rejected'
              : req.status === 'completed'
                ? 'completed'
                : req.status === 'ready'
                  ? 'current'
                  : 'upcoming',
          timestamp: req.status === 'completed' ? req.updated_at : undefined,
        },
      ];

      const hallInfo = {
        address: `${tenant.name} Hall, ${tenant.municipality}, ${tenant.province}`,
        hours: 'Monday – Friday: 8:00 AM – 5:00 PM',
        contact: tenant.emergency_hotline || tenant.police_hotline || '(046) 415-0100',
      };

      return {
        found: true,
        request: {
          id: req.id,
          control_number: ctrlNo,
          document_type: req.document_type,
          document_title: docTitle,
          barangay: barangayUnit,
          barangay_id: req.barangay_id || tenant.id,
          barangay_name: barangayName,
          status: req.status,
          status_label: statusLabel,
          purpose: req.purpose,
          notes: req.notes,
          created_at: req.created_at,
          updated_at: req.updated_at,
          timeline,
          hall_info: hallInfo,
        },
      };
    } catch (err) {
      console.error('Error in trackDocumentRequest:', err);
      return { found: false, error: (err as Error).message };
    }
  });
