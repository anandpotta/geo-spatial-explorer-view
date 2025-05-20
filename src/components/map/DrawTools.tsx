
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
import RemoveDrawingDialog from './drawing/RemoveDrawingDialog';

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
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<L.Layer[]>([]);
  
  // Use hooks for separated functionality
  const { getPathElements, getSVGPathData, clearPathElements } = usePathElements(featureGroup);
  const { handleCreated } = useShapeCreation(onCreated);
  
  // Initialize configuration and event handlers using custom hooks
  useDrawToolsConfiguration(featureGroup);
  useDrawToolsEventHandlers(getPathElements);
  useSavedPathsRestoration(featureGroup);
  usePathElementsCleaner(clearPathElements);
  
  // Store featureGroup in window for global access
  if (featureGroup && !window.featureGroup) {
    window.featureGroup = featureGroup;
  }
  
  useImperativeHandle(ref, () => ({
    getPathElements,
    getSVGPathData,
    clearPathElements
  }));

  // Get draw options from configuration
  const drawOptions = getDrawOptions();

  // Override the leaflet-draw edit handlers to show our custom dialog
  useEffect(() => {
    if (!featureGroup) return;

    // Function to override the default remove button behavior
    const overrideRemoveButtonBehavior = () => {
      // Target the delete handler button once it's available in the DOM
      const removeBtn = document.querySelector('.leaflet-draw-edit-remove');
      
      if (removeBtn) {
        // Remove existing listeners and add our custom one
        const newBtn = removeBtn.cloneNode(true);
        if (removeBtn.parentNode) {
          removeBtn.parentNode.replaceChild(newBtn, removeBtn);
        }
        
        newBtn.addEventListener('click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Get all selected layers (those with edit handles)
          const selectedFeatures: L.Layer[] = [];
          featureGroup.eachLayer((layer: any) => {
            if (layer.editing && layer.editing._enabled) {
              selectedFeatures.push(layer);
            }
          });
          
          if (selectedFeatures.length > 0) {
            setSelectedLayers(selectedFeatures);
            setIsRemoveDialogOpen(true);
          }
          
          // Prevent the default leaflet-draw actions from showing
          const actionsContainer = document.querySelector('.leaflet-draw-actions');
          if (actionsContainer) {
            (actionsContainer as HTMLElement).style.display = 'none';
          }
        });
      }
    };
    
    // Set up a mutation observer to detect when the edit controls are added to the DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          if (document.querySelector('.leaflet-draw-edit-remove')) {
            overrideRemoveButtonBehavior();
            break;
          }
        }
      }
    });
    
    // Start observing the document body for added nodes
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Also try immediately in case the button already exists
    setTimeout(overrideRemoveButtonBehavior, 500);
    
    return () => {
      observer.disconnect();
    };
  }, [featureGroup]);

  // Handle confirmation of removal
  const handleConfirmRemove = () => {
    // Remove all selected layers
    selectedLayers.forEach(layer => {
      featureGroup.removeLayer(layer);
    });
    
    // Clear selection and close dialog
    setSelectedLayers([]);
    setIsRemoveDialogOpen(false);
    
    // Dispatch events to notify components of changes
    window.dispatchEvent(new Event('drawingsUpdated'));
    window.dispatchEvent(new Event('markersUpdated'));
  };

  // Handle cancel
  const handleCancelRemove = () => {
    setSelectedLayers([]);
    setIsRemoveDialogOpen(false);
  };

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
      
      <RemoveDrawingDialog 
        isOpen={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
        onConfirmRemove={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </>
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
