
import { EditControl } from "react-leaflet-draw";
import { useDrawingToolActivation } from '@/hooks/useDrawingToolActivation';
import { useClearDrawings } from '@/hooks/useClearDrawings';
import { handleDrawingCreated } from '@/utils/drawing-creation';
import { useEffect } from 'react';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
}

const DrawTools = ({ onCreated, activeTool, onClearAll }: DrawToolsProps) => {
  const { editControlRef } = useDrawingToolActivation(activeTool);
  const { wasRecentlyCleared } = useClearDrawings(onClearAll);
  
  const handleCreated = (e: any) => {
    handleDrawingCreated(e, wasRecentlyCleared, onCreated);
  };

  // Define all drawing options
  const drawOptions = {
    polyline: activeTool === 'polyline',
    polygon: activeTool === 'polygon',
    rectangle: activeTool === 'rectangle',
    circle: activeTool === 'circle',
    marker: activeTool === 'marker',
    circlemarker: activeTool === 'circlemarker'
  };

  return (
    <EditControl
      ref={(editControl: any) => {
        editControlRef.current = editControl;
      }}
      position="topright"
      onCreated={handleCreated}
      draw={{
        ...drawOptions,
        // Always show these tools in the toolbar
        polygon: true,
        rectangle: true, 
        circle: true,
        marker: true,
      }}
      edit={{
        edit: {}, // Changed to empty object to satisfy the type requirement
        remove: {}, // Changed to empty object to satisfy the type requirement
        featureGroup: null, // Will be set internally by react-leaflet-draw
      }}
    />
  );
};

export default DrawTools;
