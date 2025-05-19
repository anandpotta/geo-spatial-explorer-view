
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { isMapValid } from '@/utils/leaflet-type-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  // Add effect to handle the edit mode when activated
  useEffect(() => {
    if (currentView === 'leaflet' && leafletMapRef.current && activeTool === 'edit') {
      try {
        if (isMapValid(leafletMapRef.current)) {
          // Find all drawn layers 
          const layers = leafletMapRef.current._layers;
          let foundEditableLayers = false;
          
          if (layers) {
            Object.keys(layers).forEach(layerId => {
              const layer = layers[layerId];
              // Check if this is a drawn layer that can be edited
              if (layer && layer.options && (layer.options.isDrawn || layer.options.id)) {
                foundEditableLayers = true;
                // Enable editing on this layer
                if (typeof layer.editing === 'object' && typeof layer.editing.enable === 'function') {
                  layer.editing.enable();
                  // Make sure layer is visible and interactive
                  if (layer._path) {
                    layer._path.classList.add('leaflet-interactive-drawing');
                    layer._path.classList.add('leaflet-editing-path');
                  }
                }
              }
            });
          }
          
          if (!foundEditableLayers) {
            toast.info('No drawable layers found to edit');
          } else {
            toast.info('Edit mode activated. Click on shapes to edit them');
          }
        }
      } catch (err) {
        console.error('Error activating edit mode:', err);
        toast.error('Failed to activate edit mode');
      }
    } else if (currentView === 'leaflet' && leafletMapRef.current && activeTool !== 'edit') {
      // Disable editing mode when another tool is selected
      try {
        if (isMapValid(leafletMapRef.current)) {
          const layers = leafletMapRef.current._layers;
          if (layers) {
            Object.keys(layers).forEach(layerId => {
              const layer = layers[layerId];
              if (layer && layer.editing && typeof layer.editing.disable === 'function') {
                layer.editing.disable();
                // Remove editing CSS classes
                if (layer._path) {
                  layer._path.classList.remove('leaflet-editing-path');
                }
              }
            });
          }
        }
      } catch (err) {
        console.error('Error disabling edit mode:', err);
      }
    }
  }, [currentView, leafletMapRef, activeTool]);
  
  const clearAllLayers = () => {
    if (currentView === 'cesium') {
      toast.info('Clearing all shapes');
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        // Validate the map instance before using it
        if (isMapValid(leafletMapRef.current)) {
          const layers = leafletMapRef.current._layers;
          if (layers) {
            Object.keys(layers).forEach(layerId => {
              const layer = layers[layerId];
              if (layer && layer.options && (layer.options.isDrawn || layer.options.id)) {
                leafletMapRef.current.removeLayer(layer);
              }
            });
            toast.info('All shapes cleared');
          }
        } else {
          console.warn('Leaflet map instance is not valid for clear operation');
          toast.error('Map control error. Please try again.');
        }
      } catch (err) {
        console.error('Error during clear operation:', err);
        toast.error('Failed to clear shapes. Please try again.');
      }
    }
  };
  
  const handleToolSelect = (tool: string) => {
    console.log(`Tool selected: ${tool}`);
    setActiveTool(tool === activeTool ? null : tool);
    onToolSelect(tool);
    
    if (tool === 'clear') {
      setIsConfirmDialogOpen(true);
      return;
    }
  };

  return (
    <>
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Map Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all paths, markers, and annotations from the map? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              clearAllLayers();
              setIsConfirmDialogOpen(false);
            }}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DrawingToolHandler;
