
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { FeatureGroup, useLeaflet } from 'react-leaflet';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import DrawTools from './DrawTools';
import LayerManager from './drawing/LayerManager';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { deleteMarker, getSavedMarkers } from '@/utils/marker-utils';
import { toast } from 'sonner';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
}

declare module 'leaflet' {
  interface Layer {
    drawingId?: string;
  }
}

const DrawingControls = forwardRef(({ 
  onCreated, 
  activeTool, 
  onRegionClick, 
  onClearAll, 
  onRemoveShape 
}: DrawingControlsProps, ref) => {
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawToolsRef = useRef<any>(null);
  const { savedDrawings } = useDrawings();
  const mountedRef = useRef<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current,
    activateEditMode: () => {
      if (drawToolsRef.current?.getEditControl()) {
        // Activate the edit mode
        const editControl = drawToolsRef.current.getEditControl();
        if (editControl && editControl._toolbars && editControl._toolbars.edit) {
          const editModes = editControl._toolbars.edit._modes;
          if (editModes && editModes.edit && editModes.edit.handler && typeof editModes.edit.handler.enable === 'function') {
            editModes.edit.handler.enable();
          }
        }
      }
    }
  }));
  
  useEffect(() => {
    getDrawingIdsWithFloorPlans();
    
    const handleFloorPlanUpdated = () => {
      if (featureGroupRef.current && mountedRef.current) {
        try {
          // Don't clear layers on floor plan update - we just want to redraw them with new styles
          window.dispatchEvent(new Event('storage'));
        } catch (err) {
          console.error('Error handling floor plan update:', err);
        }
      }
    };
    
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []);

  // Effect to activate edit mode when activeTool changes to 'edit'
  useEffect(() => {
    if (activeTool === 'edit' && drawToolsRef.current?.getEditControl()) {
      setTimeout(() => {
        try {
          if (drawToolsRef.current && mountedRef.current) {
            // This is the updated code to safely activate edit mode
            const editControl = drawToolsRef.current.getEditControl();
            if (editControl && editControl._toolbars && editControl._toolbars.edit) {
              const editModes = editControl._toolbars.edit._modes;
              if (editModes && editModes.edit && editModes.edit.handler && typeof editModes.edit.handler.enable === 'function') {
                editModes.edit.handler.enable();
                console.log("Edit mode activated successfully");
              } else {
                console.warn("Edit handler not found or not a function");
              }
            } else {
              console.warn("Edit toolbar not found");
            }
          }
        } catch (err) {
          console.error('Error activating edit mode:', err);
        }
      }, 300);
    }
  }, [activeTool, isInitialized]);

  useEffect(() => {
    if (featureGroupRef.current) {
      setIsInitialized(true);
    }
  }, []);

  const handleClearAll = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      
      const markers = getSavedMarkers();
      markers.forEach(marker => {
        deleteMarker(marker.id);
      });
      
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('savedDrawings');
      
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      
      if (onClearAll) {
        onClearAll();
      }
      
      toast.success('All drawings and markers cleared');
    }
  };

  const handleRemoveShape = (drawingId: string) => {
    if (onRemoveShape) {
      onRemoveShape(drawingId);
    }
  };

  return (
    <FeatureGroup ref={featureGroupRef}>
      {featureGroupRef.current && isInitialized && (
        <LayerManager 
          featureGroup={featureGroupRef.current}
          savedDrawings={savedDrawings}
          activeTool={activeTool}
          onRegionClick={onRegionClick}
          onRemoveShape={handleRemoveShape}
        />
      )}
      <DrawTools 
        ref={drawToolsRef}
        onCreated={onCreated} 
        activeTool={activeTool} 
        onClearAll={handleClearAll}
        featureGroup={featureGroupRef.current}
      />
    </FeatureGroup>
  );
});

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
