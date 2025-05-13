
import * as THREE from 'three';

export interface ThreeViewerOptions {
  backgroundColor: THREE.Color;
  cameraOptions: {
    fov: number;
    near: number;
    far: number;
    position: THREE.Vector3;
  };
  rendering: {
    antialias: boolean;
    alpha: boolean;
    preserveDrawingBuffer: boolean;
    powerPreference: string;
  };
  textures: {
    earthBaseUrl: string;
    bumpMapUrl: string;
    specularMapUrl: string;
    cloudsUrl: string;
    normalMapUrl: string;
  };
}

export function createThreeViewerOptions(): ThreeViewerOptions {
  return {
    backgroundColor: new THREE.Color(0x000011), // Very dark blue background
    cameraOptions: {
      fov: 45,
      near: 0.1,
      far: 1000,
      position: new THREE.Vector3(0, 0, 20)
    },
    rendering: {
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    },
    textures: {
      // More reliable Earth texture URLs
      earthBaseUrl: "https://unpkg.com/three-globe@2.24.10/example/img/earth-blue-marble.jpg",
      // Alternative texture for reliability
      bumpMapUrl: "https://unpkg.com/three-globe@2.24.10/example/img/earth-topology.png",
      // Specular map for water reflections
      specularMapUrl: "https://unpkg.com/three-globe@2.24.10/example/img/earth-water.png",
      // Cloud map (semi-transparent)
      cloudsUrl: "https://unpkg.com/three-globe@2.24.10/example/img/clouds.png",
      // Normal map for enhanced lighting
      normalMapUrl: "https://unpkg.com/three-globe@2.24.10/example/img/earth-topology.png"
    }
  };
}
