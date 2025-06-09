
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
}

export interface MapViewOptions {
  initialZoom?: number;
  enableDrawing?: boolean;
  showControls?: boolean;
  theme?: 'light' | 'dark';
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
