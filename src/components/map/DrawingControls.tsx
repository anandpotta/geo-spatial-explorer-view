
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing';
import { useDrawings } from '@/hooks/useDrawings';
import DrawTools from './DrawTools';
import { LayerManager } from './drawing/LayerManager';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
}

declare module 'leaflet' {
  interface Layer {
    drawingId?: string;
  }
}

const DrawingControls = forwardRef(({ onCreated, activeTool, onRegionClick, onClearAll }: DrawingControlsProps, ref) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawToolsRef = useRef<any>(null);
  const { savedDrawings } = useDrawings();
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current
  }));

  return (
    <FeatureGroup ref={featureGroupRef}>
      <LayerManager 
        featureGroup={featureGroupRef.current!}
        savedDrawings={savedDrawings}
        onRegionClick={onRegionClick}
      />
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
