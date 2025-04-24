
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

  // Make sure we only enable the currently active tool
  const drawOptions = {
    polyline: false,
    circlemarker: false,
    rectangle: false,
    circle: false,
    polygon: false,
    marker: false,
  };
  
  // Only set the active tool to true
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
        edit: false,  // Disable editing by default to prevent errors
        remove: false // Disable remove by default
      }}
    />
  );
};

export default DrawTools;
