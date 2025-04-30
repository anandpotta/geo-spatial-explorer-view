
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { initializeLayerEditing, createEditOptions } from './drawing/LayerEditingUtils';
import { setupSvgPathRendering, getPathElements, getSVGPathData } from './drawing/PathUtils';
import { handleShapeCreated } from './drawing/ShapeCreationHandler';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  
  // Setup SVG rendering for all shapes
  useEffect(() => {
    // Initialize editing for existing layers
    if (featureGroup) {
      initializeLayerEditing(featureGroup);
    }
    
    // Override Leaflet's circle and rectangle rendering to force SVG path creation
    const cleanup = setupSvgPathRendering();
    
    return () => {
      cleanup();
    };
  }, [featureGroup]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    getPathElements: () => getPathElements(featureGroup),
    getSVGPathData: () => getSVGPathData(featureGroup)
  }));

  // Create edit options for the control
  const editOptions = createEditOptions(featureGroup);

  return (
    <EditControl
      ref={editControlRef}
      position="topright"
      onCreated={(e) => handleShapeCreated(e, onCreated)}
      draw={{
        rectangle: true,
        polygon: true,
        circle: true,
        circlemarker: false,
        marker: true,
        polyline: false
      }}
      edit={editOptions}
      featureGroup={featureGroup}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
