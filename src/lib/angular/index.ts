
// Angular module and components
export { GeospatialExplorerModule } from './geospatial-explorer.module';
export { AngularMapComponent } from './map.component';
export { AngularGlobeComponent } from './globe.component';

// Core types re-exported for convenience
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

// Drawing types for Angular
export type { DrawingData } from '../../utils/drawing-utils';

// Platform-specific utilities
export const isAngular = true;
export const isWeb = true;
export const isReactNative = false;
export const isReact = false;

// Angular-specific drawing utilities (would be implemented as services)
export interface AngularDrawingService {
  handleFileUpload: (drawingId: string, file: File) => void;
  handleShapeCreation: (shape: any) => void;
  setupEventHandlers: (element: Element) => void;
}

// Legacy exports for backwards compatibility
export { AngularMapComponent as MapComponentAngular } from './map.component';
export { AngularGlobeComponent as GlobeComponent } from './globe.component';
