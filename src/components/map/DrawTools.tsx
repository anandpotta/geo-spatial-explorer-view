
import { useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import { usePathElements } from '@/hooks/usePathElements';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { useDrawingToolsConfiguration } from '@/hooks/useDrawToolsConfiguration';
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
  const drawingLayerRef = useRef<L.FeatureGroup>(featureGroup);
  
  // Use hooks for separated functionality
  const { getPathElements, getSVGPathData, clearPathElements } = usePathElements(featureGroup);
  const { handleCreated } = useShapeCreation(onCreated);
  
  // Initialize configuration and event handlers using custom hooks
  useDrawingToolsConfiguration(featureGroup);
  useDrawToolsEventHandlers(getPathElements);
  useSavedPathsRestoration(featureGroup);
  usePathElementsCleaner(clearPathElements);

  // Activate drawing tools based on activeTool prop
  useEffect(() => {
    if (!editControlRef.current) return;
    
    try {
      const handler = editControlRef.current;
      
      // Enable appropriate drawing tools based on activeTool
      if (activeTool === 'polygon') {
        if (handler._toolbars && handler._toolbars.draw) {
          handler._toolbars.draw._modes.polygon.handler.enable();
        }
      } else if (activeTool === 'rectangle') {
        if (handler._toolbars && handler._toolbars.draw) {
          handler._toolbars.draw._modes.rectangle.handler.enable();
        }
      } else if (activeTool === 'circle') {
        if (handler._toolbars && handler._toolbars.draw) {
          handler._toolbars.draw._modes.circle.handler.enable();
        }
      } else if (activeTool === 'edit') {
        if (handler._toolbars && handler._toolbars.edit) {
          handler._toolbars.edit._modes.edit.handler.enable();
        }
      } else {
        // Disable all drawing modes if no specific tool is selected
        if (handler._toolbars) {
          Object.keys(handler._toolbars).forEach(toolbarKey => {
            const toolbar = handler._toolbars[toolbarKey];
            if (toolbar && toolbar._modes) {
              Object.keys(toolbar._modes).forEach(modeKey => {
                const mode = toolbar._modes[modeKey];
                if (mode && mode.handler && mode.handler.disable) {
                  mode.handler.disable();
                }
              });
            }
          });
        }
      }
    } catch (err) {
      console.error('Error activating drawing tool:', err);
    }
  }, [activeTool, editControlRef.current]);
  
  useImperativeHandle(ref, () => ({
    getPathElements,
    getSVGPathData,
    clearPathElements
  }));

  // Get draw options from configuration
  const drawOptions = getDrawOptions();

  return (
    <EditControl
      ref={editControlRef}
      position="topright"
      onCreated={handleCreated}
      draw={{
        ...drawOptions,
        // Enable the drawing tools based on activeTool
        polyline: activeTool === 'polyline' ? drawOptions.polyline : false,
        polygon: activeTool === 'polygon' ? drawOptions.polygon : false,
        rectangle: activeTool === 'rectangle' ? drawOptions.rectangle : false,
        circle: activeTool === 'circle' ? drawOptions.circle : false,
        marker: activeTool === 'marker' ? drawOptions.marker : false,
      }}
      edit={{
        featureGroup: featureGroup,
        edit: activeTool === 'edit',
        remove: activeTool === 'delete'
      }}
      featureGroup={featureGroup}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
