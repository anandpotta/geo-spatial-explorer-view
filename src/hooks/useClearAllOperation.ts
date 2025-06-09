
import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';
import L from 'leaflet';

// Global state to track if a confirmation dialog is already showing
let isConfirmationDialogOpen = false;

export function useClearAllOperation(onClearAll?: () => void) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Update global state when local state changes
  useEffect(() => {
    isConfirmationDialogOpen = showConfirmation;
    return () => {
      if (showConfirmation) {
        isConfirmationDialogOpen = false;
      }
    };
  }, [showConfirmation]);
  
  // Helper function to preserve red markers more reliably
  const preserveRedMarkers = () => {
    const redMarkerData: Array<{
      element: HTMLElement;
      parent: Element;
    }> = [];
    
    const redTooltipData: Array<{
      element: HTMLElement;
      parent: Element;
    }> = [];
    
    // Collect red marker data - more specific selector
    const redMarkers = document.querySelectorAll('img[src*="marker-icon-2x-red.png"]');
    redMarkers.forEach(marker => {
      const markerElement = marker as HTMLElement;
      if (markerElement.parentElement) {
        redMarkerData.push({
          element: markerElement.cloneNode(true) as HTMLElement,
          parent: markerElement.parentElement
        });
      }
    });
    
    // Collect selected location tooltips - more specific to selected location
    const selectedTooltips = document.querySelectorAll('.selected-location-tooltip, .leaflet-tooltip:has(.selected-location-content)');
    selectedTooltips.forEach(tooltip => {
      const tooltipElement = tooltip as HTMLElement;
      if (tooltipElement.parentElement) {
        redTooltipData.push({
          element: tooltipElement.cloneNode(true) as HTMLElement,
          parent: tooltipElement.parentElement
        });
      }
    });
    
    return { redMarkerData, redTooltipData };
  };
  
  // Helper function to restore red markers
  const restoreRedMarkers = (redMarkerData: any[], redTooltipData: any[]) => {
    setTimeout(() => {
      try {
        // Restore red markers
        redMarkerData.forEach(({element, parent}) => {
          try {
            // Only restore if the parent still exists and doesn't already have this marker
            if (parent && parent.parentNode && !parent.querySelector('img[src*="marker-icon-2x-red.png"]')) {
              parent.appendChild(element);
            }
          } catch (e) {
            console.error('Error restoring red marker:', e);
          }
        });
        
        // Restore red marker tooltips
        redTooltipData.forEach(({element, parent}) => {
          try {
            // Only restore if the parent still exists and doesn't already have this tooltip
            if (parent && parent.parentNode && !parent.querySelector('.selected-location-tooltip')) {
              parent.appendChild(element);
            }
          } catch (e) {
            console.error('Error restoring red marker tooltip:', e);
          }
        });
        
        console.log('Red markers and tooltips restored after clear all operation');
      } catch (e) {
        console.error('Error in red marker restoration:', e);
      }
    }, 100);
  };
  
  // Listen for the custom leafletClearAllRequest event
  useEffect(() => {
    const handleLeafletClearRequest = () => {
      console.log('Received leaflet clear all request event');
      if (!isConfirmationDialogOpen) {
        setShowConfirmation(true);
      }
    };
    
    // Enhanced handler for Leaflet Draw specific clear all action
    const handleLeafletClearAction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if this is the clear all button in Leaflet draw actions
      if (target && target.tagName === 'A') {
        const isDrawActionsParent = 
          target.parentElement?.parentElement?.classList.contains('leaflet-draw-actions');
        
        const isClearAllButton = 
          target.textContent?.includes('Clear all') || 
          target.textContent?.includes('Delete') ||
          target.textContent?.trim() === 'Clear All';
        
        if (isDrawActionsParent && isClearAllButton) {
          console.log('Intercepting Leaflet draw clear all layers button - proceeding with clear');
          e.preventDefault();
          e.stopPropagation();
          
          if (!isConfirmationDialogOpen) {
            const preservedData = preserveRedMarkers();
            (window as any).preservedRedMarkers = preservedData;
            setShowConfirmation(true);
          }
          
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
  }, []);
  
  const handleClearAllWrapper = useCallback(() => {
    if (!isConfirmationDialogOpen) {
      const preservedData = preserveRedMarkers();
      (window as any).preservedRedMarkers = preservedData;
      setShowConfirmation(true);
    }
  }, []);
  
  const confirmClearAll = useCallback(() => {
    console.log('Confirming clear all operation');
    const featureGroup = window.featureGroup;
    
    // Get preserved red marker data
    const preservedData = (window as any).preservedRedMarkers || { redMarkerData: [], redTooltipData: [] };
    
    // Preserve selected location data before clearing
    const selectedLocation = localStorage.getItem('selectedLocation');
    
    // Clear all markers including temporary ones from DOM
    const allMarkers = document.querySelectorAll('.leaflet-marker-icon:not([src*="marker-icon-2x-red.png"])');
    allMarkers.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        console.error('Error removing marker:', e);
      }
    });
    
    // Clear all tooltips except selected location tooltips
    const allTooltips = document.querySelectorAll('.leaflet-tooltip:not(.selected-location-tooltip)');
    allTooltips.forEach(tooltip => {
      try {
        tooltip.remove();
      } catch (e) {
        console.error('Error removing tooltip:', e);
      }
    });
    
    // Clear all popups
    const allPopups = document.querySelectorAll('.leaflet-popup');
    allPopups.forEach(popup => {
      try {
        popup.remove();
      } catch (e) {
        console.error('Error removing popup:', e);
      }
    });
    
    // First ensure we clear all SVG paths from the DOM directly
    const mapContainers = document.querySelectorAll('.leaflet-container');
    if (mapContainers && mapContainers.length > 0) {
      mapContainers.forEach(container => {
        const leafletId = (container as any)._leaflet_id;
        if (leafletId && (L as any).maps) {
          const mapInstance = (L as any).maps[leafletId];
          if (mapInstance) {
            console.log('Found map instance, clearing SVG paths directly');
            clearAllMapSvgElements(mapInstance);
          }
        }
      });
    }
    
    // If featureGroup exists, also clear through it
    if (featureGroup && (featureGroup as any)._map) {
      clearAllMapSvgElements((featureGroup as any)._map);
      
      handleClearAll({
        featureGroup,
        onClearAll
      });
    } else {
      console.warn('Feature group not available for clear operation, using localStorage fallback');
      
      // Clear specific storages but preserve selected location
      localStorage.removeItem('savedDrawings');
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('floorPlans');
      localStorage.removeItem('svgPaths');
      
      // Restore selected location
      if (selectedLocation) {
        localStorage.setItem('selectedLocation', selectedLocation);
      }
      
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
    
    // Reset the confirmation dialog state
    setShowConfirmation(false);
    
    // Restore red markers after clearing operations
    restoreRedMarkers(preservedData.redMarkerData, preservedData.redTooltipData);
    
    // Ensure selected location is preserved
    if (selectedLocation) {
      setTimeout(() => {
        localStorage.setItem('selectedLocation', selectedLocation);
        window.dispatchEvent(new Event('storage'));
      }, 200);
    }
    
    // Clean up preserved data
    setTimeout(() => {
      delete (window as any).preservedRedMarkers;
    }, 500);
    
  }, [onClearAll]);
  
  return {
    handleClearAllWrapper,
    showConfirmation,
    setShowConfirmation,
    confirmClearAll
  };
}
