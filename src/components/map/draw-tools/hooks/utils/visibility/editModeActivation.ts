
/**
 * Force activate edit mode on a persistent basis
 */
export function persistentlyActivateEditMode(editControlRef: React.RefObject<any>): boolean {
  if (!editControlRef.current) return false;
  
  try {
    const editControl = editControlRef.current;
    const editToolbar = editControl._toolbars?.edit;
    
    if (!editToolbar || !editToolbar._modes) {
      return false;
    }
    
    const editHandler = editToolbar._modes?.edit?.handler;
    
    if (!editHandler || !editHandler.enable || typeof editHandler.enable !== 'function') {
      return false;
    }
    
    // First ensure all layers are selected to make them eligible for editing
    if (editHandler._featureGroup) {
      try {
        // Select all layers
        editHandler._featureGroup.eachLayer((layer: any) => {
          if (typeof layer._path !== 'undefined') {
            editHandler._selectableLayers.addLayer(layer);
          }
        });
        
        // Then enable edit mode
        if (!editHandler.enabled || !editHandler.enabled()) {
          editHandler.enable();
          console.log("Edit mode successfully activated permanently");
          
          // Import ensureEditControlsVisibility here to avoid circular dependencies
          const { ensureEditControlsVisibility } = require('./editControlsVisibility');
          
          // Ensure edit controls are visible after activation
          setTimeout(() => ensureEditControlsVisibility(), 100);
          
          return true;
        }
        return true; // Already enabled
      } catch (e) {
        console.error("Error selecting layers or enabling edit mode:", e);
        return false;
      }
    }
  } catch (e) {
    console.error("Error in persistently activating edit mode:", e);
  }
  
  return false;
}
