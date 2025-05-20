
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
  }, [featureGroup]);

  // Handle the forwarded ref (if provided)
  // Make this safer by checking the type and structure of forwardedRef
  useEffect(() => {
    if (!forwardedRef) return;
    
    try {
      if (typeof forwardedRef === 'function') {
        // If it's a function ref, call it with the current value
        forwardedRef(editControlRef.current);
      } else if (forwardedRef && typeof forwardedRef === 'object' && forwardedRef.hasOwnProperty('current')) {
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

  return (
    <>
      <EditControl
        ref={editControlRef}
        position="topright"
        onCreated={handleCreated}
        draw={drawOptions}
        edit={editOptions}
        featureGroup={featureGroup}
      />
      
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Layers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all drawings and markers? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
