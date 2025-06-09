
import { ViewerOptions } from '@/lib/geospatial-core/types';

export function createThreeViewerOptions(): ViewerOptions & {
  textures: {
    earthBaseUrl: string;
    bumpMapUrl: string;
  };
} {
  return {
    backgroundColor: '#000011',
    cameraOptions: {
      fov: 75,
      near: 0.1,
      far: 1000,
      position: [0, 0, 10]
    },
    rendering: {
      antialias: true,
      shadows: false,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      alpha: false
    },
    textures: {
      earthBaseUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      bumpMapUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png'
    }
  };
}
