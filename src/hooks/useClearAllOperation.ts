
import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';
import { resetMap } from '@/utils/clear-operations';

export function useClearAllOperation(onClearAll?: () => void) {
  const { isAuthenticated } = useAuth();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const confirmClearAll = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to clear drawings');
      return;
    }
    
    // Open the confirmation dialog instead of immediately clearing
    setIsConfirmDialogOpen(true);
  }, [isAuthenticated]);
  
  const handleClearAllWrapper = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to clear drawings');
      return;
    }
    
    const featureGroup = window.featureGroup;
    if (featureGroup) {
      handleClearAll({
        featureGroup,
        onClearAll
      });
    } else {
      // Use our utility function for a complete reset
      resetMap();
      
      if (onClearAll) {
        onClearAll();
      }
      
      toast.success('All map data cleared');
    }
    
    // Close dialog after clearing
    setIsConfirmDialogOpen(false);
  }, [isAuthenticated, onClearAll]);
  
  const cancelClearAll = useCallback(() => {
    setIsConfirmDialogOpen(false);
  }, []);
  
  return {
    handleClearAllWrapper,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    confirmClearAll,
    cancelClearAll
  };
}
