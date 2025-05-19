
import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';
import { preserveAuthData } from '@/utils/clear-operations';

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
      // Fallback if featureGroup is not available
      console.warn('Feature group not available for clear operation, using localStorage fallback');
      
      // Get restore function for auth data
      const restoreAuth = preserveAuthData();
      
      // Clear localStorage
      localStorage.clear();
      
      // Restore auth data
      restoreAuth();
      
      // Forcefully clear specific items
      localStorage.removeItem('savedDrawings');
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('floorPlans');
      localStorage.removeItem('svgPaths');
      
      // Clean up all marker tooltips
      const tooltips = document.querySelectorAll('.marker-tooltip');
      tooltips.forEach(tooltip => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      });
      
      // Dispatch events to notify components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      window.dispatchEvent(new Event('drawingsUpdated'));
      
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
