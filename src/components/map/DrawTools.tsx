
import { useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import { usePathElements } from '@/hooks/usePathElements';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { useDrawToolsConfiguration } from '@/hooks/useDrawToolsConfiguration';
import { useDrawToolsEventHandlers } from '@/hooks/useDrawToolsEventHandlers';
import { useSavedPathsRestoration } from '@/hooks/useSavedPathsRestoration';
import { usePathElementsCleaner } from '@/hooks/usePathElementsCleaner';
import { getDrawOptions } from './drawing/DrawOptionsConfiguration';

// Import leaflet CSS directly
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  
  // Use hooks for separated functionality
  const { getPathElements, getSVGPathData, clearPathElements } = usePathElements(featureGroup);
  const { handleCreated } = useShapeCreation(onCreated);
  
  // Initialize configuration and event handlers using custom hooks
  useDrawToolsConfiguration(featureGroup);
  useDrawToolsEventHandlers(getPathElements);
  useSavedPathsRestoration(featureGroup);
  usePathElementsCleaner(clearPathElements);
  
  useImperativeHandle(ref, () => ({
    getPathElements,
    getSVGPathData,
    clearPathElements
  }));

  // Set up global featureGroup reference for external tools to access
  useEffect(() => {
    // Make featureGroup accessible for external components
    window.featureGroup = featureGroup;
    
    return () => {
      // Cleanup the global reference on unmount
      if (window.featureGroup === featureGroup) {
        window.featureGroup = undefined;
      }
    };
  }, [featureGroup]);

  // Get draw options from configuration
  const drawOptions = getDrawOptions();
  
  // Configure edit options to enable proper editing
  const editOptions = {
    featureGroup: featureGroup,
    edit: {
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7,
        dashArray: '10, 10',
        fill: true,
        fillColor: '#ffffff',
        fillOpacity: 0.1
      }
    },
    remove: true
  };

  return (
    <EditControl
      ref={editControlRef}
      position="topright"
      onCreated={handleCreated}
      draw={drawOptions}
      edit={editOptions}
      featureGroup={featureGroup}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
