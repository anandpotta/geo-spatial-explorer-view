
import { useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useSvgRenderer, useDrawControlsVisibility, useEditControlCleanup } from '@/hooks/useDrawToolsEffects';
import { createEditControlOptions, processCreatedShape } from '@/utils/draw-tools-utils';
import { useSvgPathElements } from '@/hooks/useSvgPathElements';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  
  // Setup SVG renderer
  useSvgRenderer(featureGroup);

  // Ensure draw controls remain visible
  useDrawControlsVisibility();
  
  // Clean up edit control on unmount
  useEditControlCleanup(editControlRef);
  
  // Get SVG path utilities
  const { getPathElements, getSVGPathData } = useSvgPathElements(featureGroup);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    getPathElements,
    getSVGPathData
  }));

  // Handler for shape creation
  const handleCreated = (e: any) => {
    processCreatedShape(e, onCreated);
  };

  // Create edit control options
  const editOptions = createEditControlOptions();

  return (
    <EditControl
      ref={editControlRef}
      {...editOptions}
      onCreated={handleCreated}
      featureGroup={featureGroup}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
