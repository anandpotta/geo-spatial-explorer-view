
import { useState } from 'react';
import L from 'leaflet';

/**
 * Custom hook for handling the drawing removal dialog functionality
 */
export function useRemoveDrawingDialog(featureGroup: L.FeatureGroup | null) {
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<L.Layer[]>([]);
  
  // Handle confirmation of removal
  const handleConfirmRemove = () => {
    // Remove all selected layers
    if (!featureGroup) return;
    
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
  
  const handleRemoveButtonClick = () => {
    if (!featureGroup) return;
    
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
  };
  
  return {
    isRemoveDialogOpen,
    setIsRemoveDialogOpen,
    handleConfirmRemove,
    handleCancelRemove,
    handleRemoveButtonClick
  };
}
