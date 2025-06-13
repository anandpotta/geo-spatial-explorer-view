
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
    activeTool
  });

  // Process each drawing immediately when it's created or the array changes
  useEffect(() => {
    if (!featureGroup || !mountedRef.current) {
      return;
    }

    console.log('🔄 LayerManager: Processing drawings:', {
      savedDrawingsCount: savedDrawings.length,
      drawingIds: savedDrawings.map(d => d.id)
    });

    const processDrawing = async (drawing: DrawingData) => {
      console.log(`🎯 LayerManager: Processing drawing ${drawing.id}`);
      
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
          return;
        }
      }

      // Setup handlers immediately after layer creation or if missing
      if (!setupCompletedRef.current.has(drawing.id) && mountedRef.current) {
        // Small delay to ensure layer is fully added to the map
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
        }, 50); // Reduced delay for faster response
      }
    };

    // Process all drawings
    savedDrawings.forEach(drawing => {
      processDrawing(drawing);
    });

  }, [savedDrawings, onRegionClick, onRemoveShape, onUploadRequest, featureGroup, activeTool]);

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
