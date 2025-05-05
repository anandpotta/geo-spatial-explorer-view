
import React from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import LayerManager from './LayerManager';

interface LayerManagerWrapperProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onClearAll?: () => void;
  isInitialized: boolean;
}

const LayerManagerWrapper = ({
  featureGroup,
  savedDrawings,
  activeTool,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onClearAll,
  isInitialized
}: LayerManagerWrapperProps) => {
  
  const handleDrawingClick = (drawing: DrawingData) => {
    if (onRegionClick) {
      onRegionClick(drawing);
    }
  };

  const handleRemoveShape = (drawingId: string) => {
    if (onRemoveShape) {
      onRemoveShape(drawingId);
    }
  };

  if (!featureGroup || !isInitialized) {
    return null;
  }

  return (
    <LayerManager
      featureGroup={featureGroup}
      savedDrawings={savedDrawings}
      activeTool={activeTool}
      onRegionClick={handleDrawingClick}
      onRemoveShape={handleRemoveShape}
      onUploadRequest={onUploadRequest}
      onClearAll={onClearAll}
    />
  );
};

export default LayerManagerWrapper;
