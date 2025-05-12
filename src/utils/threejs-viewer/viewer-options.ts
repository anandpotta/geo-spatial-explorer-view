
import * as THREE from 'three';

/**
 * Creates minimal viewer options for the Three.js globe
 */
export function createThreeViewerOptions(): Record<string, any> {
  return {
    // Scene configuration
    backgroundColor: new THREE.Color(0x000000), // Black background
    
    // Camera configuration
    cameraOptions: {
      fov: 45,
      near: 0.1,
      far: 1000,
      position: new THREE.Vector3(0, 0, 20) // Default camera position
    },
    
    // Lighting
    lights: {
      ambient: {
        color: 0x404040,
        intensity: 1.0
      },
      directional: {
        color: 0xffffff,
        intensity: 1.0,
        position: new THREE.Vector3(1, 1, 1)
      }
    },
    
    // Globe configuration
    globe: {
      radius: 5,
      segments: 64,
      baseColor: new THREE.Color(0x0066ff), // Vibrant blue for Earth
      atmosphereColor: new THREE.Color(0x004488), // Atmosphere color
      enableAtmosphere: true,
      enableClouds: false, // Disable clouds by default for performance
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
