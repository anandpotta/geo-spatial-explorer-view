
import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import { usePathElements } from '@/hooks/usePathElements';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { useDrawToolsConfiguration } from '@/hooks/useDrawToolsConfiguration';
import { useDrawToolsEventHandlers } from '@/hooks/useDrawToolsEventHandlers';
import { useSavedPathsRestoration } from '@/hooks/useSavedPathsRestoration';
import { usePathElementsCleaner } from '@/hooks/usePathElementsCleaner';
import { getDrawOptions } from './drawing/DrawOptionsConfiguration';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

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
  const [showClearDialog, setShowClearDialog] = useState(false);
  
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

  // Listen for the leafletClearAllRequest custom event
  useEffect(() => {
    const handleLeafletClearRequest = () => {
      console.log('DrawTools: Showing clear all confirmation dialog');
      setShowClearDialog(true);
    };
    
    // Remove existing listener to prevent duplicates
    window.removeEventListener('leafletClearAllRequest', handleLeafletClearRequest);
    // Add listener with higher priority
    window.addEventListener('leafletClearAllRequest', handleLeafletClearRequest);
    
    return () => {
      window.removeEventListener('leafletClearAllRequest', handleLeafletClearRequest);
    };
  }, []);

  const handleConfirmClear = () => {
    console.log('DrawTools: Confirming clear all');
    // Close the dialog
    setShowClearDialog(false);
    
    // Clear the feature group
    if (featureGroup) {
      console.log('Clearing feature group layers');
      featureGroup.clearLayers();
    }
    
    // Clear SVG elements from the DOM
    if (featureGroup && (featureGroup as any)._map) {
      console.log('Clearing SVG elements from the map');
      clearAllMapSvgElements((featureGroup as any)._map);
    }
    
    // Clear path elements and saved paths
    console.log('Clearing path elements');
    clearPathElements();
    
    // Explicitly remove from localStorage to prevent reloading
    localStorage.removeItem('svgPaths');
    localStorage.removeItem('savedDrawings');
    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('floorPlans');
    
    // Dispatch events
    console.log('Dispatching clear events');
    window.dispatchEvent(new Event('clearAllSvgPaths'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    
    // Call the onClearAll callback if provided
    if (onClearAll) {
      onClearAll();
    }
    
    toast.success('All shapes and layers cleared');
  };

  // Get draw options from configuration
  const drawOptions = getDrawOptions();

  return (
    <>
      <EditControl
        ref={editControlRef}
        position="topright"
        onCreated={handleCreated}
        draw={drawOptions}
        edit={false}
        featureGroup={featureGroup}
      />
      
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Layers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all drawings and shapes? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClear}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
