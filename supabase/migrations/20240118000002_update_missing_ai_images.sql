-- Update missing Businesses
UPDATE public.businesses 
SET photo_url = '/seed-images/water-refilling.jpg',
    menu_image_url = '/seed-images/water-refilling.jpg',
    misc_image_url = '/seed-images/water-refilling.jpg'
WHERE name ILIKE '%Water%';

UPDATE public.businesses 
SET photo_url = '/seed-images/auto-repair.jpg',
    menu_image_url = '/seed-images/auto-repair.jpg',
    misc_image_url = '/seed-images/auto-repair.jpg'
WHERE name ILIKE '%Auto%';

-- Update missing Announcements
UPDATE public.announcements
SET image_url = '/seed-images/relief-goods.jpg'
WHERE title ILIKE '%Relief%';

UPDATE public.announcements
SET image_url = '/seed-images/water-interruption.jpg'
WHERE title ILIKE '%Water%';

UPDATE public.announcements
SET image_url = '/seed-images/anti-rabies.jpg'
WHERE title ILIKE '%Rabies%';

-- Update Officials to perfectly centered 1:1 image
UPDATE public.barangay_officials
SET photo_url = '/seed-images/official-square.jpg';
