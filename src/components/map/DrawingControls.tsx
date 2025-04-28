
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { FeatureGroup } from 'react-leaflet';
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
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawToolsRef = useRef<any>(null);
  const { savedDrawings } = useDrawings();
  const mountedRef = useRef<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current
  }));
  
  useEffect(() => {
    getDrawingIdsWithFloorPlans();
    
    const handleFloorPlanUpdated = () => {
      if (featureGroupRef.current && mountedRef.current) {
        try {
          featureGroupRef.current.clearLayers();
        } catch (err) {
          console.error('Error clearing layers on floor plan update:', err);
        }
      }
    };
    
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []);

  useEffect(() => {
    if (featureGroupRef.current && !isInitialized) {
      setIsInitialized(true);
    }
  }, [featureGroupRef.current]);

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

  // Make sure we get the feature group ref from the FeatureGroup component
  const setFeatureGroupRef = (ref: L.FeatureGroup) => {
    if (ref && !featureGroupRef.current) {
      featureGroupRef.current = ref;
    }
  };

  return (
    <FeatureGroup ref={setFeatureGroupRef}>
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
      />
    </FeatureGroup>
  );
});

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
