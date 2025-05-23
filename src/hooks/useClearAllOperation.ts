
import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';
import L from 'leaflet';

// Global state to track if a confirmation dialog is already showing
// This prevents multiple dialogs from appearing simultaneously
let isConfirmationDialogOpen = false;

export function useClearAllOperation(onClearAll?: () => void) {
  const { isAuthenticated } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Update global state when local state changes
  useEffect(() => {
    isConfirmationDialogOpen = showConfirmation;
    return () => {
      // When component unmounts, reset global flag if this was the component showing dialog
      if (showConfirmation) {
        isConfirmationDialogOpen = false;
      }
    };
  }, [showConfirmation]);
  
  // Listen for the custom leafletClearAllRequest event
  useEffect(() => {
    const handleLeafletClearRequest = () => {
      console.log('Received leaflet clear all request event');
      if (isAuthenticated) {
        // Only show dialog if no other dialog is currently open
        if (!isConfirmationDialogOpen) {
          setShowConfirmation(true);
        }
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
          
          // Only show dialog if no other dialog is currently open
          if (isAuthenticated) {
            if (!isConfirmationDialogOpen) {
              setShowConfirmation(true);
            }
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
    
    // Only show dialog if no other dialog is currently open
    if (!isConfirmationDialogOpen) {
      setShowConfirmation(true);
    }
  }, [isAuthenticated]);
  
  const confirmClearAll = useCallback(() => {
    console.log('Confirming clear all operation');
    const featureGroup = window.featureGroup;
    
    // Preserve selected location data before clearing
    const selectedLocation = localStorage.getItem('selectedLocation');
    
    // First ensure we clear all SVG paths from the DOM directly
    // Get all map instances from document - using a safer approach
    const mapContainers = document.querySelectorAll('.leaflet-container');
    if (mapContainers && mapContainers.length > 0) {
      mapContainers.forEach(container => {
        // Safely check if the container has the _leaflet_id property
        const leafletId = (container as any)._leaflet_id;
        if (leafletId && (L as any).maps) {
          const mapInstance = (L as any).maps[leafletId];
          if (mapInstance) {
            console.log('Found map instance, clearing SVG paths directly');
            clearAllMapSvgElements(mapInstance);
            
            // Preserve red markers and their tooltips after clearing
            setTimeout(() => {
              // Ensure red markers remain visible
              const redMarkers = container.querySelectorAll('img[src*="marker-icon-2x-red.png"]');
              redMarkers.forEach(marker => {
                (marker as HTMLElement).style.display = '';
                (marker as HTMLElement).style.visibility = 'visible';
              });
              
              // Ensure selected location tooltips remain visible
              const selectedTooltips = container.querySelectorAll('.selected-location-tooltip');
              selectedTooltips.forEach(tooltip => {
                (tooltip as HTMLElement).style.display = '';
                (tooltip as HTMLElement).style.visibility = 'visible';
              });
            }, 50);
          }
        }
      });
    }
    
    // If featureGroup exists, also clear through it
    if (featureGroup && (featureGroup as any)._map) {
      // Direct SVG path removal using DOM manipulation
      clearAllMapSvgElements((featureGroup as any)._map);
      
      // Also use the normal layer clearing mechanism
      handleClearAll({
        featureGroup,
        onClearAll
      });
    } else {
      // Fallback if featureGroup is not available
      console.warn('Feature group not available for clear operation, using localStorage fallback');
      
      // Preserve authentication data and selected location
      const authState = localStorage.getItem('geospatial_auth_state');
      const users = localStorage.getItem('geospatial_users');
      
      // Forcefully clear specific storages that might be causing issues
      localStorage.removeItem('savedDrawings');
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('floorPlans');
      localStorage.removeItem('svgPaths');
      
      // Restore authentication data and selected location
      if (authState) {
        localStorage.setItem('geospatial_auth_state', authState);
      }
      if (users) {
        localStorage.setItem('geospatial_users', users);
      }
      if (selectedLocation) {
        localStorage.setItem('selectedLocation', selectedLocation);
      }
      
      // Dispatch events to notify components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      window.dispatchEvent(new Event('drawingsUpdated'));
      window.dispatchEvent(new Event('clearAllSvgPaths'));
      
      // Force a clean reload of the map visualization
      setTimeout(() => {
        window.dispatchEvent(new Event('mapRefresh'));
        
        // Direct access to map objects in window
        if ((window as any).leafletMap) {
          clearAllMapSvgElements((window as any).leafletMap);
        }
      }, 100);
      
      if (onClearAll) {
        onClearAll();
      }
      
      toast.success('All map data cleared');
    }
    
    // Reset the confirmation dialog state
    setShowConfirmation(false);
    
    // Final cleanup: safely remove all paths from any possible map containers (preserve red markers)
    setTimeout(() => {
      try {
        const paths = document.querySelectorAll('.leaflet-overlay-pane path');
        if (paths && paths.length > 0) {
          paths.forEach(path => {
            try {
              path.remove();
            } catch (e) {
              console.error('Error removing path:', e);
            }
          });
        }
        
        // Final preservation step for red markers and tooltips
        const allContainers = document.querySelectorAll('.leaflet-container');
        allContainers.forEach(container => {
          // Ensure red markers remain visible
          const redMarkers = container.querySelectorAll('img[src*="marker-icon-2x-red.png"]');
          redMarkers.forEach(marker => {
            (marker as HTMLElement).style.display = '';
            (marker as HTMLElement).style.visibility = 'visible';
          });
          
          // Ensure selected location tooltips remain visible
          const selectedTooltips = container.querySelectorAll('.selected-location-tooltip');
          selectedTooltips.forEach(tooltip => {
            (tooltip as HTMLElement).style.display = '';
            (tooltip as HTMLElement).style.visibility = 'visible';
          });
        });
      } catch (e) {
        console.error('Error in final path cleanup:', e);
      }
    }, 200);
    
  }, [onClearAll]);
  
  return {
    handleClearAllWrapper,
    showConfirmation,
    setShowConfirmation,
    confirmClearAll
  };
}
