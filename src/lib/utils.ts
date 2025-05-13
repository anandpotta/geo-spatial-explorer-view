
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names or class name objects into a single string
 * Utility function for conditional classnames in components
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Cross-platform utility functions for the geospatial library
 */

// Platform detection
export function isWeb(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isReactNative(): boolean {
  return typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
}

// Format coordinate to user-friendly string
export function formatCoordinate(coord: number, isLatitude: boolean = false): string {
  const direction = isLatitude 
    ? (coord >= 0 ? 'N' : 'S')
    : (coord >= 0 ? 'E' : 'W');
  
  const absCoord = Math.abs(coord);
  const degrees = Math.floor(absCoord);
  const minutes = Math.floor((absCoord - degrees) * 60);
  const seconds = ((absCoord - degrees - minutes / 60) * 3600).toFixed(2);
  
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

// Calculate distance between two coordinates (in km)
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

