
export interface GeoLocation {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
  z?: number; // altitude
}

export interface GlobeOptions {
  earthRadius?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
  enableInteraction?: boolean;
  backgroundColor?: string;
  texturePath?: string;
}

export interface MapViewOptions {
  initialZoom?: number;
  enableDrawing?: boolean;
  showControls?: boolean;
  theme?: 'light' | 'dark';
  initialCenter?: [number, number];
  maxZoom?: number;
}

export interface MapOptions extends MapViewOptions {
  // Additional map-specific options
}

export interface GlobeEventHandlers {
  onReady?: (api: any) => void;
  onFlyComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface ViewerContext {
  getElement: () => HTMLElement | null;
  getDimensions: () => { width: number; height: number };
  onResize: (callback: () => void) => () => void;
  onCleanup: (callback: () => void) => void;
}

export interface RendererContext {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface ViewerOptions {
  backgroundColor?: string;
  cameraOptions?: {
    fov?: number;
    near?: number;
    far?: number;
    position?: [number, number, number];
  };
  rendering?: {
    antialias?: boolean;
    shadows?: boolean;
    pixelRatio?: number;
    alpha?: boolean;
  };
}
