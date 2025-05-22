
import { useCallback, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';
import { loadSvgPaths, saveSvgPaths } from './useSavedPathsRestoration';

export function useClearAllOperation(onClearAll?: () => void) {
  const { isAuthenticated, currentUser } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  // Track if the dialog is already showing to prevent duplicates
  const dialogVisibleRef = useRef(false);
  
  // Listen for the custom leafletClearAllRequest event with improved logging
  useEffect(() => {
    const handleLeafletClearRequest = () => {
      console.log('Leaflet clear all request received!');
      
      // Only show the dialog if it's not already visible
      if (!dialogVisibleRef.current) {
        console.log('Showing confirmation dialog for clear all');
        setShowConfirmation(true);
        dialogVisibleRef.current = true;
      } else {
        console.log('Dialog already visible, ignoring duplicate request');
      }
    };
    
    // Clean up existing listeners to avoid duplicates
    window.removeEventListener('leafletClearAllRequest', handleLeafletClearRequest);
    // Add listener with capture phase for higher priority
    window.addEventListener('leafletClearAllRequest', handleLeafletClearRequest, true);
    
    return () => {
      window.removeEventListener('leafletClearAllRequest', handleLeafletClearRequest, true);
    };
  }, []);

  // Update dialogVisibleRef when showConfirmation changes
  useEffect(() => {
    dialogVisibleRef.current = showConfirmation;
  }, [showConfirmation]);
  
  const handleClearAllWrapper = useCallback(() => {
    console.log('Showing confirmation for clear all operation');
    setShowConfirmation(true);
  }, []);
  
  const confirmClearAll = useCallback(() => {
    console.log('Confirm clear all triggered');
    const featureGroup = window.featureGroup;
    if (featureGroup) {
      console.log('Using feature group for clear operation');
      handleClearAll({
        featureGroup,
        onClearAll
      });
      
      // Explicitly clear saved paths
      console.log('Clearing saved paths');
      saveSvgPaths([]);
      
      // Aggressively clear localStorage to ensure everything is gone
      console.log('Clearing local storage items');
      localStorage.removeItem('svgPaths');
      localStorage.removeItem('savedDrawings');
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('floorPlans');
      
      // Preserve authentication data
      const authState = localStorage.getItem('geospatial_auth_state');
      const users = localStorage.getItem('geospatial_users');
      
      // Force clear all drawing-related data
      const keysToPreserve = ['geospatial_auth_state', 'geospatial_users'];
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToPreserve.includes(key) && 
            (key.includes('drawing') || key.includes('map') || 
             key.includes('path') || key.includes('marker') || 
             key.includes('floor') || key.includes('svg'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Restore authentication data if it was removed
      if (authState) localStorage.setItem('geospatial_auth_state', authState);
      if (users) localStorage.setItem('geospatial_users', users);
      
      // Also dispatch the clearAllSvgPaths event to make sure all handlers are notified
      console.log('Dispatching clear events');
      window.dispatchEvent(new Event('clearAllSvgPaths'));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      window.dispatchEvent(new Event('drawingsUpdated'));
      window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
      
      // Force refresh the map to ensure clean slate
      if ((featureGroup as any)._map) {
        console.log('Triggering map refresh');
        (featureGroup as any)._map.fire('draw:deleted');
      }
    } else {
      // Fallback if featureGroup is not available
      console.warn('Feature group not available for clear operation, using localStorage fallback');
      // Preserve authentication data
      const authState = localStorage.getItem('geospatial_auth_state');
      const users = localStorage.getItem('geospatial_users');
      
      // Clear all non-auth storage
      const keysToPreserve = ['geospatial_auth_state', 'geospatial_users'];
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToPreserve.includes(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Restore authentication data
      if (authState) localStorage.setItem('geospatial_auth_state', authState);
      if (users) localStorage.setItem('geospatial_users', users);
      
      // Explicitly clear specific items
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
