import type { Barangay } from '#/server/tenant'

/**
 * Calculates the great-circle distance between two points in kilometers using the Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export interface NearestBarangayMatch {
  barangay: Barangay
  distanceKm: number
  distanceFormatted: string
}

/**
 * Finds the nearest barangay from a list given coordinates.
 */
export function findNearestBarangay(
  userLat: number,
  userLng: number,
  barangays: Barangay[]
): NearestBarangayMatch | null {
  if (!barangays || barangays.length === 0) return null

  let nearest: Barangay | null = null
  let minDistance = Infinity

  for (const b of barangays) {
    if (typeof b.map_center_lat !== 'number' || typeof b.map_center_lng !== 'number') {
      continue
    }
    const dist = calculateHaversineDistanceKm(
      userLat,
      userLng,
      b.map_center_lat,
      b.map_center_lng
    )
    if (dist < minDistance) {
      minDistance = dist
      nearest = b
    }
  }

  if (!nearest) return null

  const distanceFormatted =
    minDistance < 1
      ? `${Math.round(minDistance * 1000)} meters`
      : `${minDistance.toFixed(1)} km`

  return {
    barangay: nearest,
    distanceKm: minDistance,
    distanceFormatted,
  }
}

/**
 * Requests device coordinates via standard browser Geolocation API.
 */
export function getCurrentDeviceLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        let msg = 'Unable to retrieve location.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please allow location access to auto-detect your barangay.'
            break
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable from your device.'
            break
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try again.'
            break
        }
        reject(new Error(msg))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  })
}
