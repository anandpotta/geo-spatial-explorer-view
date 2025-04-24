
import { EditControl } from "react-leaflet-draw";
import { useDrawingToolActivation } from '@/hooks/useDrawingToolActivation';
import { useClearDrawings } from '@/hooks/useClearDrawings';
import { handleDrawingCreated } from '@/utils/drawing-creation';
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

  return (
    <EditControl
      position="topright"
      onCreated={handleCreated}
      onMounted={(editControlInstance: any) => {
        editControlRef.current = editControlInstance;
      }}
      draw={{
        rectangle: activeTool === 'rectangle',
        polygon: activeTool === 'polygon',
        circle: activeTool === 'circle',
        circlemarker: false,
        marker: activeTool === 'marker',
        polyline: false
      }}
    />
  );
};

export default DrawTools;
