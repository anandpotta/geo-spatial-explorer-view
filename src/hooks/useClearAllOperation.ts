
import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';
import { loadSvgPaths, saveSvgPaths } from './useSavedPathsRestoration';

export function useClearAllOperation(onClearAll?: () => void) {
  const { isAuthenticated, currentUser } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Listen for the custom leafletClearAllRequest event with improved logging
  useEffect(() => {
    const handleLeafletClearRequest = () => {
      console.log('Leaflet clear all request received!');
      
      // Always show the confirmation dialog regardless of authentication
      console.log('Showing confirmation dialog for clear all');
      setShowConfirmation(true);
    };
    
    // Remove any existing listeners to avoid duplicates
    window.removeEventListener('leafletClearAllRequest', handleLeafletClearRequest);
    // Add listener with higher priority by using capture phase
    window.addEventListener('leafletClearAllRequest', handleLeafletClearRequest, true);
    
    return () => {
      window.removeEventListener('leafletClearAllRequest', handleLeafletClearRequest, true);
    };
  }, []);
  
  const handleClearAllWrapper = useCallback(() => {
    console.log('Showing confirmation for clear all operation');
    setShowConfirmation(true);
  }, []);
  
  const confirmClearAll = useCallback(() => {
    console.log('Confirm clear all triggered');
    const featureGroup = window.featureGroup;
    if (featureGroup) {
      handleClearAll({
        featureGroup,
        onClearAll
      });
      
      // Explicitly clear saved paths
      console.log('Clearing saved paths');
      saveSvgPaths([]);
      
      // Directly remove from localStorage to ensure it's gone
      localStorage.removeItem('svgPaths');
      localStorage.removeItem('savedDrawings');
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('floorPlans');
      
      // Also dispatch the clearAllSvgPaths event to make sure all handlers are notified
      window.dispatchEvent(new Event('clearAllSvgPaths'));
    } else {
      // Fallback if featureGroup is not available
      console.warn('Feature group not available for clear operation, using localStorage fallback');
      localStorage.removeItem('savedDrawings');
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('floorPlans');
      localStorage.removeItem('svgPaths');
      
      // Explicitly clear saved paths
      saveSvgPaths([]);
      
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
