
import * as THREE from 'three';

export interface ThreeGlobeResult {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  globe: THREE.Mesh | null;
  flyToLocation: (longitude: number, latitude: number, onComplete?: () => void) => void;
  isInitialized: boolean;
}

export interface FlyingState {
  isFlying: boolean;
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  startTime: number;
  duration: number;
  onComplete: (() => void) | null;
}

// Earth radius in km
export const EARTH_RADIUS = 6371;
// Distance to show the full Earth
export const OUTER_SPACE_DISTANCE = EARTH_RADIUS * 2.8;
// Closest distance to Earth's surface when zoomed in
export const MIN_DISTANCE = EARTH_RADIUS * 0.2;
