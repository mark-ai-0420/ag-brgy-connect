-- ============================================================================
-- PRODUCTION SEED RESET MIGRATION
-- ============================================================================
-- WARNING: DESTRUCTIVE MIGRATION
-- This migration will completely wipe existing test data and insert realistic
-- mock data for comprehensive testing of Daine 1 and Daine 2 separation.
-- ============================================================================

-- 1. WIPE EVERYTHING (CASCADE deletes related rows in profiles, user_roles, etc.)
DELETE FROM auth.users;
TRUNCATE public.events CASCADE;
TRUNCATE public.announcements CASCADE;
TRUNCATE public.barangay_officials CASCADE;
TRUNCATE public.emergency_contacts CASCADE;
TRUNCATE public.complaints CASCADE;
TRUNCATE public.document_requests CASCADE;
TRUNCATE public.businesses CASCADE;

-- Insert Admins
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'superadmin@brgyconnect.app', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin_daine1@brgyconnect.app', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin_daine2@brgyconnect.app', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

-- Insert Residents
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('b1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'juan.delacruz@gmail.com', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('b1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maria.santos@yahoo.com', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('b1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pedro.reyes@hotmail.com', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('b2000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana.mendoza@gmail.com', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('b2000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'luis.garcia@gmail.com', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('b2000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carmen.villanueva@yahoo.com', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

-- Update Profiles (Trigger already created these, so we UPDATE them)
UPDATE public.profiles SET full_name = 'Super Admin', phone = '0917-000-0000', barangay = 'daine_1' WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET full_name = 'Admin Daine 1', phone = '0917-111-1111', barangay = 'daine_1' WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET full_name = 'Admin Daine 2', phone = '0917-222-2222', barangay = 'daine_2' WHERE id = 'a1000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET full_name = 'Juan Dela Cruz', phone = '0918-123-4567', address = 'Sitio Ilaya, Daine 1', barangay = 'daine_1' WHERE id = 'b1000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET full_name = 'Maria Santos', phone = '0918-123-4568', address = 'Purok 1, Daine 1', barangay = 'daine_1' WHERE id = 'b1000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET full_name = 'Pedro Reyes', phone = '0918-123-4569', address = 'Purok 2, Daine 1', barangay = 'daine_1' WHERE id = 'b1000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET full_name = 'Ana Mendoza', phone = '0918-987-6541', address = 'Sitio Centro, Daine 2', barangay = 'daine_2' WHERE id = 'b2000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET full_name = 'Luis Garcia', phone = '0918-987-6542', address = 'Purok 3, Daine 2', barangay = 'daine_2' WHERE id = 'b2000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET full_name = 'Carmen Villanueva', phone = '0918-987-6543', address = 'Purok 4, Daine 2', barangay = 'daine_2' WHERE id = 'b2000000-0000-0000-0000-000000000003';

-- Update User Roles (Trigger already created these as 'resident' and 'daine_1', so we UPDATE them)
UPDATE public.user_roles SET role = 'admin', barangay = 'both' WHERE user_id = 'a1000000-0000-0000-0000-000000000001';
UPDATE public.user_roles SET role = 'admin', barangay = 'daine_1' WHERE user_id = 'a1000000-0000-0000-0000-000000000002';
UPDATE public.user_roles SET role = 'admin', barangay = 'daine_2' WHERE user_id = 'a1000000-0000-0000-0000-000000000003';
UPDATE public.user_roles SET role = 'resident', barangay = 'daine_1' WHERE user_id IN ('b1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003');
UPDATE public.user_roles SET role = 'resident', barangay = 'daine_2' WHERE user_id IN ('b2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000003');

-- 2. SEED OFFICIALS
INSERT INTO public.barangay_officials (name, position, display_order, barangay) VALUES
  ('Hon. Roberto V. Panganiban', 'Punong Barangay', 1, 'daine_1'),
  ('Hon. Maria E. Cruz', 'Kagawad (Peace & Order)', 2, 'daine_1'),
  ('Hon. Jose M. Santos', 'Kagawad (Health)', 3, 'daine_1'),
  ('Elena B. Reyes', 'Barangay Secretary', 4, 'daine_1'),
  ('Ricardo T. Gonzales', 'Barangay Treasurer', 5, 'daine_1'),
  
  ('Hon. Eduardo L. Villanueva', 'Punong Barangay', 1, 'daine_2'),
  ('Hon. Carmen R. Garcia', 'Kagawad (Infrastructure)', 2, 'daine_2'),
  ('Hon. Luis A. Mendoza', 'Kagawad (Education)', 3, 'daine_2'),
  ('Teresa M. Fernandez', 'Barangay Secretary', 4, 'daine_2'),
  ('Mario C. Lopez', 'Barangay Treasurer', 5, 'daine_2');

-- 3. SEED EMERGENCY CONTACTS
INSERT INTO public.emergency_contacts (name, label, phone, display_order, scope) VALUES
  ('MDRRMO Indang (Rescue)', 'Disaster Response', '0998-555-0103', 1, 'both'),
  ('PNP Indang Station', 'Police Desk', '(046) 415-0211', 2, 'both'),
  ('BFP Indang Fire Station', 'Fire Emergency', '(046) 415-0322', 3, 'both'),
  ('Daine 1 Tanod Patrol', 'Peace & Order Desk', '0928-555-0101', 4, 'daine_1'),
  ('Daine 1 Health Center', 'First Aid', '0928-555-0103', 5, 'daine_1'),
  ('Daine 2 Tanod Patrol', 'Peace & Order Desk', '0928-555-0102', 6, 'daine_2'),
  ('Daine 2 Health Center', 'First Aid', '0928-555-0104', 7, 'daine_2');

-- 4. SEED ANNOUNCEMENTS
INSERT INTO public.announcements (title, body, pinned, author_id, scope, created_at) VALUES
  ('Oplan Linis Barangay - All Sitios', 'Join us for a massive cleanup drive across all puroks. Bring your own brooms and dustpans. Free snacks will be provided by the local government.', TRUE, 'a1000000-0000-0000-0000-000000000001', 'both', now() - interval '2 days'),
  ('Distribution of Relief Goods (Daine 1)', 'To all residents of Daine 1 affected by the recent typhoon, please proceed to the covered court tomorrow at 8:00 AM to claim your relief packs. Bring your valid ID or Barangay Certificate.', TRUE, 'a1000000-0000-0000-0000-000000000002', 'daine_1', now() - interval '1 day'),
  ('Water Supply Interruption Advisory', 'Maynilad has announced a water interruption in Daine 2 due to pipe maintenance. Please store enough water for 12 hours starting tonight at 10 PM.', FALSE, 'a1000000-0000-0000-0000-000000000003', 'daine_2', now() - interval '3 hours'),
  ('Free Anti-Rabies Vaccination for Pets', 'The Municipal Agriculture Office will be visiting Daine 1 and Daine 2 this weekend for free anti-rabies vaccination. Dogs and cats aged 3 months and above are eligible.', FALSE, 'a1000000-0000-0000-0000-000000000001', 'both', now() - interval '5 days');

-- 5. SEED EVENTS
INSERT INTO public.events (title, description, location, starts_at, ends_at, scope) VALUES
  ('Barangay Assembly (1st Semester)', 'State of the Barangay Address (SOBA) and financial report presentation to all residents of Daine 1.', 'Daine 1 Covered Court', now() + interval '5 days', now() + interval '5 days 4 hours', 'daine_1'),
  ('Inter-Purok Basketball League Opening', 'Opening ceremonies for the Summer Basketball League. Teams from all puroks of Daine 2 will compete.', 'Daine 2 Plaza Court', now() + interval '7 days', now() + interval '7 days 5 hours', 'daine_2'),
  ('Medical Mission & Free Checkup', 'Free medical consultation, blood sugar testing, and medicine distribution for senior citizens of both barangays.', 'Indang Municipal Health Center', now() + interval '14 days', now() + interval '14 days 8 hours', 'both');

-- 6. SEED COMPLAINTS
INSERT INTO public.complaints (complainant_id, is_anonymous, title, category, description, status, priority, location, incident_date, barangay, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000001', FALSE, 'Excessive Noise from Videoke', 'Noise Complaint', 'Neighbor at Purok 1 has been playing loud videoke past 11 PM for three consecutive nights.', 'pending', 'low', 'Purok 1, Daine 1', now() - interval '1 day', 'daine_1', now() - interval '1 day'),
  ('b1000000-0000-0000-0000-000000000002', TRUE, 'Illegal Dumping of Garbage', 'Sanitation & Trash', 'Someone is dumping construction debris along the creek near Sitio Ilaya.', 'investigating', 'medium', 'Sitio Ilaya Creek', now() - interval '3 days', 'daine_1', now() - interval '2 days'),
  ('b2000000-0000-0000-0000-000000000001', FALSE, 'Stray Dogs Threatening Children', 'Public Safety / Nuisance', 'A pack of stray dogs is roaming near the elementary school, aggressive towards passing kids.', 'scheduled_hearing', 'high', 'Near Daine 2 Elementary School', now() - interval '5 days', 'daine_2', now() - interval '4 days'),
  ('b2000000-0000-0000-0000-000000000002', FALSE, 'Property Boundary Dispute', 'Boundary / Property', 'My neighbor is building a fence that encroaches 1 meter into my property lot.', 'resolved', 'medium', 'Purok 3, Daine 2', now() - interval '10 days', 'daine_2', now() - interval '10 days');

-- 7. SEED DOCUMENT REQUESTS
INSERT INTO public.document_requests (requester_id, document_type, purpose, status, notes, barangay, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'barangay_clearance', 'Pre-employment requirement for factory worker', 'pending', NULL, 'daine_1', now() - interval '2 hours'),
  ('b1000000-0000-0000-0000-000000000003', 'certificate_of_indigency', 'Requirement for educational scholarship', 'ready', 'Please bring valid student ID upon claiming.', 'daine_1', now() - interval '1 day'),
  ('b2000000-0000-0000-0000-000000000001', 'business_permit', 'Renewal of permit for Sari-Sari Store', 'in_review', 'Waiting for signature of the Punong Barangay.', 'daine_2', now() - interval '3 hours'),
  ('b2000000-0000-0000-0000-000000000003', 'barangay_id', 'For opening a bank account', 'completed', 'Claimed by requester.', 'daine_2', now() - interval '5 days');

-- 8. SEED BUSINESSES
INSERT INTO public.businesses (owner_id, name, category, description, status) VALUES
  ('b1000000-0000-0000-0000-000000000002', 'Aling Maria Sari-Sari Store', 'Sari-Sari Store', 'Sells basic daily necessities, canned goods, and cold drinks.', 'approved'),
  ('b1000000-0000-0000-0000-000000000003', 'Pedro Water Refilling Station', 'Water Station', 'Purified and mineral drinking water. We deliver!', 'approved'),
  ('b2000000-0000-0000-0000-000000000002', 'Lolo Luis Auto Repair Shop', 'Repair Shop', 'Vulcanizing, oil change, and minor engine repairs.', 'pending');

