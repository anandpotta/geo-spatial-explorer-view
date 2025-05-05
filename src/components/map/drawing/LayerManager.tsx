
import { DrawingData } from '@/utils/drawing-utils';
import L from 'leaflet';
import { useLayerReferences } from '@/hooks/useLayerReferences';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';

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
    onRegionClick,
    onRemoveShape,
    onUploadRequest
  });

  return null;
};

export default LayerManager;
