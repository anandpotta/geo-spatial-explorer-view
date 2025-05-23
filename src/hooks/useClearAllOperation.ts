
import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';

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
    
    // Handle Leaflet Draw specific clear all action
    const handleLeafletClearAction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Enhanced check for clear all layers button
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
          
          // Instead of dispatching an event, directly show confirmation
          if (isAuthenticated) {
            setShowConfirmation(true);
          } else {
            toast.error('Please log in to clear drawings');
          }
          
          // Return false to prevent the original action
          return false;
        }
      }
    };
    
    // Capture all click events to detect Leaflet clear action
    document.addEventListener('click', handleLeafletClearAction, true);
    window.addEventListener('leafletClearAllRequest', handleLeafletClearRequest);
    
    return () => {
      window.removeEventListener('leafletClearAllRequest', handleLeafletClearRequest);
      document.removeEventListener('click', handleLeafletClearAction, true);
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
    
    // First ensure we clear all SVG paths from the DOM directly
    if (featureGroup && (featureGroup as any)._map) {
      // Direct SVG path removal using DOM manipulation
      clearAllMapSvgElements((featureGroup as any)._map);
    }
    
    // Then proceed with normal layer clearing
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
      
      // Force a clean reload of the map visualization
      setTimeout(() => {
        window.dispatchEvent(new Event('mapRefresh'));
      }, 100);
      
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
