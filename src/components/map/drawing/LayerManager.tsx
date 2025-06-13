import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useLayerReferences } from '@/hooks/useLayerReferences';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';
import { LayerControls } from './LayerControls';
import { LayerCreator } from './LayerCreator';
import { setupLayerClickHandlers } from './LayerEventHandlers';
import { createRemoveButtonControl } from './controls/RemoveButtonControl';
import { createUploadButtonControl } from './controls/UploadButtonControl';
import { createImageControl } from './controls/ImageControl';

interface LayerManagerProps {
  featureGroup: L.FeatureGroup;
  savedDrawings: DrawingData[];
  activeTool: string | null;
  onRegionClick: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest: (drawingId: string) => void;
}

const LayerManager: React.FC<LayerManagerProps> = ({
  featureGroup,
  savedDrawings,
  activeTool,
  onRegionClick,
  onRemoveShape,
  onUploadRequest
}) => {
  const mountedRef = useRef(true);
  const { 
    layerRefs, 
    removeButtonRoots, 
    uploadButtonRoots,
    imageControlRoots 
  } = useLayerReferences();
  
  console.log('🏗️ LayerManager: Rendering with:', {
    savedDrawingsCount: savedDrawings.length,
    onRegionClick: typeof onRegionClick,
    onUploadRequest: typeof onUploadRequest,
    activeTool
  });

  useEffect(() => {
    console.log('🔄 LayerManager: useEffect triggered with:', {
      savedDrawingsCount: savedDrawings.length,
      drawingIds: savedDrawings.map(d => d.id)
    });

    if (!featureGroup || !savedDrawings.length) {
      console.log('❌ LayerManager: Missing featureGroup or no drawings, skipping layer creation');
      return;
    }

    savedDrawings.forEach((drawing) => {
      console.log(`🎯 LayerManager: Processing drawing ${drawing.id}`);
      
      if (!layerRefs.current[drawing.id]) {
        console.log(`🆕 LayerManager: Creating new layer for drawing ${drawing.id}`);
        
        try {
          const layer = LayerCreator.createLayerFromDrawing(drawing, featureGroup);
          
          if (layer) {
            console.log(`✅ LayerManager: Layer created successfully for drawing ${drawing.id}`);
            layerRefs.current[drawing.id] = layer;
            
            console.log(`🔧 LayerManager: About to call setupLayerClickHandlers for drawing ${drawing.id}`);
            console.log(`🔧 LayerManager: Parameters:`, {
              layer: !!layer,
              layerType: layer.constructor.name,
              drawing: !!drawing,
              drawingId: drawing.id,
              mounted: mountedRef.current,
              onRegionClick: typeof onRegionClick,
              onRegionClickFunction: onRegionClick
            });
            
            // Set up click handlers for the layer
            setupLayerClickHandlers(
              layer,
              drawing,
              mountedRef.current,
              onRegionClick
            );
            
            console.log(`✅ LayerManager: setupLayerClickHandlers called for drawing ${drawing.id}`);
          } else {
            console.error(`❌ LayerManager: Failed to create layer for drawing ${drawing.id}`);
          }
        } catch (error) {
          console.error(`❌ LayerManager: Error creating layer for drawing ${drawing.id}:`, error);
        }
      } else {
        console.log(`♻️ LayerManager: Layer already exists for drawing ${drawing.id}, checking if handlers need update`);
        
        const existingLayer = layerRefs.current[drawing.id];
        if (existingLayer) {
          console.log(`🔧 LayerManager: Re-calling setupLayerClickHandlers for existing drawing ${drawing.id}`);
          setupLayerClickHandlers(
            existingLayer,
            drawing,
            mountedRef.current,
            onRegionClick
          );
        }
      }
    });

    return () => {
      console.log('🧹 LayerManager: Cleanup function called');
      mountedRef.current = false;
    };
  }, [savedDrawings, featureGroup, onRegionClick]);

  useLayerUpdates({
    savedDrawings,
    layerRefs,
    removeButtonRoots,
    uploadButtonRoots,
    imageControlRoots,
    featureGroup,
    onRemoveShape,
    onUploadRequest,
    isMounted: mountedRef.current
  });

  return (
    <LayerControls
      savedDrawings={savedDrawings}
      layerRefs={layerRefs}
      removeButtonRoots={removeButtonRoots}
      uploadButtonRoots={uploadButtonRoots}
      imageControlRoots={imageControlRoots}
      featureGroup={featureGroup}
      onRemoveShape={onRemoveShape}
      onUploadRequest={onUploadRequest}
      isMounted={mountedRef.current}
    />
  );
};

export default LayerManager;
