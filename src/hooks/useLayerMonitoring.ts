
import { useEffect, useState } from 'react';
import L from 'leaflet';

export function useLayerMonitoring(
  featureGroup: L.FeatureGroup | null,
  getPathElements: (() => SVGPathElement[]) | undefined,
  editControlRef: React.RefObject<any>
) {
  const [hasLayers, setHasLayers] = useState(false);

  // Function to check if there are any layers or SVG paths
  const checkForLayers = () => {
    if (!featureGroup) return false;
    
    // Check for layers in the feature group
    let layersFound = false;
    if (featureGroup.getLayers && featureGroup.getLayers().length > 0) {
      layersFound = true;
    }
    
    // Check for SVG paths in the DOM
    const pathElements = getPathElements?.();
    const svgPathsFound = pathElements && pathElements.length > 0;
    
    // Check for any drawn elements in the map
    const map = (featureGroup as any)._map;
    let drawnElementsFound = false;
    if (map) {
      const container = map.getContainer();
      if (container) {
        const paths = container.querySelectorAll('.leaflet-overlay-pane path');
        drawnElementsFound = paths.length > 0;
      }
    }
    
    return layersFound || svgPathsFound || drawnElementsFound;
  };

  // Effect to monitor layer changes and update edit control state
  useEffect(() => {
    const updateEditControlState = () => {
      const hasAnyLayers = checkForLayers();
      setHasLayers(hasAnyLayers);
      
      // Force update the edit control to refresh its state
      if (editControlRef.current && editControlRef.current._toolbars) {
        const editToolbar = editControlRef.current._toolbars.edit;
        const removeToolbar = editControlRef.current._toolbars.remove;
        
        if (editToolbar) {
          if (hasAnyLayers) {
            editToolbar.enable();
          } else {
            editToolbar.disable();
          }
        }
        
        if (removeToolbar) {
          if (hasAnyLayers) {
            removeToolbar.enable();
          } else {
            removeToolbar.disable();
          }
        }
      }
    };
    
    // Initial check
    updateEditControlState();
    
    // Set up periodic checking for layers
    const interval = setInterval(updateEditControlState, 1000);
    
    // Listen for various events that might change layer state
    const events = ['layeradd', 'layerremove', 'drawingCreated', 'drawingDeleted', 'storage', 'markersUpdated'];
    
    const handleLayerChange = () => {
      setTimeout(updateEditControlState, 100);
    };
    
    // Add event listeners to the map if available
    const map = (featureGroup as any)._map;
    if (map) {
      events.forEach(event => {
        if (event === 'storage' || event === 'markersUpdated' || event === 'drawingCreated' || event === 'drawingDeleted') {
          window.addEventListener(event, handleLayerChange);
        } else {
          map.on(event, handleLayerChange);
        }
      });
    }
    
    return () => {
      clearInterval(interval);
      if (map) {
        events.forEach(event => {
          if (event === 'storage' || event === 'markersUpdated' || event === 'drawingCreated' || event === 'drawingDeleted') {
            window.removeEventListener(event, handleLayerChange);
          } else {
            map.off(event, handleLayerChange);
          }
        });
      }
    };
  }, [featureGroup, getPathElements, editControlRef]);

  return { hasLayers };
}
