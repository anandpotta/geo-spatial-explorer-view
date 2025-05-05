
import { useCallback } from 'react';
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
      const editToolbar = editControl._toolbars?.edit;
      
      if (!editToolbar) {
        console.log('Edit toolbar not available yet');
        return false;
      }
      
      const editHandler = editToolbar._modes?.edit?.handler;
      const deleteHandler = editToolbar._modes?.remove?.handler;
      
      const shouldEnableEdit = activeTool === 'edit';
      
      if (shouldEnableEdit && editHandler && typeof editHandler.enable === 'function') {
        const isAlreadyEnabled = editHandler.enabled && editHandler.enabled();
        if (!isAlreadyEnabled) {
          console.log('Enabling edit mode');
          
          // First ensure all layers are selected to make them eligible for editing
          if (editHandler._featureGroup) {
            editHandler._featureGroup.eachLayer((layer: any) => {
              if (typeof layer._path !== 'undefined') {
                editHandler._selectableLayers.addLayer(layer);
              }
            });
          }
          
          // Then enable edit mode
          editHandler.enable();
          
          // Update state and show notification
          toast.success('Edit mode activated', { 
            id: 'edit-mode-success',
            duration: 2000
          });
          
          // Ensure edit controls are visible
          ensureEditControlsVisibility();
          return true;
        }
        return isAlreadyEnabled;
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
      
      // Always ensure controls are visible regardless of edit mode
      ensureEditControlsVisibility();
      
      return shouldEnableEdit && isEditActive;
    } catch (err) {
      console.error('Error updating edit mode:', err);
      return false;
    }
  }, [editControlRef, activeTool, isEditActive]);

  return { updateEditMode };
}
