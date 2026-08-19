UPDATE public.announcements SET image_url = 'https://picsum.photos/seed/' || id || '/800/400';
UPDATE public.events SET image_url = 'https://picsum.photos/seed/' || id || '/800/400';
UPDATE public.businesses SET 
  photo_url = 'https://picsum.photos/seed/' || id || '_store/800/400',
  menu_image_url = 'https://picsum.photos/seed/' || id || '_menu/800/400',
  misc_image_url = 'https://picsum.photos/seed/' || id || '_misc/800/400';
