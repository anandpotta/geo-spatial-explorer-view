
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { configureSvgRenderer } from '@/utils/draw-tools-utils';
import { useEditMode } from '@/hooks/useEditMode';
import { usePathElements } from '@/hooks/usePathElements';
import { useShapeCreation } from '@/hooks/useShapeCreation';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  
  // Use hooks for separated functionality
  useEditMode(editControlRef, activeTool);
  const { getPathElements, getSVGPathData } = usePathElements(featureGroup);
  const { handleCreated } = useShapeCreation(onCreated);
  
  // Configure SVG renderer
  useEffect(() => {
    // Set up SVG renderer configuration
    const cleanupSvgRenderer = configureSvgRenderer();
    
    // Cleanup function
    return () => {
      cleanupSvgRenderer();
    };
  }, []);
  
  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    getPathElements,
    getSVGPathData,
    activateEditMode: () => {
      try {
        if (editControlRef.current) {
          const editControl = editControlRef.current;
          const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
          
          if (editHandler && typeof editHandler.enable === 'function') {
            console.log('Manually activating edit mode');
            editHandler.enable();
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error('Error manually activating edit mode:', err);
        return false;
      }
    }
  }));

  // Create a properly structured edit object
  const editOptions = {
    featureGroup: featureGroup,
    edit: {
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7
      }
    },
    remove: true
  };

  return (
    <EditControl
      ref={editControlRef}
      position="topright"
      onCreated={handleCreated}
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
