
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';

export function useClearAllOperation(onClearAll?: () => void) {
  const { isAuthenticated } = useAuth();
  
  const handleClearAllWrapper = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to clear drawings');
      return;
    }
    
    // Get the global feature group instance
    const featureGroup = window.featureGroup;
    
    if (featureGroup) {
      handleClearAll({
        featureGroup,
        onClearAll
      });
    } else {
      // Fallback if featureGroup is not available
      console.warn('Feature group not available for clear operation, using localStorage fallback');
      localStorage.removeItem('savedDrawings');
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('floorPlans');
      localStorage.removeItem('svgPaths');
      
      // Dispatch events to notify components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      window.dispatchEvent(new Event('drawingsUpdated'));
      window.dispatchEvent(new Event('clearAllSvgPaths'));
      window.dispatchEvent(new Event('clearAllDrawings'));
      
      if (onClearAll) {
        onClearAll();
      }
      
      toast.success('All map data cleared');
    }
  }, [isAuthenticated, onClearAll]);
  
  return {
    handleClearAllWrapper
  };
}
