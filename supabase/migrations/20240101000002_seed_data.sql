-- Seed Data for Barangay Daine, Indang, Cavite

-- Emergency Contacts
INSERT INTO public.emergency_contacts (name, label, phone, display_order) VALUES
('Barangay Daine Hall', 'Primary Hotline', '0917-555-0101', 1),
('Barangay Daine Health Center', 'Medical & Maternal Care', '0928-555-0102', 2),
('Indang Municipal Police Station', 'Police Emergency', '(046) 415-0211', 3),
('Bureau of Fire Protection - Indang', 'Fire Emergency', '(046) 415-0322', 4),
('MDRRMO Indang Rescue Team', 'Disaster & Medical Rescue', '0998-555-0103', 5);

-- Announcements
INSERT INTO public.announcements (title, body, pinned) VALUES
(
  'Barangay Assembly & General Meeting',
  'Notice to all residents of Barangay Daine: The First Semester Barangay Assembly will take place this coming Sunday at 8:00 AM in the Barangay Covered Court. Agenda includes project reports, financial transparency updates, and open forum.',
  true
),
(
  'Scheduled Power Interruption Notice',
  'MERALCO announced a scheduled power maintenance affecting Sitio 1 and Sitio 2 on Thursday from 9:00 AM to 3:00 PM for transformer upgrading and line clearing.',
  false
),
(
  'Free Medical & Dental Mission',
  'In cooperation with the Municipal Health Office, Barangay Daine will host a Free Medical and Dental Mission on Saturday, 8:00 AM - 12:00 PM at the Barangay Health Center. Free checkups and medicine will be distributed.',
  false
);

-- Events
INSERT INTO public.events (title, description, location, starts_at, ends_at) VALUES
(
  'Barangay Daine Annual Fiesta & Cultural Night',
  'Join us for our annual barangay fiesta featuring local cultural performances, food stalls, and the Barangay Talent Showcase!',
  'Barangay Daine Plaza & Covered Court',
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '10 days 6 hours'
),
(
  'Livelihood & Small Business Seminar',
  'Free training on food processing, digital marketing for micro-entrepreneurs, and DTI registration guidance for local business owners.',
  'Barangay Session Hall',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days 4 hours'
),
(
  'Community Clean-Up & Tree Planting Drive',
  'Let us keep Barangay Daine green and clean! Bring your gardening tools and join your fellow neighbors in cleaning waterways and planting fruit-bearing trees.',
  'Sitio 3 River Park & Main Road',
  NOW() + INTERVAL '21 days',
  NOW() + INTERVAL '21 days 3 hours'
);

-- Sample Approved Business Listings
INSERT INTO public.businesses (name, category, description, address, phone, hours, status, map_url) VALUES
(
  'Mang Berto Sari-Sari Store',
  'Sari-Sari Store',
  'Complete daily household needs, cold beverages, mobile load, and LPG refills.',
  'Sitio 1, Main Road, Brgy. Daine',
  '0917-111-2233',
  'Mon-Sun: 6:00 AM - 9:00 PM',
  'approved',
  'https://www.openstreetmap.org/#map=17/14.1950/120.8750'
),
(
  'Aling Rosa Carenderia & Catering',
  'Eatery / Carenderia',
  'Home-cooked Caviteño dishes, budget lutong bahay meals, halo-halo, and party trays for all occasions.',
  'Near Barangay Hall, Brgy. Daine',
  '0920-222-3344',
  'Mon-Sat: 7:00 AM - 7:00 PM',
  'approved',
  'https://www.openstreetmap.org/#map=17/14.1955/120.8755'
),
(
  'Daine Crystal Pure Water Refilling Station',
  'Water Station',
  'Purified and mineral drinking water. Free delivery within Barangay Daine for 3 or more containers.',
  'Purok 2, Brgy. Daine',
  '0999-333-4455',
  'Mon-Sat: 8:00 AM - 6:00 PM',
  'approved',
  'https://www.openstreetmap.org/#map=17/14.1960/120.8760'
),
(
  'Ate Grace Beauty Salon & Spa',
  'Salon',
  'Haircut, rebond, hair color, manicure, pedicure, and foot spa services at affordable barangay prices.',
  'Sitio 2, Commercial Strip, Brgy. Daine',
  '0918-444-5566',
  'Tue-Sun: 9:00 AM - 7:00 PM',
  'approved',
  'https://www.openstreetmap.org/#map=17/14.1965/120.8765'
),
(
  'Koyas Motorcycle Parts & Repair Shop',
  'Repair Shop',
  'Tune-up, vulcanizing, oil change, spare parts, and motorcycle diagnostics by experienced mechanics.',
  'Provincial Road corner Sitio 3, Brgy. Daine',
  '0927-555-6677',
  'Mon-Sat: 8:00 AM - 6:00 PM',
  'approved',
  'https://www.openstreetmap.org/#map=17/14.1970/120.8770'
),
(
  'St. Martin Pharmacy & General Merchandise',
  'Pharmacy',
  'Generic and branded medicines, vitamins, medical supplies, baby needs, and personal hygiene products.',
  'Near Public Elementary School, Brgy. Daine',
  '0939-666-7788',
  'Mon-Sun: 7:00 AM - 8:00 PM',
  'approved',
  'https://www.openstreetmap.org/#map=17/14.1975/120.8775'
),
(
  'FreshBubble Wash & Dry Laundromat',
  'Laundry',
  'Self-service and full-service drop-off laundry. Wash, dry, and fold within 2 hours.',
  'Purok 1, Brgy. Daine',
  '0915-777-8899',
  'Mon-Sun: 7:00 AM - 8:00 PM',
  'approved',
  'https://www.openstreetmap.org/#map=17/14.1980/120.8780'
),
(
  'Mang Jose Tailoring & Alteration Shop',
  'Tailoring',
  'Custom school uniforms, office attire, curtains, and fast clothing alterations.',
  'Sitio 1, Brgy. Daine',
  '0908-888-9900',
  'Mon-Sat: 8:00 AM - 5:00 PM',
  'approved',
  'https://www.openstreetmap.org/#map=17/14.1985/120.8785'
);
