
import { DrawingData } from '@/utils/drawing-utils';
import { ImageTransformOptions } from '@/utils/image-transform-utils';
import { createLayerFromDrawing } from './LayerFactory';

interface CreateLayerOptions {
  drawing: DrawingData;
  featureGroup: L.FeatureGroup;
  activeTool: string | null;
  isMounted: boolean;
  layersRef: Map<string, L.Layer>;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  imageControlsRoots: Map<string, any>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onImageTransform?: (drawingId: string, options: Partial<ImageTransformOptions>) => void;
}

// This file re-exports the createLayerFromDrawing function from LayerFactory.ts
// for backward compatibility
export { createLayerFromDrawing } from './LayerFactory';
