
import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';

export function useClearAllOperation(onClearAll?: () => void) {
  const { isAuthenticated } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Centralized handler for all clear all actions with a single point of entry
  useEffect(() => {
    const handleClearAllRequest = (e: MouseEvent | Event) => {
      console.log('Handling clear all request');
      
      // If not authenticated, block the action
      if (!isAuthenticated) {
        toast.error('Please log in to clear drawings');
        return;
      }
      
      // For click events on Leaflet draw clear all button
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
          } else {
            // Not our target button
            return;
          }
        }
      }
      
      // Show confirmation dialog
      setShowConfirmation(true);
    };
    
    // Use capture phase to intercept early
    document.addEventListener('click', handleClearAllRequest, true);
    window.addEventListener('leafletClearAllRequest', handleClearAllRequest);
    
    return () => {
      document.removeEventListener('click', handleClearAllRequest, true);
      window.removeEventListener('leafletClearAllRequest', handleClearAllRequest);
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
