import { createServerFn } from '@tanstack/react-start';
import { createSupabaseServerClient } from '#/lib/supabase.server';
import { getAuthSession } from '#/server/auth';

function hashPostId(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `fb_${Math.abs(hash).toString(36)}`;
}

// 1. fetchLGUIndangPosts via Headless Chrome / Puppeteer
export async function fetchLGUIndangPosts() {
  console.log('Fetching live posts from https://www.facebook.com/LGUIndangCavite/ ...');
  
  try {
    const puppeteer = (await import('puppeteer')).default;
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=en-US,en']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.goto('https://www.facebook.com/LGUIndangCavite/', { waitUntil: 'networkidle2', timeout: 25000 });

    // Extract text blocks from the Facebook feed page
    const extractedPosts = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div[dir="auto"], div[style*="text-align"]'));
      const texts = elements
        .map(el => el.textContent?.trim() || '')
        .filter(text => text.length > 25 && !text.startsWith('Log In') && !text.startsWith('See all photos'));
      return Array.from(new Set(texts)).slice(0, 10);
    });

    await browser.close();

    if (extractedPosts.length > 0) {
      console.log(`Scraped ${extractedPosts.length} live post blocks from @LGUIndangCavite.`);
      return extractedPosts.map((text, idx) => ({
        fb_post_id: hashPostId(text),
        post_text: text,
        post_url: 'https://www.facebook.com/LGUIndangCavite/'
      }));
    }
  } catch (error) {
    console.warn('Puppeteer scrape error, falling back to RSS/mock reader:', error);
  }

  // Return empty array if Puppeteer/scraping is offline or returns no posts
  return [];
}

// 2. classifyPostWithGemini
export async function classifyPostWithGemini(postText: string) {
  const keywords = ['walang pasok', 'class suspension', 'suspended', 'no classes', 'suspension of classes', 'indang'];
  const textLower = postText.toLowerCase();
  const hasKeyword = keywords.some(kw => textLower.includes(kw));

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !hasKeyword) {
    if (hasKeyword) {
      return {
        isClassSuspension: true,
        title: "WALANG PASOK: Indang, Cavite",
        body: postText,
        affectedLevels: "All Levels (Keyword Match)",
        reason: "Keyword Match"
      };
    }
    return { isClassSuspension: false };
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze the following Facebook post from an LGU and determine if it's a class suspension announcement ("Walang Pasok").
                
Post: "${postText}"

Respond with ONLY a valid JSON object in this format:
{
  "isClassSuspension": boolean,
  "title": "string (e.g. WALANG PASOK: All Levels in Indang, Cavite) or empty string",
  "body": "string (summary of announcement) or empty string",
  "affectedLevels": "string or empty string",
  "reason": "string or empty string"
}`
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (resultText) {
      return JSON.parse(resultText);
    }
  } catch (error) {
    console.warn("Gemini classification fallback:", error);
  }
  
  // Fallback
  return { 
    isClassSuspension: hasKeyword,
    title: hasKeyword ? "WALANG PASOK: Indang, Cavite" : "",
    body: postText,
    affectedLevels: hasKeyword ? "All Levels (Fallback)" : "",
    reason: hasKeyword ? "Keyword Match (Fallback)" : ""
  };
}

// 3. syncLGUIndangAnnouncements
export const syncLGUIndangAnnouncements = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      const supabase = createSupabaseServerClient();
      const { session } = await getAuthSession();
      const authorId = session?.user?.id ?? null;
      
      // Read lgu_sync_settings
      const { data: settings, error: settingsError } = await supabase
        .from('lgu_sync_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
        
      if (settingsError || !settings?.enabled) {
        return { syncedCount: 0, newSuspensions: 0 };
      }
      
      const posts = await fetchLGUIndangPosts();
      let syncedCount = 0;
      let newSuspensions = 0;
      
      const postIds = posts.map(p => p.fb_post_id);
      const existingIds = new Set<string>();
      
      if (postIds.length > 0) {
        const { data: existing } = await supabase
          .from('ingested_fb_posts')
          .select('fb_post_id')
          .in('fb_post_id', postIds);
          
        if (existing) {
          existing.forEach(e => existingIds.add(e.fb_post_id));
        }
      }
      
      const postsToInsert = [];

      for (const post of posts) {
        if (existingIds.has(post.fb_post_id)) continue;
        
        const classification = await classifyPostWithGemini(post.post_text);
        let announcementId = null;
        
        if (classification.isClassSuspension) {
          // Insert into announcements
          const { data: ann, error: annError } = await supabase
            .from('announcements')
            .insert({
              title: classification.title || 'WALANG PASOK: Indang, Cavite',
              body: classification.body || post.post_text,
              pinned: true,
              author_id: authorId,
            })
            .select('id')
            .maybeSingle();
            
          if (ann && !annError) {
            announcementId = ann.id;
            newSuspensions++;
          }
        }
        
        postsToInsert.push({
          fb_post_id: post.fb_post_id,
          post_url: post.post_url,
          post_text: post.post_text,
          is_class_suspension: classification.isClassSuspension,
          affected_levels: classification.affectedLevels,
          reason: classification.reason,
          announcement_id: announcementId
        });
        
        syncedCount++;
      }
      
      if (postsToInsert.length > 0) {
        await supabase.from('ingested_fb_posts').insert(postsToInsert);
      }
      
      // Update last_synced_at
      await supabase
        .from('lgu_sync_settings')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', 1);
        
      return { syncedCount, newSuspensions };
    } catch (error) {
      console.error('Error in syncLGUIndangAnnouncements:', error);
      return { syncedCount: 0, newSuspensions: 0 };
    }
  });

// 4. getLGUSyncStatus
export const getLGUSyncStatus = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const supabase = createSupabaseServerClient();
      
      const { data: settings } = await supabase
        .from('lgu_sync_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
        
      const { data: posts } = await supabase
        .from('ingested_fb_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      return {
        settings: settings ?? { enabled: true, auto_publish: true, last_synced_at: null },
        posts: posts ?? []
      };
    } catch (error) {
      console.error('Error in getLGUSyncStatus:', error);
      return {
        settings: { enabled: true, auto_publish: true, last_synced_at: null },
        posts: []
      };
    }
  });

// 5. toggleLGUSync
export const toggleLGUSync = createServerFn({ method: 'POST' })
  .validator((enabled: boolean) => enabled)
  .handler(async ({ data: enabled }) => {
    try {
      const supabase = createSupabaseServerClient();
      
      await supabase
        .from('lgu_sync_settings')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('id', 1);
        
      return { success: true, enabled };
    } catch (error) {
      console.error('Error in toggleLGUSync:', error);
      return { success: false, enabled };
    }
  });
