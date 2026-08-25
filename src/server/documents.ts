import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createSupabaseServerClient } from '#/lib/supabase.server';

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
    barangay: 'daine_1' | 'daine_2';
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

      let query = supabase.from('document_requests').select('*');

      if (UUID_REGEX.test(code)) {
        query = query.eq('id', code);
      } else {
        // Strict exact match (case-insensitive) on control_number
        query = query.ilike('control_number', code);
      }

      const { data: records, error } = await query.limit(1);

      if (error) {
        console.error('Error searching document request:', error);
        return { found: false, error: 'Database query failed' };
      }

      if (!records || records.length === 0) {
        const upperCode = code.toUpperCase();
        // Allow explicit DEMO sandbox code for demo/testing mode only
        if (upperCode === 'DEMO' || upperCode === 'DEMO-2026') {
          const timeline: TrackingStage[] = [
            {
              step: 1,
              label: 'Request Submitted',
              description: 'Document request logged in the barangay registry.',
              state: 'completed',
              timestamp: '2026-08-18T08:00:00.000Z',
            },
            {
              step: 2,
              label: 'Secretary Verification',
              description: 'Resident records and eligibility verified by Barangay Secretary.',
              state: 'completed',
              timestamp: '2026-08-18T09:30:00.000Z',
            },
            {
              step: 3,
              label: 'Barangay Captain Sign-off',
              description: 'Executive clearance and security QR seal generation.',
              state: 'completed',
              timestamp: '2026-08-18T10:00:00.000Z',
            },
            {
              step: 4,
              label: 'Claimed / Completed',
              description: 'Official certificate claimed with verified digital QR seal.',
              state: 'completed',
              timestamp: '2026-08-18T10:30:00.000Z',
            },
          ];

          return {
            found: true,
            request: {
              id: '00000000-0000-0000-0000-000000000001',
              control_number: 'BD1-DEMO-2026',
              document_type: 'barangay_clearance',
              document_title: 'Barangay Clearance',
              barangay: 'daine_1',
              barangay_name: 'Barangay Daine 1',
              status: 'completed',
              status_label: 'Issued / Completed',
              purpose: 'Official Demonstration & System Testing',
              notes: 'Demo verification record.',
              created_at: '2026-08-18T08:00:00.000Z',
              updated_at: '2026-08-18T10:30:00.000Z',
              timeline,
              hall_info: {
                address: 'Barangay Daine 1 Hall, Sitio Centro, Purok 2, Indang, Cavite',
                hours: 'Monday – Friday: 8:00 AM – 5:00 PM',
                contact: '0917-123-0001 / (046) 415-0100',
              },
            },
          };
        }

        return {
          found: false,
          error: `No document request found for reference code "${code}". Please check your tracking number (e.g., BD1-8F3A29D1, BD2-4E90B17A, or request ID).`,
        };
      }

      const req = records[0];
      const isDaine2 = req.barangay === 'daine_2';
      const barangayUnit = isDaine2 ? 'daine_2' : 'daine_1';
      const barangayName = isDaine2 ? 'Barangay Daine 2' : 'Barangay Daine 1';
      const ctrlNo = req.control_number || `${isDaine2 ? 'BD2-' : 'BD1-'}${req.id.slice(0, 8).toUpperCase()}`;
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

      const hallInfo = isDaine2
        ? {
            address: 'Barangay Daine 2 Hall, Purok 3, Indang, Cavite',
            hours: 'Monday – Friday: 8:00 AM – 5:00 PM',
            contact: '0917-123-0002 / (046) 415-0200',
          }
        : {
            address: 'Barangay Daine 1 Hall, Sitio Centro, Purok 2, Indang, Cavite',
            hours: 'Monday – Friday: 8:00 AM – 5:00 PM',
            contact: '0917-123-0001 / (046) 415-0100',
          };

      return {
        found: true,
        request: {
          id: req.id,
          control_number: ctrlNo,
          document_type: req.document_type,
          document_title: docTitle,
          barangay: barangayUnit,
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
