
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { createLayerFromDrawing } from '@/components/map/drawing/LayerCreator';
import { cleanupLayers } from './layer-cleanup-utils';
import { ImageTransformOptions } from '@/utils/image-transform-utils';

interface UpdateLayersProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  isMountedRef: React.MutableRefObject<boolean>;
  layersRef: Map<string, L.Layer>;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  imageControlsRoots: Map<string, any>;
  ensureDrawControlsVisibility: () => void;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onImageTransform?: (drawingId: string, options: Partial<ImageTransformOptions>) => void;
}

/**
 * Update layers in the feature group based on saved drawings
 */
export const updateLayers = ({
  featureGroup,
  savedDrawings,
  activeTool,
  isMountedRef,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  imageControlsRoots,
  ensureDrawControlsVisibility,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onImageTransform
}: UpdateLayersProps) => {
  if (!featureGroup || !isMountedRef.current) return;
  
  try {
    // Safely clear existing layers and unmount React roots
    cleanupLayers(
      featureGroup, 
      removeButtonRoots, 
      uploadButtonRoots, 
      imageControlsRoots, 
      layersRef
    );
    
    // Create layers for each drawing
    savedDrawings.forEach(drawing => {
      try {
        createLayerFromDrawing({
          drawing,
          featureGroup,
          activeTool,
          isMounted: isMountedRef.current,
          layersRef,
          removeButtonRoots,
          uploadButtonRoots,
          imageControlsRoots,
          onRegionClick,
          onRemoveShape,
          onUploadRequest,
          onImageTransform
        });
      } catch (err) {
        console.error(`Error creating layer for drawing ${drawing.id}:`, err);
      }
    });
    
    // Always ensure drawing controls remain visible after layer updates
    setTimeout(() => {
      ensureDrawControlsVisibility();
    }, 100);
  } catch (err) {
    console.error('Error updating layers:', err);
  }
};
