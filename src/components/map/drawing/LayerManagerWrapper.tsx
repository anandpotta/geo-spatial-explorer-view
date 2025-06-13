
import React from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import LayerManager from './LayerManager';
import L from 'leaflet';

interface LayerManagerWrapperProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  onRegionClick: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest: (drawingId: string) => void;
}

const LayerManagerWrapper: React.FC<LayerManagerWrapperProps> = ({
  featureGroup,
  savedDrawings,
  activeTool,
  onRegionClick,
  onRemoveShape,
  onUploadRequest
}) => {
  console.log('🌐 LayerManagerWrapper: Rendering with:', {
    savedDrawingsCount: savedDrawings.length,
    onRegionClick: typeof onRegionClick,
    onUploadRequest: typeof onUploadRequest
  });
  
  return (
    <LayerManager 
      featureGroup={featureGroup}
      savedDrawings={savedDrawings}
      activeTool={activeTool}
      onRegionClick={onRegionClick}
      onRemoveShape={onRemoveShape}
      onUploadRequest={onUploadRequest}
    />
  );
};

export default LayerManagerWrapper;
