
import * as THREE from 'three';
import { Location } from './geo-utils';

export function createMarkerPosition(location: Location, heightFactor: number = 1): THREE.Vector3 {
  // Convert spherical coordinates (lat/long) to cartesian
  const phi = (90 - location.y) * (Math.PI / 180);
  const theta = (location.x + 180) * (Math.PI / 180);
  
  // Standard Earth radius
  const radius = 1 * heightFactor; // Scale by height factor
  
  // Calculate position
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

export function formatLocation(location: Location): string {
  if (!location) return '';
  return `${location.label} (${location.y.toFixed(2)}°, ${location.x.toFixed(2)}°)`;
}

export function isValidLocation(location?: Location): boolean {
  if (!location) return false;
  return (
    typeof location.x === 'number' && isFinite(location.x) &&
    typeof location.y === 'number' && isFinite(location.y) &&
    typeof location.id === 'string' && location.id.length > 0 &&
    typeof location.label === 'string'
  );
}
