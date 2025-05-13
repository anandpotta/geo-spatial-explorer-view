
/**
 * Convert latitude and longitude to 3D coordinates
 */
export function latLongToVector3(latitude: number, longitude: number, radius: number): [number, number, number] {
  const phi = (90 - latitude) * (Math.PI / 180);
  const theta = (longitude + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return [x, y, z];
}

/**
 * Calculate distance between two coordinates in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
}

/**
 * Format coordinates as a human-readable string
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';
  
  const latFormatted = `${Math.abs(latitude).toFixed(4)}°${latDir}`;
  const lonFormatted = `${Math.abs(longitude).toFixed(4)}°${lonDir}`;
  
  return `${latFormatted}, ${lonFormatted}`;
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinate(value: number): boolean {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
}
