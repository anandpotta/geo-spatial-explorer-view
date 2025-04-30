
import { DrawingData } from '@/utils/drawing/types';
import L from 'leaflet';
import { useLayerReferences } from '@/hooks/useLayerReferences';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';
import { useFileUpload } from '@/hooks/useFileUpload';

interface LayerManagerProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
}

const LayerManager = ({ 
  featureGroup, 
  savedDrawings, 
  activeTool,
  onRegionClick,
  onRemoveShape,
  onUploadRequest
}: LayerManagerProps) => {
  const {
    isMountedRef,
    removeButtonRoots,
    uploadButtonRoots,
    rotationControlRoots,
    layersRef
  } = useLayerReferences();
  
  const { handleRotateImage } = useFileUpload({});
  
  useLayerUpdates({
    featureGroup,
    savedDrawings,
    activeTool,
    isMountedRef,
    layersRef,
    removeButtonRoots,
    uploadButtonRoots,
    rotationControlRoots,
    onRegionClick,
    onRemoveShape,
    onUploadRequest,
    onRotateImage: handleRotateImage
  });

  return null;
};

export default LayerManager;
