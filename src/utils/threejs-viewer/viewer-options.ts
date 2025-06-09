
export interface ViewerOptions {
  textures: {
    earthBaseUrl: string;
    bumpMapUrl: string;
  };
  globe: {
    radius: number;
    segments: number;
  };
  camera: {
    position: [number, number, number];
    fov: number;
  };
  lighting: {
    ambientColor: number;
    ambientIntensity: number;
    directionalColor: number;
    directionalIntensity: number;
  };
}

export function createThreeViewerOptions(): ViewerOptions {
  return {
    textures: {
      earthBaseUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      bumpMapUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png'
    },
    globe: {
      radius: 5,
      segments: 32
    },
    camera: {
      position: [0, 0, 15],
      fov: 75
    },
    lighting: {
      ambientColor: 0x404040,
      ambientIntensity: 0.4,
      directionalColor: 0xffffff,
      directionalIntensity: 0.8
    }
  };
}
