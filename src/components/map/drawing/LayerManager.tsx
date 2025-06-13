
import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useLayerReferences } from '@/hooks/useLayerReferences';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';
import { createLayerFromDrawing } from './LayerCreator';
import { setupLayerClickHandlers } from './LayerEventHandlers';

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
  const setupCompletedRef = useRef(new Set<string>());
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

  // Memoize the layer processing function to prevent unnecessary re-renders
  const processDrawings = useCallback(async () => {
    console.log('🔄 LayerManager: processDrawings called with:', {
      savedDrawingsCount: savedDrawings.length,
      drawingIds: savedDrawings.map(d => d.id)
    });

    if (!featureGroup || !savedDrawings.length) {
      console.log('❌ LayerManager: Missing featureGroup or no drawings, skipping layer creation');
      return;
    }

    // Process each drawing
    for (const drawing of savedDrawings) {
      console.log(`🎯 LayerManager: Processing drawing ${drawing.id}`);
      
      if (!layersRef.current.has(drawing.id)) {
        console.log(`🆕 LayerManager: Creating new layer for drawing ${drawing.id}`);
        
        try {
          // createLayerFromDrawing returns Promise<void>, so we await it
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
          
          console.log(`✅ LayerManager: Layer creation completed for drawing ${drawing.id}`);
          
          // Setup handlers after layer creation
          setTimeout(() => {
            if (!mountedRef.current) return;
            
            const layer = layersRef.current.get(drawing.id);
            if (layer) {
              console.log(`🔧 LayerManager: Setting up click handlers for drawing ${drawing.id}`);
              setupLayerClickHandlers(
                layer,
                drawing,
                mountedRef.current,
                onRegionClick
              );
              setupCompletedRef.current.add(drawing.id);
              console.log(`✅ LayerManager: Setup completed for drawing ${drawing.id}`);
            } else {
              console.error(`❌ LayerManager: Layer not found after creation for drawing ${drawing.id}`);
            }
          }, 50);
          
        } catch (error) {
          console.error(`❌ LayerManager: Error creating layer for drawing ${drawing.id}:`, error);
        }
      } else if (!setupCompletedRef.current.has(drawing.id)) {
        console.log(`♻️ LayerManager: Layer exists but handlers not set up for drawing ${drawing.id}`);
        
        const existingLayer = layersRef.current.get(drawing.id);
        if (existingLayer && mountedRef.current) {
          console.log(`🔧 LayerManager: Setting up click handlers for existing drawing ${drawing.id}`);
          setupLayerClickHandlers(
            existingLayer,
            drawing,
            mountedRef.current,
            onRegionClick
          );
          setupCompletedRef.current.add(drawing.id);
        }
      } else {
        console.log(`✅ LayerManager: Drawing ${drawing.id} already fully set up`);
      }
    }
  }, [savedDrawings, featureGroup, onRegionClick, onRemoveShape, onUploadRequest, activeTool]);

  useEffect(() => {
    if (!mountedRef.current) return;
    
    processDrawings();

    return () => {
      console.log('🧹 LayerManager: Cleanup function called');
      mountedRef.current = false;
    };
  }, [processDrawings]);

  useLayerUpdates({
    savedDrawings,
    activeTool,
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
