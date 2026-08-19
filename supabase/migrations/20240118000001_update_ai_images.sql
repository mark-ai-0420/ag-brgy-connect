-- Update Businesses
UPDATE public.businesses 
SET photo_url = '/seed-images/sari-sari.jpg'
WHERE name ILIKE '%Sari-Sari%';

-- Update Events
UPDATE public.events
SET image_url = '/seed-images/basketball.jpg'
WHERE title ILIKE '%Basketball%';

UPDATE public.events
SET image_url = '/seed-images/medical.jpg'
WHERE title ILIKE '%Medical%';

UPDATE public.events
SET image_url = '/seed-images/barangay-hall.jpg'
WHERE title ILIKE '%Assembly%';

-- Update Announcements
UPDATE public.announcements
SET image_url = '/seed-images/barangay-hall.jpg'
WHERE title ILIKE '%Barangay%';

-- Update Officials
UPDATE public.barangay_officials
SET photo_url = '/seed-images/official.jpg';
