
import { useEffect, RefObject } from 'react';
import { toast } from 'sonner';

export function useDrawToolsEditMode(
  editControlRef: RefObject<any>,
  activeTool: string | null
) {
  // Effect to handle edit mode activation
  useEffect(() => {
    if (activeTool === 'edit' && editControlRef.current) {
      try {
        console.log('Attempting to activate edit mode from effect');
        const editControl = editControlRef.current;
        const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
        
        if (editHandler && typeof editHandler.enable === 'function') {
          // Add a small delay to avoid race conditions
          setTimeout(() => {
            editHandler.enable();
            console.log('Edit mode activated from effect');
          }, 150);
        }
      } catch (err) {
        console.error('Error activating edit mode from effect:', err);
      }
    }
  }, [activeTool, editControlRef]);
}
