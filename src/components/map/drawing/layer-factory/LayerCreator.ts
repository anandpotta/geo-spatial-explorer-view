
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { ImageTransformOptions } from '@/utils/image-transform-utils';
import { layerFactoryCore } from './LayerFactoryCore';

export interface LayerFactoryOptions {
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

/**
 * Creates a new layer from a drawing and adds it to the feature group
 */
export const createLayerFromDrawing = (options: LayerFactoryOptions) => {
  if (!options.drawing.geoJSON || !options.isMounted) return;
  
  try {
    layerFactoryCore(options);
  } catch (err) {
    console.error('Error adding drawing layer:', err);
  }
};
