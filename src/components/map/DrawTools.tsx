
import { useEffect, useRef, forwardRef } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { useDrawToolsRef } from '@/hooks/useDrawToolsRef';
import { useDrawToolsCleanup } from '@/hooks/useDrawToolsCleanup';
import { setupSvgRenderer, makeEditHandlersSafe } from '@/utils/leaflet/draw-tools-utils';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  const isComponentMounted = useRef(true);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

  // Set up SVG renderer
  useEffect(() => {
    // This effect will ensure all layers use SVG renderer
    if (!featureGroup) return;
    
    // Initialize the global cleanup timers array if it doesn't exist
    if (!window._leafletCleanupTimers) {
      window._leafletCleanupTimers = [];
    }
    
    const cleanup = setupSvgRenderer();
    cleanupFunctionsRef.current.push(cleanup);
    
    // Add makeEditHandlersSafe to cleanup functions
    const makeEditHandlersSafeCleaner = () => {
      try {
        makeEditHandlersSafe(editControlRef);
      } catch (err) {
        console.error('Error applying safety patches to edit handlers:', err);
      }
    };
    
    cleanupFunctionsRef.current.push(makeEditHandlersSafeCleaner);
    
    return () => {
      // Mark component as unmounted to prevent further operations
      isComponentMounted.current = false;
      
      // Run all registered cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (err) {
          console.error('Error running cleanup function:', err);
        }
      });
    };
  }, [featureGroup]);

  // Handle shape creation
  const handleCreated = useShapeCreation(onCreated, isComponentMounted);

  // Set up ref API
  useDrawToolsRef(ref, editControlRef, featureGroup);

  // Set up cleanup logic
  useDrawToolsCleanup(editControlRef, isComponentMounted, cleanupFunctionsRef, featureGroup);

  // Check featureGroup validity before rendering
  if (!featureGroup) {
    console.warn('DrawTools received null or undefined featureGroup');
    return null;
  }

  return (
    <EditControl
      ref={editControlRef}
      position="topright"
      draw={{
        rectangle: true,
        polygon: true,
        circle: true,
        circlemarker: false,
        marker: true,
        polyline: false
      }}
      edit={{
        featureGroup: featureGroup,
        edit: {
          selectedPathOptions: {
            maintainColor: false,
            opacity: 0.7
          }
        },
        remove: true
      }}
      onCreated={handleCreated}
      featureGroup={featureGroup}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
