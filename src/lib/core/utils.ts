
import { GeoLocation } from './types';

export function calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (loc2.y - loc1.y) * Math.PI / 180;
  const dLon = (loc2.x - loc1.x) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.y * Math.PI / 180) * Math.cos(loc2.y * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
