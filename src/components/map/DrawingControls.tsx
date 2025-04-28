
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import DrawTools from './DrawTools';
import LayerManager from './drawing/LayerManager';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
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
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current
  }));
  
  useEffect(() => {
    getDrawingIdsWithFloorPlans();
    
    const handleFloorPlanUpdated = () => {
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
      }
    };
    
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []);

  return (
    <FeatureGroup ref={featureGroupRef}>
      {featureGroupRef.current && (
        <LayerManager 
          featureGroup={featureGroupRef.current}
          savedDrawings={savedDrawings}
          activeTool={activeTool}
          onRegionClick={onRegionClick}
          onRemoveShape={onRemoveShape}
        />
      )}
      <DrawTools 
        ref={drawToolsRef}
        onCreated={onCreated} 
        activeTool={activeTool} 
        onClearAll={onClearAll} 
      />
    </FeatureGroup>
  );
});

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;

