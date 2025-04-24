
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

  // Define all drawing options, default to false
  const drawOptions = {
    polyline: false,
    polygon: false,
    rectangle: false,
    circle: false,
    marker: false,
    circlemarker: false
  };
  
  // Enable only the active tool
  if (activeTool && drawOptions.hasOwnProperty(activeTool)) {
    (drawOptions as any)[activeTool] = true;
  }

  return (
    <EditControl
      position="topright"
      onCreated={handleCreated}
      onMounted={(editControlInstance: any) => {
        editControlRef.current = editControlInstance;
      }}
      draw={drawOptions}
      edit={{
        edit: false,
        remove: false
      }}
    />
  );
};

export default DrawTools;
