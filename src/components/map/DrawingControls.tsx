
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import DrawingCanvas from './drawing/DrawingCanvas';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
}

const DrawingControls = forwardRef(({ 
  onCreated, 
  activeTool, 
  onRegionClick, 
  onClearAll 
}: DrawingControlsProps, ref) => {
  const { savedDrawings } = useDrawings();
  const [drawingsWithFloorPlans, setDrawingsWithFloorPlans] = useState<DrawingData[]>([]);
  const canvasRef = useRef<any>(null);
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => canvasRef.current?.featureGroupRef.current,
    getDrawTools: () => canvasRef.current?.drawToolsRef.current
  }));
  
  useEffect(() => {
    const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    const withFloorPlans = savedDrawings.filter(
      drawing => savedFloorPlans[drawing.id] && savedFloorPlans[drawing.id].data
    );
    setDrawingsWithFloorPlans(withFloorPlans);
  }, [savedDrawings]);

  return (
    <DrawingCanvas
      ref={canvasRef}
      onCreated={onCreated}
      activeTool={activeTool}
      onRegionClick={onRegionClick}
      onClearAll={onClearAll}
      savedDrawings={savedDrawings}
      drawingsWithFloorPlans={drawingsWithFloorPlans}
    />
  );
});

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
