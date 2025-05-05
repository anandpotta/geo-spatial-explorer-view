
import { forwardRef } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getDrawOptions } from '@/utils/draw-options';
import { useSvgRenderer } from '@/hooks/useSvgRenderer';
import { useDrawToolHandler } from '@/hooks/useDrawToolHandler';
import { useShapeCreation } from '@/hooks/useShapeCreation';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef<any, DrawToolsProps>(({ 
  onCreated, 
  activeTool, 
  featureGroup 
}: DrawToolsProps, ref) => {
  // Setup SVG renderer and optimizations
  useSvgRenderer(featureGroup);
  
  // Setup handlers and ref methods
  const { drawToolsRef } = useDrawToolHandler(ref);
  
  // Get shape creation handler
  const { handleCreated } = useShapeCreation(onCreated);
  
  // Get the drawing options
  const drawOptions = getDrawOptions();

  return (
    <EditControl
      ref={drawToolsRef}
      position="topright"
      onCreated={handleCreated}
      draw={drawOptions}
      edit={false}
      featureGroup={featureGroup}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
