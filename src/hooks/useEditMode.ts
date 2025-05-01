
import { useEffect, RefObject } from 'react';

/**
 * Hook to manage edit mode activation/deactivation
 */
export function useEditMode(editControlRef: RefObject<any>, activeTool: string | null) {
  useEffect(() => {
    // Function to activate or deactivate edit mode based on activeTool
    const updateEditMode = () => {
      if (!editControlRef.current) {
        console.log('Edit control not available yet');
        return;
      }
      
      try {
        const editControl = editControlRef.current;
        const editToolbar = editControl._toolbars?.edit;
        
        if (!editToolbar) {
          console.log('Edit toolbar not available');
          return;
        }
        
        const editHandler = editToolbar._modes?.edit?.handler;
        const deleteHandler = editToolbar._modes?.remove?.handler;
        
        if (activeTool === 'edit') {
          // Activate edit mode
          if (editHandler && typeof editHandler.enable === 'function') {
            console.log('Activating edit mode');
            editHandler.enable();
          }
        } else {
          // Deactivate edit mode
          if (editHandler && typeof editHandler.disable === 'function' && editHandler.enabled()) {
            console.log('Deactivating edit mode');
            editHandler.disable();
          }
          
          // Deactivate delete mode
          if (deleteHandler && typeof deleteHandler.disable === 'function' && deleteHandler.enabled()) {
            console.log('Deactivating delete mode');
            deleteHandler.disable();
          }
        }
      } catch (err) {
        console.error('Error updating edit mode:', err);
      }
    };

    // Add a delay to ensure edit control is available
    const timerId = setTimeout(updateEditMode, 500);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [editControlRef, activeTool]);
}
