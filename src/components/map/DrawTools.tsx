
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { configureSvgRenderer, optimizePolygonDrawing, enhancePathPreservation } from '@/utils/draw-tools-utils';
import { useEditMode } from '@/hooks/useEditMode';
import { usePathElements } from '@/hooks/usePathElements';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { toast } from 'sonner';

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
  
  // Configure SVG renderer and optimize polygon drawing
  useEffect(() => {
    if (!featureGroup) return;
    
    // Fix: Don't use getMap as it doesn't exist on FeatureGroup
    // Use type assertion to access _map internally without TypeScript errors
    const map = (featureGroup as any)._map;
    if (!map) return;
    
    // Set up SVG renderer configuration to reduce flickering
    const cleanupSvgRenderer = configureSvgRenderer();
    
    // Optimize polygon drawing specifically
    const originalOnMarkerDrag = optimizePolygonDrawing();
    
    // Set up path preservation
    const cleanupPathPreservation = enhancePathPreservation(map);
    
    // Apply additional anti-flickering CSS to the map container
    const mapContainer = map.getContainer();
    if (mapContainer) {
      mapContainer.classList.add('optimize-svg-rendering');
      
      // Add a style element with our anti-flicker CSS
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        .optimize-svg-rendering .leaflet-overlay-pane svg {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
        .leaflet-drawing {
          stroke-linecap: round;
          stroke-linejoin: round;
          vector-effect: non-scaling-stroke;
        }
        .leaflet-interactive {
          transform: translateZ(0);
          backface-visibility: hidden;
        }
      `;
      document.head.appendChild(styleEl);
      
      // Force the browser to acknowledge these changes
      mapContainer.getBoundingClientRect();
    }
    
    // Cleanup function
    return () => {
      cleanupSvgRenderer();
      cleanupPathPreservation();
      
      // Restore original marker drag handler if it was modified
      if (originalOnMarkerDrag && L.Edit && (L.Edit as any).Poly) {
        (L.Edit as any).Poly.prototype._onMarkerDrag = originalOnMarkerDrag;
      }
      
      // Remove the style element
      const styles = document.querySelectorAll('style');
      styles.forEach(style => {
        if (style.innerHTML.includes('optimize-svg-rendering')) {
          document.head.removeChild(style);
        }
      });
      
      // Remove the class from map container
      if (mapContainer) {
        mapContainer.classList.remove('optimize-svg-rendering');
      }
    };
  }, [featureGroup]);
  
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

  const drawOptions = {
    rectangle: true,
    polygon: {
      allowIntersection: false,
      drawError: {
        color: '#e1e100',
        message: '<strong>Cannot draw that shape!</strong>'
      },
      shapeOptions: {
        color: '#3388ff',
        weight: 4,
        opacity: 0.7,
        fillOpacity: 0.2
      },
      showArea: false,
      metric: true,
      smoothFactor: 1 // Lower value for less smoothing (more accurate paths)
    },
    circle: true,
    circlemarker: false,
    marker: true,
    polyline: false
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
