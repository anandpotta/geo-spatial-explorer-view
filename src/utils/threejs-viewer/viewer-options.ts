
import * as THREE from 'three';

/**
 * Creates minimal viewer options for the Three.js globe
 */
export function createThreeViewerOptions(): Record<string, any> {
  return {
    // Scene configuration
    backgroundColor: new THREE.Color(0x000011), // Very dark blue background (nearly black)
    
    // Camera configuration
    cameraOptions: {
      fov: 45,
      near: 0.1,
      far: 2000, // Increased for starfield
      position: new THREE.Vector3(0, 0, 20) // Default camera position
    },
    
    // Lighting
    lights: {
      ambient: {
        color: 0x404040,
        intensity: 0.6
      },
      directional: {
        color: 0xffffff,
        intensity: 1.0,
        position: new THREE.Vector3(1, 0.5, 1)
      }
    },
    
    // Globe configuration
    globe: {
      radius: 5,
      segments: 96, // Higher segment count for smoother appearance
      baseColor: new THREE.Color(0x1a4d7c), // Deep ocean blue
      atmosphereColor: new THREE.Color(0x6699ff), // Light blue atmosphere
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
