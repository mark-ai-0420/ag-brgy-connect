-- Seed sample document requests for public tracking demonstration
INSERT INTO public.document_requests (
  id,
  document_type,
  purpose,
  status,
  barangay,
  control_number,
  notes,
  created_at,
  updated_at
) VALUES 
  (
    '8f3a29d1-1234-4567-89ab-cdef01234567',
    'barangay_clearance',
    'Local Employment Application (Cavite Technopark)',
    'ready',
    'daine_1',
    'BD1-8F3A29D1',
    'Approved and ready for claiming at Barangay Daine 1 Hall Operations Desk. Please present 1 valid government ID.',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '4e90b17a-2345-6789-01bc-def012345678',
    'certificate_of_indigency',
    'Medical & Financial Assistance (Indang RHU)',
    'in_review',
    'daine_2',
    'BD2-4E90B17A',
    'Documents undergoing administrative evaluation by the Barangay Secretary.',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '3 hours'
  ),
  (
    '20260881-3456-7890-12cd-ef0123456789',
    'certificate_of_residency',
    'Bank Account Opening & Proof of Address',
    'completed',
    'daine_1',
    'BD1-2026-0881',
    'Certificate issued and claimed with digital security QR seal.',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO UPDATE SET
  control_number = EXCLUDED.control_number,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes;
