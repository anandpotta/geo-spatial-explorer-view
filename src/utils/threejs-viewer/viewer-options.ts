
import * as THREE from 'three';

/**
 * Creates minimal viewer options for the Three.js globe
 */
export function createThreeViewerOptions(): Record<string, any> {
  return {
    // Scene configuration
    backgroundColor: new THREE.Color(0x000022), // Very dark blue background
    
    // Camera configuration
    cameraOptions: {
      fov: 45,
      near: 0.1,
      far: 2000,
      position: new THREE.Vector3(0, 0, 15)
    },
    
    // Lighting
    lights: {
      ambient: {
        color: 0xffffff,
        intensity: 0.8 // Brighter ambient light
      },
      directional: {
        color: 0xffffff,
        intensity: 1.0, // Full intensity for clear visibility
        position: new THREE.Vector3(1, 0.5, 1)
      }
    },
    
    // Globe configuration
    globe: {
      radius: 5,
      segments: 128, // Higher segment count for smoother appearance
      baseColor: new THREE.Color(0xffffff), // Pure white to let texture colors show
      atmosphereColor: new THREE.Color(0xaaccff), // Light blue atmosphere
      enableAtmosphere: true,
      enableClouds: false, // Disable clouds for clearer land view
      enableRotation: true, // Auto-rotation enabled
    },
    
    // Rendering options
    rendering: {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    },
    
    // Default behavior
    shouldAnimate: true,
    targetFrameRate: 60
  };
}
