
import { DrawingData } from '@/utils/drawing-utils';
import L from 'leaflet';
import { useLayerReferences } from '@/hooks/useLayerReferences';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';
import { ImageTransformOptions } from '@/utils/image-transform-utils';

interface LayerManagerProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onImageTransform?: (drawingId: string, options: Partial<ImageTransformOptions>) => void;
}

const LayerManager = ({ 
  featureGroup, 
  savedDrawings, 
  activeTool,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onImageTransform
}: LayerManagerProps) => {
  const {
    isMountedRef,
    removeButtonRoots,
    uploadButtonRoots,
    imageControlsRoots,
    layersRef
  } = useLayerReferences();
  
  useLayerUpdates({
    featureGroup,
    savedDrawings,
    activeTool,
    isMountedRef,
    layersRef,
    removeButtonRoots,
    uploadButtonRoots,
    imageControlsRoots,
    onRegionClick,
    onRemoveShape,
    onUploadRequest,
    onImageTransform
  });

  return null;
};

export default LayerManager;
