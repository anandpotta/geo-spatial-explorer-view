
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GeoLocation } from './geospatial-core/types';

/**
 * Utility function for merging class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a standard Location object to our GeoLocation type
 */
export function convertToGeoLocation(location: any): GeoLocation {
  return {
    id: location.id || `loc-${Date.now()}`,
    label: location.label || location.name || 'Unknown Location',
    x: location.x || location.longitude || 0,
    y: location.y || location.latitude || 0,
    z: location.z || location.altitude || 0,
    metadata: location.metadata || {}
  };
}

/**
 * Check if the platform is React Native
 */
export function isReactNative(): boolean {
  return typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
}

/**
 * Platform-specific utilities for detecting environment
 */
export const platformUtils = {
  isWeb: typeof window !== 'undefined' && typeof document !== 'undefined',
  isReactNative: isReactNative(),
  isNode: typeof process !== 'undefined' && process.versions != null && process.versions.node != null,
  isAngular: typeof window !== 'undefined' && !!(window as any).ng
};
