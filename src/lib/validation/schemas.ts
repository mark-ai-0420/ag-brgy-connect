import { z } from 'zod'
import { cleanPhoneNumber, calculateAge } from './formatters'

/**
 * Standard Puroks and Sitios of Barangay Daine 1 & Daine 2
 */
export const OFFICIAL_PUROKS = [
  'Purok 1',
  'Purok 2',
  'Purok 3',
  'Purok 4',
  'Purok 5',
  'Purok 6',
  'Purok 7',
  'Sitio Ilaya',
  'Sitio Ibaba',
  'Sitio Centro',
  'Sitio Boundary',
] as const

/**
 * Philippine Phone Validation:
 * Accepts:
 * - Mobile: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (12 digits)
 * - Cavite/Provincial Landline: (046) XXX-XXXX or 046XXXXXXX (10 digits)
 */
export const phPhoneSchema = z
  .string({ message: 'Mobile or telephone number is required' })
  .min(1, 'Mobile or telephone number is required')
  .refine(
    (val) => {
      const cleaned = cleanPhoneNumber(val)
      // Philippine Mobile: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (13 chars)
      const isMobile = /^(09\d{9}|\+639\d{9})$/.test(cleaned)
      // Cavite Landline: 046XXXXXXX (10 digits) or +6346XXXXXXX (12 digits)
      const isLandline = /^(046\d{7}|\+6346\d{7})$/.test(cleaned)
      return isMobile || isLandline
    },
    {
      message:
        'Please enter a valid Philippine mobile number (e.g. 0917-123-4567) or landline (046) XXX-XXXX',
    }
  )

/**
 * Optional Philippine Phone Validation (can be empty string or undefined, but if present must be valid)
 */
export const optionalPhPhoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim().length === 0) return true
      const cleaned = cleanPhoneNumber(val.trim())
      const isMobile = /^(09\d{9}|\+639\d{9})$/.test(cleaned)
      const isLandline = /^(046\d{7}|\+6346\d{7})$/.test(cleaned)
      return isMobile || isLandline
    },
    {
      message:
        'Please enter a valid Philippine mobile number (e.g. 0917-123-4567) or leave blank',
    }
  )

/**
 * Sanitized Email Schema:
 * Checks RFC 5322 format and blocks common typos.
 */
export const emailSchema = z
  .string({ message: 'Email address is required' })
  .min(1, 'Email address is required')
  .email('Please enter a valid email address (e.g. resident@gmail.com)')
  .max(255, 'Email address is too long')
  .refine(
    (val) => {
      // Detect common typos like @gmai.com or @yaho.com
      const lower = val.toLowerCase().trim()
      const typoDomains = ['@gmai.com', '@gamil.com', '@yaho.com', '@hotmial.com']
      return !typoDomains.some((d) => lower.endsWith(d))
    },
    {
      message: 'Please check your email domain for typos (e.g. @gmail.com or @yahoo.com)',
    }
  )

/**
 * Full Legal Name Schema:
 * Requires at least 2 words (First Name + Last Name), minimum 3 characters.
 * Allows Philippine honorifics and particles (Jr., Sr., III, de, delos, Ma.).
 */
export const fullNameSchema = z
  .string({ message: 'Full legal name is required' })
  .min(3, 'Name must be at least 3 characters')
  .max(100, 'Name cannot exceed 100 characters')
  .refine(
    (val) => {
      // Must contain at least two words with alphabetic characters
      const parts = val.trim().split(/\s+/).filter(Boolean)
      return parts.length >= 2 && /[a-zA-Z]/.test(val)
    },
    {
      message: 'Please enter both your First Name and Last Name (e.g., Juan Dela Cruz)',
    }
  )

/**
 * Generic & Multi-Tenant Barangay Scoping Schema
 * Supports legacy 'daine_1' / 'daine_2', slugs, or UUIDs
 */
export const barangayUnitSchema = z
  .string({ message: 'Please select your barangay jurisdiction' })
  .min(1, 'Please select your barangay jurisdiction')

/**
 * Resolves Puroks for the specified barangay with fallback to OFFICIAL_PUROKS
 */
export function getBarangayPuroks(puroks?: string[] | null): readonly string[] {
  if (puroks && Array.isArray(puroks) && puroks.length > 0) {
    return puroks
  }
  return OFFICIAL_PUROKS
}

/**
 * Purok / Sitio Selection Schema
 */
export const purokSchema = z
  .string({ message: 'Purok or Sitio is required' })
  .min(1, 'Please select your Purok or Sitio')

/**
 * Residential / Business Street Address Schema:
 * Requires minimum 6 characters to prevent vague entries like "bahay" or "daine".
 */
export const addressSchema = z
  .string({ message: 'Complete address is required' })
  .min(6, 'Please provide a complete address with house/lot number or landmark (min 6 characters)')
  .max(300, 'Address is too long (max 300 characters)')
  .refine(
    (val) => {
      // Disallow one-word vague answers
      const lower = val.toLowerCase().trim()
      const vagueWords = ['bahay', 'dito', 'daine', 'house', 'here', 'none', 'n/a']
      return !vagueWords.includes(lower)
    },
    {
      message: 'Please provide specific street, purok, or landmark details for accuracy',
    }
  )

/**
 * Birth Date Schema:
 * Validates ISO date string YYYY-MM-DD.
 * Ensures date is not in the future and age is between 0 and 125.
 */
export const birthDateSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true
      const date = new Date(val)
      if (isNaN(date.getTime())) return false
      const today = new Date()
      // Disallow future date
      if (date > today) return false
      // Disallow age > 125 years
      const age = calculateAge(val)
      return age >= 0 && age <= 125
    },
    {
      message: 'Please enter a valid birthdate (cannot be in the future or exceed 125 years)',
    }
  )

/**
 * Gender / Sex Schema:
 * Aligned with official civil registry standards
 */
export const genderSchema = z.enum(['male', 'female', 'prefer_not_to_say'] as const, {
  message: 'Please select your sex/gender',
})

/**
 * Incident Date Schema (for Blotters / Complaints):
 * Cannot be in the future.
 */
export const incidentDateSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val) return true
      const date = new Date(val)
      if (isNaN(date.getTime())) return false
      const today = new Date()
      // Allow current date/time plus small buffer for clock skew (10 minutes)
      return date.getTime() <= today.getTime() + 10 * 60 * 1000
    },
    {
      message: 'Incident date and time cannot be in the future',
    }
  )

/**
 * Social / Messenger Link Schema
 */
export const socialLinkSchema = z
  .string()
  .optional()
  .default('')
  .refine(
    (val) => {
      if (!val || !val.trim()) return true
      const trimmed = val.trim()
      return (
        trimmed.startsWith('https://') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('m.me/') ||
        trimmed.startsWith('facebook.com/') ||
        trimmed.startsWith('fb.me/')
      )
    },
    {
      message: 'Please enter a valid Facebook or Messenger link (e.g. m.me/yourpage or https://facebook.com/...)',
    }
  )
