
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { usePathElements } from '@/hooks/usePathElements';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';
import { useSvgRenderOptimization } from '@/hooks/useSvgRenderOptimization';
import { useSvgPathObserver } from '@/hooks/useSvgPathObserver';
import { getDrawOptions } from '@/utils/draw-options-config';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  
  // Use hooks for separated functionality
  const { getPathElements, getSVGPathData, restorePathVisibility } = usePathElements(featureGroup);
  const { handleCreated } = useShapeCreation(onCreated);
  
  // Get the map instance from the feature group
  const map = featureGroup ? getMapFromLayer(featureGroup) : null;
  
  // Setup SVG rendering optimization
  useSvgRenderOptimization(map);
  
  // Setup path observation to maintain visibility
  useSvgPathObserver(map, restorePathVisibility);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getPathElements,
    getSVGPathData,
    restorePathVisibility
  }));

  // Get drawing options configuration
  const drawOptions = getDrawOptions();

  return (
    <EditControl
      ref={editControlRef}
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
