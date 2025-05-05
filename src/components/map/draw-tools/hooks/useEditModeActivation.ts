
import { useCallback, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { ensureEditControlsVisibility } from './utils/editControlsVisibility';

/**
 * Hook for edit mode activation functionality
 */
export function useEditModeActivation(
  editControlRef: React.RefObject<any>,
  activeTool: string | null, 
  isEditActive: boolean
) {
  // Set flag at module level
  useEffect(() => {
    if (activeTool === 'edit' && !isEditActive) {
      // Set flag when entering edit mode
      window._editModeActivating = true;
      
      // Clear flag after a delay
      const timeoutId = setTimeout(() => {
        window._editModeActivating = false;
      }, 3000);
      
      return () => {
        clearTimeout(timeoutId);
        window._editModeActivating = false;
      };
    }
    
    return () => {
      // Ensure flag is cleared when unmounting
      window._editModeActivating = false;
    };
  }, [activeTool, isEditActive]);
  
  /**
   * Updates the edit mode state based on active tool
   */
  const updateEditMode = useCallback(() => {
    if (!editControlRef.current) {
      console.log('Edit control ref not available yet');
      return false;
    }
    
    try {
      const editControl = editControlRef.current;
      
      // Check if edit control has been properly initialized with toolbars
      if (!editControl._toolbars || !editControl._toolbars.edit) {
        console.log('Edit control toolbars not initialized yet');
        return false;
      }
      
      const editToolbar = editControl._toolbars.edit;
      
      if (!editToolbar || !editToolbar._modes) {
        console.log('Edit toolbar or modes not available yet');
        return false;
      }
      
      const editHandler = editToolbar._modes?.edit?.handler;
      const deleteHandler = editToolbar._modes?.remove?.handler;
      
      if (!editHandler) {
        console.log('Edit handler not available yet');
        return false;
      }
      
      const shouldEnableEdit = activeTool === 'edit';
      
      if (shouldEnableEdit && editHandler && typeof editHandler.enable === 'function') {
        try {
          // Check if already enabled to avoid duplicate activation
          const isAlreadyEnabled = editHandler.enabled && editHandler.enabled();
          
          if (!isAlreadyEnabled) {
            console.log('Enabling edit mode');
            
            // Set activation flag
            window._editModeActivating = true;
            
            // First ensure all layers are selected to make them eligible for editing
            if (editHandler._featureGroup) {
              try {
                editHandler._featureGroup.eachLayer((layer: any) => {
                  if (typeof layer._path !== 'undefined') {
                    editHandler._selectableLayers.addLayer(layer);
                  }
                });
                
                // Then enable edit mode
                editHandler.enable();
                
                // Show notification
                toast.success('Edit mode activated', { 
                  id: 'edit-mode-success',
                  duration: 2000
                });
                
                // Ensure edit controls are visible
                ensureEditControlsVisibility();
                
                // Clear activation flag after delay
                setTimeout(() => {
                  window._editModeActivating = false;
                }, 2000);
                
                return true;
              } catch (layerError) {
                console.error('Error selecting layers:', layerError);
                window._editModeActivating = false;
                return false;
              }
            }
          }
          return isAlreadyEnabled;
        } catch (activationError) {
          console.error('Error activating edit mode:', activationError);
          window._editModeActivating = false;
          return false;
        }
      } else if (!shouldEnableEdit) {
        // Deactivate edit mode
        if (editHandler && typeof editHandler.disable === 'function' && editHandler.enabled && editHandler.enabled()) {
          editHandler.disable();
        }
        
        // Deactivate delete mode
        if (deleteHandler && typeof deleteHandler.disable === 'function' && deleteHandler.enabled && deleteHandler.enabled()) {
          deleteHandler.disable();
        }
      }
      
      // Always ensure controls are visible
      ensureEditControlsVisibility();
      
      // Clear activation flag
      window._editModeActivating = false;
      
      return shouldEnableEdit && isEditActive;
    } catch (err) {
      console.error('Error updating edit mode:', err);
      window._editModeActivating = false;
      return false;
    }
  }, [editControlRef, activeTool, isEditActive]);

  return { updateEditMode };
}
