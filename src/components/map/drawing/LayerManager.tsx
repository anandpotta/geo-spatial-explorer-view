
import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useLayerReferences } from '@/hooks/useLayerReferences';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';
import { useSvgPathManagement } from '@/hooks/useSvgPathManagement';
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
  
  // Initialize SVG path management
  useSvgPathManagement();
  
  console.log('🏗️ LayerManager: Rendering with:', {
    savedDrawingsCount: savedDrawings.length,
    onRegionClick: typeof onRegionClick,
    onUploadRequest: typeof onUploadRequest,
    activeTool,
    processedDrawings: Array.from(processedDrawingsRef.current)
  });

  const processDrawing = useCallback(async (drawing: DrawingData) => {
    if (processedDrawingsRef.current.has(drawing.id)) {
      console.log(`⏭️ LayerManager: Skipping already processed drawing ${drawing.id}`);
      return;
    }

    console.log(`🎯 LayerManager: Processing drawing ${drawing.id}`);
    
    // Mark as processed immediately
    processedDrawingsRef.current.add(drawing.id);
    
    // Create layer if it doesn't exist
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
        
      } catch (error) {
        console.error(`❌ LayerManager: Error creating layer for drawing ${drawing.id}:`, error);
        // Remove from processed set so it can be retried
        processedDrawingsRef.current.delete(drawing.id);
        return;
      }
    }

    // Setup handlers immediately after layer creation
    if (!setupCompletedRef.current.has(drawing.id) && mountedRef.current) {
      const layer = layersRef.current.get(drawing.id);
      if (layer) {
        console.log(`🔧 LayerManager: Setting up click handlers immediately for drawing ${drawing.id}`);
        setupLayerClickHandlers(
          layer,
          drawing,
          mountedRef.current,
          onRegionClick
        );
        setupCompletedRef.current.add(drawing.id);
        console.log(`✅ LayerManager: Setup completed immediately for drawing ${drawing.id}`);
      } else {
        console.error(`❌ LayerManager: Layer not found after creation for drawing ${drawing.id}`);
        // Remove from processed set so it can be retried
        processedDrawingsRef.current.delete(drawing.id);
      }
    }
  }, [featureGroup, activeTool, onRegionClick, onRemoveShape, onUploadRequest]);

  // Process each drawing immediately when it's created or the array changes
  useEffect(() => {
    if (!featureGroup || !mountedRef.current) {
      return;
    }

    console.log('🔄 LayerManager: Processing drawings:', {
      savedDrawingsCount: savedDrawings.length,
      drawingIds: savedDrawings.map(d => d.id),
      alreadyProcessed: Array.from(processedDrawingsRef.current)
    });

    // Process all drawings, but processDrawing will skip already processed ones
    savedDrawings.forEach(drawing => {
      processDrawing(drawing);
    });

    // Clean up processed drawings that are no longer in the saved drawings
    const currentDrawingIds = new Set(savedDrawings.map(d => d.id));
    const processedIds = Array.from(processedDrawingsRef.current);
    
    processedIds.forEach(id => {
      if (!currentDrawingIds.has(id)) {
        console.log(`🧹 LayerManager: Cleaning up removed drawing ${id}`);
        processedDrawingsRef.current.delete(id);
        setupCompletedRef.current.delete(id);
      }
    });

  }, [savedDrawings, processDrawing]);

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
