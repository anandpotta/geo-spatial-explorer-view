
import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';
import { loadSvgPaths, saveSvgPaths } from './useSavedPathsRestoration';

export function useClearAllOperation(onClearAll?: () => void) {
  const { isAuthenticated, currentUser } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Listen for the custom leafletClearAllRequest event
  useEffect(() => {
    const handleLeafletClearRequest = () => {
      console.log('Leaflet clear all request received, authenticated:', isAuthenticated);
      if (isAuthenticated) {
        setShowConfirmation(true);
      } else {
        toast.error('Please log in to clear drawings');
      }
    };
    
    window.addEventListener('leafletClearAllRequest', handleLeafletClearRequest);
    
    return () => {
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
    console.log('Confirm clear all triggered');
    const featureGroup = window.featureGroup;
    if (featureGroup) {
      handleClearAll({
        featureGroup,
        onClearAll
      });
      
      // Explicitly clear saved paths for current user
      if (currentUser) {
        console.log('Clearing saved paths for user', currentUser.id);
        saveSvgPaths([]);
      }
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
  }, [isAuthenticated, onClearAll, currentUser]);
  
  return {
    handleClearAllWrapper,
    showConfirmation,
    setShowConfirmation,
    confirmClearAll
  };
}
