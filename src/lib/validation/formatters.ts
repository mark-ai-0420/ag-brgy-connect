/**
 * formatters.ts - Civic Input Masking & Sanitization Utilities for BrgyConnect
 * 
 * Provides real-time input formatting for Philippine phone numbers, email normalization,
 * and age calculation from birthdates.
 */

/**
 * Strips all non-digit and non-plus characters from a phone number string.
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return ''
  return raw.replace(/[^\d+]/g, '')
}

/**
 * Formats a raw input string into a standard Philippine mobile format (09XX-XXX-XXXX)
 * or Cavite/Provincial landline format ((046) XXX-XXXX).
 */
export function formatPHPhone(value: string): string {
  if (!value) return ''
  
  // Clean characters, allowing leading plus
  let cleaned = value.replace(/[^\d+]/g, '')

  // Handle +63 format: convert +639... to 09...
  if (cleaned.startsWith('+63')) {
    cleaned = '0' + cleaned.slice(3)
  } else if (cleaned.startsWith('63') && cleaned.length >= 10) {
    cleaned = '0' + cleaned.slice(2)
  }

  // Format Philippine Mobile (09XX-XXX-XXXX)
  if (cleaned.startsWith('09')) {
    const digits = cleaned.slice(0, 11)
    if (digits.length <= 4) return digits
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  // Format Cavite Landline (046) XXX-XXXX
  if (cleaned.startsWith('046') || cleaned.startsWith('46')) {
    const digits = cleaned.startsWith('046') ? cleaned.slice(0, 10) : '0' + cleaned.slice(0, 9)
    if (digits.length <= 3) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // Fallback: return cleaned string with max 11 digits
  return cleaned.slice(0, 11)
}

/**
 * Normalizes email address by trimming spaces and converting to lowercase.
 */
export function normalizeEmail(email: string): string {
  if (!email) return ''
  return email.trim().toLowerCase()
}

/**
 * Calculates full age in years from an ISO birthdate string (YYYY-MM-DD).
 * Returns NaN if input is invalid.
 */
export function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return NaN
  const birthDate = new Date(birthDateStr)
  if (isNaN(birthDate.getTime())) return NaN

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

/**
 * Checks if a given birthdate qualifies as a Philippine Senior Citizen (>= 60 years old).
 */
export function isSeniorCitizen(birthDateStr: string): boolean {
  const age = calculateAge(birthDateStr)
  return !isNaN(age) && age >= 60
}

/**
 * Formats a clean street address by collapsing extra spaces and trimming.
 */
export function cleanAddress(address: string): string {
  if (!address) return ''
  return address.replace(/\s+/g, ' ').trim()
}
