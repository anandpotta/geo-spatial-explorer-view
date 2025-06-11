import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { handleClearAll } from '@/components/map/drawing/ClearAllHandler';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';
import L from 'leaflet';

// Global state to track if a confirmation dialog is already showing
let isConfirmationDialogOpen = false;
let lastClearAllRequest = 0;
const CLEAR_ALL_DEBOUNCE_TIME = 1000; // 1 second debounce

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
  
  // Enhanced debouncing for clear all requests
  const handleClearAllRequest = useCallback(() => {
    const now = Date.now();
    
    // Debounce rapid clear all requests
    if (now - lastClearAllRequest < CLEAR_ALL_DEBOUNCE_TIME) {
      console.log('Clear all request debounced - too soon after last request');
      return;
    }
    
    lastClearAllRequest = now;
    
    console.log('Processing clear all request');
    if (!isConfirmationDialogOpen) {
      const preservedData = preserveRedMarkers();
      (window as any).preservedRedMarkers = preservedData;
      setShowConfirmation(true);
    }
  }, []);
  
  // Listen for the custom leafletClearAllRequest event
  useEffect(() => {
    const handleLeafletClearRequest = () => {
      console.log('Received leaflet clear all request event');
      handleClearAllRequest();
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
          
          handleClearAllRequest();
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
  }, [handleClearAllRequest]);
  
  const handleClearAllWrapper = useCallback(() => {
    handleClearAllRequest();
  }, [handleClearAllRequest]);
  
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
    setTimeout(() => {
      try {
        restoreRedMarkers(preservedData.redMarkerData, preservedData.redTooltipData);
        
        if (selectedLocation) {
          localStorage.setItem('selectedLocation', selectedLocation);
          window.dispatchEvent(new Event('storage'));
        }
        
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
