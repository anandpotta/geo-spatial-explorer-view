
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

  // Hook to detect when the "Clear all layers" button in the Leaflet draw control is clicked
  useEffect(() => {
    const handleClearAllClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if the clicked element is the "Clear all layers" button
      if (target && target.tagName === 'A' && 
          target.parentElement?.parentElement?.classList.contains('leaflet-draw-actions') &&
          target.textContent?.includes('Clear all')) {
        
        e.preventDefault();
        e.stopPropagation();
        setShowClearDialog(true);
      }
    };
    
    // Add click event listener to the document to catch all clicks
    document.addEventListener('click', handleClearAllClick, true);
    
    return () => {
      document.removeEventListener('click', handleClearAllClick, true);
    };
  }, []);

  const handleConfirmClear = () => {
    // Close the dialog
    setShowClearDialog(false);
    
    // Clear the feature group
    if (featureGroup) {
      featureGroup.clearLayers();
    }
    
    // Clear SVG elements from the DOM
    if (featureGroup && (featureGroup as any)._map) {
      clearAllMapSvgElements((featureGroup as any)._map);
    }
    
    // Clear path elements
    clearPathElements();
    
    // Dispatch events
    window.dispatchEvent(new Event('clearAllSvgPaths'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    
    // Call the onClearAll callback if provided
    if (onClearAll) {
      onClearAll();
    }
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
