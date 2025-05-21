
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

  // Get draw options from configuration
  const drawOptions = getDrawOptions();
  
  // Force visibility of drawing controls
  useEffect(() => {
    // Function to enforce drawing controls visibility
    const enforceControlsVisibility = () => {
      // Set timeout to allow the map to render first
      setTimeout(() => {
        try {
          // Find and force display of all drawing controls
          const drawControls = document.querySelectorAll('.leaflet-draw-toolbar');
          drawControls.forEach((control: Element) => {
            (control as HTMLElement).style.display = 'block';
            (control as HTMLElement).style.visibility = 'visible';
            (control as HTMLElement).style.opacity = '1';
          });
          
          // Force display of all draw buttons
          const drawButtons = document.querySelectorAll('[class*="leaflet-draw-draw-"]');
          drawButtons.forEach((button: Element) => {
            (button as HTMLElement).style.display = 'block';
            (button as HTMLElement).style.visibility = 'visible';
            (button as HTMLElement).style.opacity = '1';
          });
          
          // Make polygon button specifically visible
          const polygonButton = document.querySelector('.leaflet-draw-draw-polygon');
          if (polygonButton) {
            (polygonButton as HTMLElement).style.display = 'block';
            (polygonButton as HTMLElement).style.visibility = 'visible';
            (polygonButton as HTMLElement).style.opacity = '1';
            (polygonButton as HTMLElement).style.pointerEvents = 'auto';
          }
          
          // Force a reflow to ensure styles are applied
          document.body.offsetHeight;
        } catch (error) {
          console.error('Error enforcing controls visibility:', error);
        }
      }, 1000);
    };
    
    // Call it initially
    enforceControlsVisibility();
    
    // Set up a periodic check to maintain visibility
    const visibilityInterval = setInterval(enforceControlsVisibility, 3000);
    
    // Add styles for Leaflet Draw controls
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .leaflet-draw-toolbar {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      .leaflet-draw-draw-polygon,
      .leaflet-draw-draw-rectangle,
      .leaflet-draw-draw-circle,
      .leaflet-draw-draw-marker,
      .leaflet-draw-edit-edit,
      .leaflet-draw-edit-remove {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      clearInterval(visibilityInterval);
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, []);

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
