import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { createSupabaseServerClient } from '#/lib/supabase.server';

// 1. Schema with prompt length capping (Max 500 characters)
const chatInputSchema = z.object({
  message: z
    .string()
    .min(1, 'Please enter a message')
    .max(500, 'Message cannot exceed 500 characters'),
  clientId: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string(),
      })
    )
    .optional(),
});

// 2. Sliding-window in-memory rate limiter (per client session / identifier)
interface RateLimitTracker {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitTracker>();

const MAX_REQUESTS_PER_MINUTE = 15;
const MAX_REQUESTS_PER_DAY = 60;
const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function checkRateLimit(clientId: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  let tracker = rateLimitMap.get(clientId);

  if (!tracker) {
    tracker = { timestamps: [] };
    rateLimitMap.set(clientId, tracker);
  }

  // Purge records older than 24 hours
  tracker.timestamps = tracker.timestamps.filter((ts) => now - ts < ONE_DAY_MS);

  // Check 1-minute window
  const minuteCount = tracker.timestamps.filter((ts) => now - ts < ONE_MINUTE_MS).length;
  if (minuteCount >= MAX_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      reason: 'Please slow down a moment before sending another message / Pakiusap maghintay sandali bago magtanong muli.',
    };
  }

  // Check 24-hour daily quota
  if (tracker.timestamps.length >= MAX_REQUESTS_PER_DAY) {
    return {
      allowed: false,
      reason: 'Daily inquiry limit reached (60 questions/day). Please try again tomorrow.',
    };
  }

  // Record valid timestamp
  tracker.timestamps.push(now);
  return { allowed: true };
}

// 3. Zero-Token Static Guardrail Filter (Blocks blatant spam / script injection before calling API)
const BLATANT_SPAM_PATTERNS = [
  /\b(write|create|generate)\b.*\b(python code|javascript code|c\+\+ code|java code|sql script|react component)\b/i,
  /\b(solve|calculate)\b.*\b(math problem|quadratic equation|integral|derivative)\b/i,
  /\b(write|draft)\b.*\b(essay on|poem about|school assignment on|homework on)\b/i,
];

function isBlatantSpam(message: string): boolean {
  return BLATANT_SPAM_PATTERNS.some((pattern) => pattern.test(message));
}

export const sendChatMessage = createServerFn({ method: 'POST' })
  .validator((data: unknown) => chatInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { message, history = [], clientId = 'anonymous_resident' } = data;

    // Rate Limiter Check
    const rateCheck = checkRateLimit(clientId);
    if (!rateCheck.allowed) {
      return {
        text: rateCheck.reason || 'Rate limit exceeded.',
      };
    }

    // Zero-token spam check
    if (isBlatantSpam(message)) {
      return {
        text: 'Hello! I am Ka-Daine, the resident assistant for Barangay Daine, Indang, Cavite. I can only assist with barangay clearances, local services, officials, and community inquiries.',
      };
    }

    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      return {
        text: 'System notice: GEMINI_API_KEY is not configured on the server.',
      };
    }

    const supabase = createSupabaseServerClient();

    let officialsText = 'Punong Barangay (Daine 1): Hon. Rolando E. Daine\nPunong Barangay (Daine 2): Hon. Danilo M. Mendoza';
    let contactsText =
      'Operations Desk (Daine 1): 0917-123-0001\nOperations Desk (Daine 2): 0917-123-0002\nBFP Indang: (046) 415-0322\nPNP Indang: (046) 415-0211\nRural Health: (046) 415-0102\nTanod: 0928-555-0102';

    try {
      const [officialsRes, contactsRes] = await Promise.all([
        supabase.from('barangay_officials').select('name, position').limit(50),
        supabase.from('emergency_contacts').select('name, label, phone').limit(50),
      ]);

      if (officialsRes.data && officialsRes.data.length > 0) {
        officialsText = officialsRes.data
          .map((o: any) => `${o.position}: ${o.name}`)
          .join('\n');
      }
      if (contactsRes.data && contactsRes.data.length > 0) {
        contactsText = contactsRes.data
          .map((c: any) => `${c.label || c.name}: ${c.phone}`)
          .join('\n');
      }
    } catch (dbErr) {
      console.warn('Could not fetch dynamic Supabase context for AI chat:', dbErr);
    }

    const systemInstruction = `You are Ka-Daine, the official, friendly, and helpful AI Resident Assistant of Barangay Daine 1 and Barangay Daine 2, Indang, Cavite.

LANGUAGE & TONE:
- You are fully trilingual/bilingual. You understand and answer fluently in English, Tagalog, or Taglish.
- Match the user's language:
  * If the user writes in English, reply in helpful, friendly English.
  * If the user writes in Tagalog, reply in warm, courteous Tagalog (use "po" and "opo").
  * If the user writes in Taglish, reply in natural Taglish.
- Keep answers concise, clear, and easy to read (2-3 sentences).

DUAL-BARANGAY STRUCTURE:
- Daine is split into two administrative barangays: Barangay Daine 1 and Barangay Daine 2.
- Punong Barangay for Daine 1: Hon. Rolando E. Daine.
- Punong Barangay for Daine 2: Hon. Danilo M. Mendoza.
- If asked about the captain, ask the user if they belong to Daine 1 or Daine 2, or answer with both if appropriate.

CORE BARANGAY SERVICES & SCOPE:
- You help with all barangay inquiries, documents, and community services:
  * Barangay Clearance: ₱50 (Requires valid ID and Cedula)
  * Certificate of Indigency: Free (Requires valid ID)
  * Certificate of Residency: ₱50 (Requires valid ID)
  * Barangay ID: ₱100 (Requires 1x1 photo and valid ID)
  * Complaints / Blotter filings: Report incident at the Barangay Hall or submit online via the portal.
  * Evacuation Centers: 1. Barangay Hall Evacuation Center, 2. Daine Elementary School, 3. Daine Covered Court.
  * Local Officials and Emergency Hotlines.

- If a user asks a question completely unrelated to barangay or local community services (such as programming, math homework, foreign celebrity gossip), politely decline in the user's language in 1 short sentence.

Context Data:
Officials:
${officialsText}

Emergency Contacts:
${contactsText}

Evacuation Shelters:
1. Barangay Hall Evacuation Center
2. Daine Elementary School
3. Daine Covered Court
`;

    const ai = new GoogleGenAI({ apiKey });

    // Candidate models ordered by speed, quota reliability, and compatibility
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
    ];

    const chatHistory = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            ...chatHistory,
            { role: 'user', parts: [{ text: message }] },
          ],
          config: {
            systemInstruction: systemInstruction,
            maxOutputTokens: 350,
            temperature: 0.5,
          },
        });

        const replyText = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text;
        if (replyText && replyText.trim().length > 0) {
          return { text: replyText.trim() };
        }
      } catch (err: any) {
        console.warn(`Model ${model} attempt warning:`, err?.status || err?.message || err);
        // Continue to fallback model
      }
    }

    return {
      text: 'Hello! I am having a temporary connection hiccup with the network. Please try asking again in a moment, or visit our Barangay Hall in Indang, Cavite.',
    };
  });
