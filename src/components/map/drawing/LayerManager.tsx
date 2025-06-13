
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
  const processedDrawingsRef = useRef(new Set<string>());
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

  // Clear processed drawings tracking when savedDrawings array changes significantly
  useEffect(() => {
    const currentDrawingIds = new Set(savedDrawings.map(d => d.id));
    const processedIds = Array.from(processedDrawingsRef.current);
    
    // If we have processed drawings that no longer exist, clear the tracking
    const hasRemovedDrawings = processedIds.some(id => !currentDrawingIds.has(id));
    
    if (hasRemovedDrawings) {
      console.log('🔄 LayerManager: Clearing processed drawings tracking due to removed drawings');
      processedDrawingsRef.current.clear();
      setupCompletedRef.current.clear();
    }
  }, [savedDrawings]);

  // Process each drawing when the savedDrawings array changes
  useEffect(() => {
    if (!featureGroup || !mountedRef.current) {
      return;
    }

    console.log('🔄 LayerManager: Processing drawings:', {
      savedDrawingsCount: savedDrawings.length,
      drawingIds: savedDrawings.map(d => d.id)
    });

    const processDrawing = async (drawing: DrawingData) => {
      // Always try to process if not already processed
      if (processedDrawingsRef.current.has(drawing.id)) {
        console.log(`⏭️ LayerManager: Drawing ${drawing.id} already processed, checking handlers`);
        
        // Even if processed, ensure handlers are set up
        if (!setupCompletedRef.current.has(drawing.id)) {
          const layer = layersRef.current.get(drawing.id);
          if (layer) {
            console.log(`🔧 LayerManager: Setting up missing handlers for processed drawing ${drawing.id}`);
            setupLayerClickHandlers(
              layer,
              drawing,
              mountedRef.current,
              onRegionClick
            );
            setupCompletedRef.current.add(drawing.id);
          }
        }
        return;
      }

      console.log(`🎯 LayerManager: Processing drawing ${drawing.id}`);
      
      if (!layersRef.current.has(drawing.id)) {
        console.log(`🆕 LayerManager: Creating new layer for drawing ${drawing.id}`);
        
        try {
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
          
          // Mark as processed
          processedDrawingsRef.current.add(drawing.id);
          
        } catch (error) {
          console.error(`❌ LayerManager: Error creating layer for drawing ${drawing.id}:`, error);
        }
      } else {
        console.log(`♻️ LayerManager: Layer exists for drawing ${drawing.id}`);
        // Mark as processed even if layer exists
        processedDrawingsRef.current.add(drawing.id);
      }

      // Setup handlers with a delay to ensure layer is fully created
      if (!setupCompletedRef.current.has(drawing.id) && mountedRef.current) {
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
        }, 100);
      }
    };

    // Process all drawings
    savedDrawings.forEach(drawing => {
      processDrawing(drawing);
    });

  }, [savedDrawings, onRegionClick, onRemoveShape, onUploadRequest]); // Include all callback dependencies

  // Setup handlers for existing layers when callbacks change
  useEffect(() => {
    if (!mountedRef.current) return;

    savedDrawings.forEach(drawing => {
      if (layersRef.current.has(drawing.id) && !setupCompletedRef.current.has(drawing.id)) {
        const layer = layersRef.current.get(drawing.id);
        if (layer) {
          console.log(`🔄 LayerManager: Re-setting up handlers for drawing ${drawing.id}`);
          setupLayerClickHandlers(
            layer,
            drawing,
            mountedRef.current,
            onRegionClick
          );
          setupCompletedRef.current.add(drawing.id);
        }
      }
    });
  }, [onRegionClick, onRemoveShape, onUploadRequest]);

  useEffect(() => {
    return () => {
      console.log('🧹 LayerManager: Cleanup function called');
      mountedRef.current = false;
    };
  }, []);

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
