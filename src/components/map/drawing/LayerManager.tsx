
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useLayerReferences } from '@/hooks/useLayerReferences';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';
import { createLayerControls } from './LayerControls';
import { createLayerFromDrawing } from './LayerCreator';
import { setupLayerClickHandlers } from './LayerEventHandlers';
import { createRemoveButtonControl } from './controls/RemoveButtonControl';
import { createUploadButtonControl } from './controls/UploadButtonControl';
import { createImageControlsLayer } from './controls/ImageControlsLayer';

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
    layersRef, 
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

    savedDrawings.forEach(async (drawing) => {
      console.log(`🎯 LayerManager: Processing drawing ${drawing.id}`);
      
      if (!layersRef.current.has(drawing.id)) {
        console.log(`🆕 LayerManager: Creating new layer for drawing ${drawing.id}`);
        
        try {
          // createLayerFromDrawing returns Promise<void>, so we don't test its return value
          await createLayerFromDrawing({
            drawing,
            featureGroup,
            activeTool,
            isMounted: mountedRef.current,
            layersRef: layersRef.current,
            removeButtonRoots: removeButtonRoots.current,
            uploadButtonRoots: uploadButtonRoots.current,
            imageControlRoots: imageControlRoots.current,
            onRegionClick,
            onRemoveShape,
            onUploadRequest
          });
          
          // Get the layer after creation
          const layer = layersRef.current.get(drawing.id);
          if (layer) {
            console.log(`✅ LayerManager: Layer created successfully for drawing ${drawing.id}`);
            console.log(`🔧 LayerManager: About to call setupLayerClickHandlers for drawing ${drawing.id}`);
            console.log(`🔧 LayerManager: Parameters:`, {
              layer: !!layer,
              layerType: (layer as any).constructor?.name || 'Unknown',
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
        
        const existingLayer = layersRef.current.get(drawing.id);
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
    layersRef: layersRef.current,
    removeButtonRoots: removeButtonRoots.current,
    uploadButtonRoots: uploadButtonRoots.current,
    imageControlRoots: imageControlRoots.current,
    featureGroup,
    onRemoveShape,
    onUploadRequest,
    isMounted: mountedRef.current
  });

  return (
    <>
      {savedDrawings.map((drawing) => (
        <div key={drawing.id} />
      ))}
    </>
  );
};

export default LayerManager;
