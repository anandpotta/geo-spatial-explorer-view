
import { useEffect, useRef } from 'react';

/**
 * Hook to handle toggling between drawing and editing modes
 */
export function useEditMode(editControlRef: React.RefObject<any>, activeTool: string | null) {
  const isEditModeActive = useRef<boolean>(false);
  
  // Handle switching between drawing and editing modes
  useEffect(() => {
    if (!editControlRef.current) return;
    
    // Safely check if edit mode should be activated or deactivated
    const safelyToggleEditMode = () => {
      if (!editControlRef.current) return;
      
      try {
        const editControl = editControlRef.current;
        const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
        
        // When activeTool is 'edit', enable edit mode if it's not already active
        if (activeTool === 'edit') {
          if (editHandler && !isEditModeActive.current && typeof editHandler.enable === 'function') {
            console.log('Activating edit mode');
            editHandler.enable();
            isEditModeActive.current = true;
          }
        } 
        // When activeTool is not 'edit', disable edit mode if it's active
        else if (isEditModeActive.current) {
          if (editHandler && typeof editHandler.disable === 'function') {
            console.log('Deactivating edit mode');
            editHandler.disable();
            isEditModeActive.current = false;
          }
        }
      } catch (err) {
        console.error('Error toggling edit mode:', err);
      }
    };
    
    // Use a delay to ensure the map is properly initialized
    setTimeout(safelyToggleEditMode, 100);
    
  }, [activeTool, editControlRef.current]);
  
  return { isEditModeActive };
}
