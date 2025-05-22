
import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';

export function useClearAllOperation(onClearAll?: () => void) {
  const { isAuthenticated } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Listen for the custom leafletClearAllRequest event
  useEffect(() => {
    const handleLeafletClearRequest = () => {
      console.log('Received leaflet clear all request event');
      if (isAuthenticated) {
        setShowConfirmation(true);
      } else {
        toast.error('Please log in to clear drawings');
      }
    };
    
    // Centralized handler for all clear all actions
    const handleClearAllClick = (e: MouseEvent | Event) => {
      // Handle click event
      if (e instanceof MouseEvent) {
        const target = e.target as HTMLElement;
        
        // Check for Leaflet draw clear all button
        if (target && target.tagName === 'A') {
          // Check if this is the clear all button in Leaflet draw actions
          const isDrawActionsParent = 
            target.parentElement?.parentElement?.classList.contains('leaflet-draw-actions');
          
          const isClearAllButton = 
            target.textContent?.includes('Clear all') || 
            target.textContent?.includes('Delete') ||
            target.textContent?.trim() === 'Clear All';
          
          if (isDrawActionsParent && isClearAllButton) {
            console.log('Leaflet draw clear all layers button clicked');
            e.preventDefault();
            e.stopPropagation();
            
            // Show confirmation if authenticated
            if (isAuthenticated) {
              setShowConfirmation(true);
            } else {
              toast.error('Please log in to clear drawings');
            }
            
            // Prevent other handlers from running
            return false;
          }
        }
      }
    };
    
    // Use capture phase to intercept early
    document.addEventListener('click', handleClearAllClick, true);
    window.addEventListener('leafletClearAllRequest', handleLeafletClearRequest);
    
    return () => {
      document.removeEventListener('click', handleClearAllClick, true);
      window.removeEventListener('leafletClearAllRequest', handleLeafletClearRequest);
    };
  }, [isAuthenticated]);
  
  const handleClearAllWrapper = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to clear drawings');
      return;
    }
    
    setShowConfirmation(true);
  }, [isAuthenticated]);
  
  const confirmClearAll = useCallback(() => {
    console.log('Confirming clear all operation');
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
      
      if (onClearAll) {
        onClearAll();
      }
      
      toast.success('All map data cleared');
    }
    
    setShowConfirmation(false);
  }, [onClearAll]);
  
  return {
    handleClearAllWrapper,
    showConfirmation,
    setShowConfirmation,
    confirmClearAll
  };
}
