
import { useRef, useEffect, forwardRef, ForwardRefRenderFunction } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import { usePathElements } from '@/hooks/usePathElements';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { useDrawToolsConfiguration } from '@/hooks/useDrawToolsConfiguration';
import { useDrawToolsEventHandlers } from '@/hooks/useDrawToolsEventHandlers';
import { useSavedPathsRestoration } from '@/hooks/useSavedPathsRestoration';
import { usePathElementsCleaner } from '@/hooks/usePathElementsCleaner';
import { getDrawOptions } from './drawing/DrawOptionsConfiguration';
import { useClearConfirmation } from '@/hooks/useClearConfirmation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// Import leaflet CSS directly
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

// Change to a ForwardRefRenderFunction to properly handle the forwarded ref
const DrawTools: ForwardRefRenderFunction<any, DrawToolsProps> = (
  { onCreated, activeTool, onClearAll, featureGroup },
  forwardedRef
) => {
  // Use our own internal ref
  const editControlRef = useRef<any>(null);
  const dialogCancelRef = useRef<HTMLButtonElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const controlsAddedRef = useRef<boolean>(false);
  
  // Use hooks for separated functionality
  const { getPathElements, getSVGPathData, clearPathElements } = usePathElements(featureGroup);
  const { handleCreated } = useShapeCreation(onCreated);
  
  // Initialize configuration and event handlers using custom hooks
  useDrawToolsConfiguration(featureGroup);
  useDrawToolsEventHandlers(getPathElements);
  useSavedPathsRestoration(featureGroup);
  usePathElementsCleaner(clearPathElements);
  
  // Clear confirmation dialog
  const { isClearDialogOpen, setIsClearDialogOpen, handleConfirmClear } = 
    useClearConfirmation(featureGroup, onClearAll);
  
  // Store featureGroup in window for global access
  useEffect(() => {
    if (featureGroup && !window.featureGroup) {
      window.featureGroup = featureGroup;
    }

    // Get the map instance from the featureGroup
    if (featureGroup && !mapRef.current) {
      try {
        // Use type assertion to safely access protected properties
        const firstLayer = featureGroup.getLayers()[0];
        
        // Access protected _map property through type assertion
        const anyFeatureGroup = featureGroup as any;
        if (anyFeatureGroup._map) {
          mapRef.current = anyFeatureGroup._map;
          console.log("Map found for draw tools via feature group");
        } else if (firstLayer) {
          // Try to get map from first layer if available
          const anyFirstLayer = firstLayer as any;
          if (anyFirstLayer._map) {
            mapRef.current = anyFirstLayer._map;
            console.log("Map found for draw tools via first layer");
          }
        }

        // If we found a map, store it
        if (mapRef.current) {
          console.log("Map found for draw tools");
          controlsAddedRef.current = true; // Mark that we can add controls
        }
      } catch (err) {
        console.warn("Could not retrieve map from feature group:", err);
      }
    }
  }, [featureGroup]);

  // Handle the forwarded ref (if provided)
  useEffect(() => {
    if (!forwardedRef) return;
    
    try {
      if (typeof forwardedRef === 'function') {
        // If it's a function ref, call it with the current value
        forwardedRef(editControlRef.current);
      } else if (forwardedRef && typeof forwardedRef === 'object' && 'current' in forwardedRef) {
        // Only set current if it's a proper ref object with a current property
        forwardedRef.current = editControlRef.current;
      }
    } catch (error) {
      console.error('Error setting forwarded ref:', error);
    }
  }, [forwardedRef, editControlRef.current]);
  
  // Get draw options from configuration
  const drawOptions = getDrawOptions();

  // Explicitly structure the edit object in a way the library expects
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

  // Ensure proper focus management when the dialog opens
  useEffect(() => {
    if (isClearDialogOpen && dialogCancelRef.current) {
      // Focus the cancel button when dialog opens
      setTimeout(() => {
        dialogCancelRef.current?.focus();
      }, 50);
    }
  }, [isClearDialogOpen]);

  // Check if the map is ready before rendering EditControl
  const isMapReady = (() => {
    if (!mapRef.current) return false;
    
    // Use getContainer method instead of _container
    try {
      const container = mapRef.current.getContainer();
      return container && document.body.contains(container);
    } catch (e) {
      return false;
    }
  })();

  // Force redraw of controls - add this to fix missing controls
  useEffect(() => {
    if (isMapReady && featureGroup) {
      // Force a redraw after a short delay
      const timer = setTimeout(() => {
        const map = (featureGroup as any)._map;
        if (map) {
          map.invalidateSize(true);
          console.log("Map invalidated to show controls");
          
          // Force refresh of edit control if it exists
          if (editControlRef.current) {
            const editDiv = document.querySelector('.leaflet-draw.leaflet-control');
            if (editDiv) {
              editDiv.classList.add('leaflet-draw-toolbar-shown');
              console.log("Forcing edit control visibility");
            }
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isMapReady, featureGroup]);

  return (
    <>
      {isMapReady && (
        <EditControl
          ref={editControlRef}
          position="topright"
          onCreated={handleCreated}
          draw={drawOptions}
          edit={editOptions}
          featureGroup={featureGroup}
        />
      )}
      
      <AlertDialog 
        open={isClearDialogOpen} 
        onOpenChange={setIsClearDialogOpen}
      >
        <AlertDialogContent onEscapeKeyDown={() => setIsClearDialogOpen(false)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Layers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all drawings and markers? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={dialogCancelRef}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClear}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Export using forwardRef to properly handle the ref passing
export default forwardRef(DrawTools);
