
import React, { useState } from 'react';
import { toast } from 'sonner';
import { isMapValid } from '@/utils/leaflet-type-utils';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction 
} from "@/components/ui/alert-dialog";

interface DrawingToolHandlerProps {
  currentView: 'cesium' | 'leaflet';
  leafletMapRef: React.MutableRefObject<any>;
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  onToolSelect: (tool: string) => void;
}

const DrawingToolHandler: React.FC<DrawingToolHandlerProps> = ({
  currentView,
  leafletMapRef,
  activeTool,
  setActiveTool,
  onToolSelect
}) => {
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleToolSelect = (tool: string) => {
    console.log(`Tool selected: ${tool}`);
    setActiveTool(tool === activeTool ? null : tool);
    onToolSelect(tool);
    
    if (currentView === 'cesium') {
      if (tool === 'clear') {
        setShowClearDialog(true);
      }
    } else if (currentView === 'leaflet') {
      if (tool === 'clear' && leafletMapRef.current) {
        setShowClearDialog(true);
      }
    }
  };

  const handleConfirmClear = () => {
    try {
      if (currentView === 'leaflet' && leafletMapRef.current) {
        // Validate the map instance before using it
        if (isMapValid(leafletMapRef.current)) {
          // First clear drawn layers
          const layers = leafletMapRef.current._layers;
          if (layers) {
            Object.keys(layers).forEach(layerId => {
              const layer = layers[layerId];
              if (layer && layer.options && (layer.options.isDrawn || layer.options.id)) {
                leafletMapRef.current.removeLayer(layer);
              }
            });
          }
          
          // Then clear SVG elements directly from the DOM
          clearAllMapSvgElements(leafletMapRef.current);
          
          // Clear local storage
          localStorage.removeItem('savedDrawings');
          localStorage.removeItem('savedMarkers');
          localStorage.removeItem('floorPlans');
          localStorage.removeItem('svgPaths');
          
          // Dispatch events to notify components
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('markersUpdated'));
          window.dispatchEvent(new Event('drawingsUpdated'));
          window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
          window.dispatchEvent(new Event('clearAllSvgPaths'));
          
          toast.success('All shapes cleared');
        } else {
          console.warn('Leaflet map instance is not valid for clear operation');
          toast.error('Map control error. Please try again.');
        }
      } else if (currentView === 'cesium') {
        // For Cesium view, just clear localStorage
        localStorage.removeItem('savedDrawings');
        localStorage.removeItem('savedMarkers');
        localStorage.removeItem('floorPlans');
        localStorage.removeItem('svgPaths');
        
        // Dispatch events to notify components
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('markersUpdated'));
        window.dispatchEvent(new Event('drawingsUpdated'));
        
        toast.info('Clearing all shapes');
      }
    } catch (err) {
      console.error('Error during clear operation:', err);
      toast.error('Failed to clear shapes. Please try again.');
    } finally {
      setShowClearDialog(false);
    }
  };

  return (
    <>
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Layers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all drawings and markers? This action cannot be undone.
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
};

export default DrawingToolHandler;
