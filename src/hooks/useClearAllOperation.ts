
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
  
  // Helper function to preserve red markers more reliably
  const preserveRedMarkers = () => {
    const redMarkerData: Array<{
      src: string;
      style: string;
      className: string;
      parentHTML: string;
      position: { left: string; top: string; transform: string };
    }> = [];
    
    const redTooltipData: Array<{
      innerHTML: string;
      className: string;
      style: string;
      position: { left: string; top: string; transform: string };
    }> = [];
    
    // Collect red marker data
    const redMarkers = document.querySelectorAll('img[src*="marker-icon-2x-red.png"]');
    redMarkers.forEach(marker => {
      const markerElement = marker as HTMLElement;
      const computedStyle = window.getComputedStyle(markerElement);
      
      redMarkerData.push({
        src: (marker as HTMLImageElement).src,
        style: markerElement.getAttribute('style') || '',
        className: markerElement.className,
        parentHTML: markerElement.parentElement?.outerHTML || '',
        position: {
          left: computedStyle.left,
          top: computedStyle.top,
          transform: computedStyle.transform
        }
      });
    });
    
    // Collect red marker tooltip data
    const selectedTooltips = document.querySelectorAll('.selected-location-tooltip');
    selectedTooltips.forEach(tooltip => {
      const tooltipElement = tooltip as HTMLElement;
      const computedStyle = window.getComputedStyle(tooltipElement);
      
      redTooltipData.push({
        innerHTML: tooltipElement.innerHTML,
        className: tooltipElement.className,
        style: tooltipElement.getAttribute('style') || '',
        position: {
          left: computedStyle.left,
          top: computedStyle.top,
          transform: computedStyle.transform
        }
      });
    });
    
    return { redMarkerData, redTooltipData };
  };
  
  // Helper function to restore red markers
  const restoreRedMarkers = (redMarkerData: any[], redTooltipData: any[]) => {
    // Find the marker pane
    const markerPanes = document.querySelectorAll('.leaflet-marker-pane');
    const tooltipPanes = document.querySelectorAll('.leaflet-tooltip-pane');
    
    // Restore red markers
    if (markerPanes.length > 0 && redMarkerData.length > 0) {
      const markerPane = markerPanes[0] as HTMLElement;
      
      redMarkerData.forEach(data => {
        const img = document.createElement('img');
        img.src = data.src;
        img.className = data.className;
        img.setAttribute('style', data.style);
        
        // Create a wrapper div if needed
        const wrapper = document.createElement('div');
        wrapper.className = 'leaflet-marker-icon leaflet-zoom-animated leaflet-interactive';
        wrapper.appendChild(img);
        
        markerPane.appendChild(wrapper);
      });
    }
    
    // Restore red marker tooltips
    if (tooltipPanes.length > 0 && redTooltipData.length > 0) {
      const tooltipPane = tooltipPanes[0] as HTMLElement;
      
      redTooltipData.forEach(data => {
        const tooltip = document.createElement('div');
        tooltip.className = data.className;
        tooltip.innerHTML = data.innerHTML;
        tooltip.setAttribute('style', data.style);
        
        tooltipPane.appendChild(tooltip);
      });
    }
  };
  
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
          console.log('Intercepting Leaflet draw clear all layers button');
          e.preventDefault();
          e.stopPropagation();
          
          if (isAuthenticated) {
            if (!isConfirmationDialogOpen) {
              // Preserve red markers before showing confirmation
              const preservedData = preserveRedMarkers();
              
              // Store preserved data temporarily
              (window as any).preservedRedMarkers = preservedData;
              
              setShowConfirmation(true);
            }
          } else {
            toast.error('Please log in to clear drawings');
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
  }, [isAuthenticated]);
  
  const handleClearAllWrapper = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to clear drawings');
      return;
    }
    
    // Only show dialog if no other dialog is currently open
    if (!isConfirmationDialogOpen) {
      // Preserve red markers before showing confirmation
      const preservedData = preserveRedMarkers();
      (window as any).preservedRedMarkers = preservedData;
      
      setShowConfirmation(true);
    }
  }, [isAuthenticated]);
  
  const confirmClearAll = useCallback(() => {
    console.log('Confirming clear all operation');
    const featureGroup = window.featureGroup;
    
    // Get preserved red marker data
    const preservedData = (window as any).preservedRedMarkers || { redMarkerData: [], redTooltipData: [] };
    
    // Preserve selected location data before clearing
    const selectedLocation = localStorage.getItem('selectedLocation');
    
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
      // Fallback if featureGroup is not available
      console.warn('Feature group not available for clear operation, using localStorage fallback');
      
      // Preserve authentication data and selected location
      const authState = localStorage.getItem('geospatial_auth_state');
      const users = localStorage.getItem('geospatial_users');
      
      // Clear specific storages
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
      
      if (onClearAll) {
        onClearAll();
      }
      
      toast.success('All map data cleared');
    }
    
    // Reset the confirmation dialog state
    setShowConfirmation(false);
    
    // Restore red markers after clearing operations
    setTimeout(() => {
      try {
        restoreRedMarkers(preservedData.redMarkerData, preservedData.redTooltipData);
        
        // Also restore selected location if it exists
        if (selectedLocation) {
          localStorage.setItem('selectedLocation', selectedLocation);
          // Trigger location marker restoration
          window.dispatchEvent(new Event('storage'));
        }
        
        // Clean up temporary data
        delete (window as any).preservedRedMarkers;
        
        console.log('Red markers restored after clear all operation');
      } catch (e) {
        console.error('Error restoring red markers:', e);
      }
    }, 300);
    
  }, [onClearAll]);
  
  return {
    handleClearAllWrapper,
    showConfirmation,
    setShowConfirmation,
    confirmClearAll
  };
}
