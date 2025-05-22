
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

  // Enhanced listener for the leafletClearAllRequest custom event
  useEffect(() => {
    console.log('Setting up leafletClearAllRequest event listener in DrawTools');
    
    const handleLeafletClearRequest = (event: Event) => {
      console.log('DrawTools: Received leafletClearAllRequest event');
      // Stop event propagation to prevent multiple handlers
      event.stopPropagation();
      // Show confirmation dialog
      console.log('DrawTools: Showing clear all confirmation dialog');
      setShowClearDialog(true);
    };
    
    // Remove existing listener to prevent duplicates
    window.removeEventListener('leafletClearAllRequest', handleLeafletClearRequest);
    // Add listener with highest priority
    window.addEventListener('leafletClearAllRequest', handleLeafletClearRequest, { capture: true });
    
    return () => {
      window.removeEventListener('leafletClearAllRequest', handleLeafletClearRequest, { capture: true });
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
      
      // Trigger Leaflet's draw:deleted event
      (featureGroup as any)._map.fire('draw:deleted');
    }
    
    // Clear path elements and saved paths
    console.log('Clearing path elements');
    clearPathElements();
    
    // Preserve authentication data
    const authState = localStorage.getItem('geospatial_auth_state');
    const users = localStorage.getItem('geospatial_users');
    
    // Clear all non-auth localStorage items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'geospatial_auth_state' && key !== 'geospatial_users') {
        keysToRemove.push(key);
      }
    }
    console.log(`Removing ${keysToRemove.length} localStorage items`);
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Restore auth data
    if (authState) localStorage.setItem('geospatial_auth_state', authState);
    if (users) localStorage.setItem('geospatial_users', users);
    
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
    window.dispatchEvent(new Event('mapRefresh'));
    
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
        edit={{ 
          featureGroup: featureGroup,
          remove: true  // Ensure remove option is enabled
        }}
        featureGroup={featureGroup}
      />
      
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="z-[10000]">
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
