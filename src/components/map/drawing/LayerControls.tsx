
import L from 'leaflet';
import { validateFeatureGroupMap } from './utils/MapValidator';
import { createUploadButtonControl } from './controls/UploadButtonControl';
import { handleClearAll } from './ClearAllHandler';

interface LayerControlsProps {
  layer: L.Layer;
  drawingId: string;
  activeTool: string | null;
  featureGroup: L.FeatureGroup;
  uploadButtonRoots: Map<string, any>;
  removeButtonRoots?: Map<string, any>;
  imageControlRoots?: Map<string, any>;
  isMounted: boolean;
  onUploadRequest: (drawingId: string) => void;
  onRemoveShape?: (drawingId: string) => void;
  onClearAll?: () => void;
}

export const createLayerControls = ({
  layer,
  drawingId,
  activeTool,
  featureGroup,
  uploadButtonRoots,
  removeButtonRoots,
  imageControlRoots,
  isMounted,
  onUploadRequest,
  onRemoveShape,
  onClearAll
}: LayerControlsProps) => {
  // Check if the map is valid
  if (!validateFeatureGroupMap(featureGroup)) {
    console.warn("Map container is not valid, skipping layer controls");
    return;
  }
  
  // Find and apply clear all functionality to the delete layers button
  if (featureGroup && featureGroup.getPane()) {
    try {
      // Get the map element
      const map = (featureGroup as any)._map;
      
      if (map) {
        // Add a slight delay to ensure the draw control buttons are mounted
        setTimeout(() => {
          const deleteButton = document.querySelector('.leaflet-draw-edit-remove');
          
          if (deleteButton) {
            // Remove existing event listeners
            const newDeleteButton = deleteButton.cloneNode(true);
            if (deleteButton.parentNode) {
              deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);
            }
            
            // Add new event listener
            newDeleteButton.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Use the same handler as the clear all button
              handleClearAll({ 
                featureGroup, 
                onClearAll 
              });
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error applying clear all behavior to delete layers button:", error);
    }
  }
  
  // Create upload button control if needed
  createUploadButtonControl({
    layer,
    drawingId,
    featureGroup,
    uploadButtonRoots,
    isMounted,
    onUploadRequest
  });
};
