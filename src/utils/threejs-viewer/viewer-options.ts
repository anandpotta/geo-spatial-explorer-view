
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
      // NASA Blue Marble Next Generation with topography and bathymetry
      earthBaseUrl: "https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74117/world.200408.3x21600x10800.jpg",
      // Alternative: "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x21600x10800.jpg",
      
      // Bump map for terrain
      bumpMapUrl: "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x21600x10800.jpg",
      
      // Specular map for water reflections
      specularMapUrl: "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_ocean_ice_lights_2048.jpg",
      
      // Cloud map (semi-transparent)
      cloudsUrl: "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg",
      
      // Normal map for enhanced lighting
      normalMapUrl: "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x21600x10800.jpg"
    }
  };
}
