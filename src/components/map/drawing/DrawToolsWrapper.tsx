
import React, { ForwardedRef, useEffect, useRef } from 'react';
import DrawTools from '../DrawTools';
import L from 'leaflet';

interface DrawToolsWrapperProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

// Using forwardRef properly without trying to assign it to a FC type directly
const DrawToolsWrapper = React.forwardRef<any, DrawToolsWrapperProps>(({
  onCreated,
  activeTool,
  onClearAll,
  featureGroup
}, ref) => {
  // Need to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Check that the feature group is attached to a map
  useEffect(() => {
    // Verify the feature group is attached to a map on mount
    if (featureGroup) {
      const checkFeatureGroup = () => {
        if (!isMountedRef.current) return;
        
        // Check if the feature group has a map using type assertion to access protected property
        const featureGroupAny = featureGroup as any;
        if (!featureGroupAny._map) {
          console.warn("Feature group does not have a map attached");
        } else {
          console.log("Feature group has a valid map attached");
        }
      };
      
      // Initial check
      checkFeatureGroup();
      
      // Recheck after a delay to ensure map is fully initialized
      const timer = setTimeout(checkFeatureGroup, 500);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [featureGroup]);

  // Add listener to ensure all markers created by leaflet-draw are draggable
  useEffect(() => {
    const ensureMarkersAreDraggable = () => {
      // Find all marker elements that don't have the draggable class
      const markerElements = document.querySelectorAll('.leaflet-marker-icon:not(.leaflet-marker-draggable)');
      
      // Add draggable class to them
      markerElements.forEach(marker => {
        marker.classList.add('leaflet-marker-draggable');
      });
    };
    
    // Run once on mount
    ensureMarkersAreDraggable();
    
    // Add event listener for leaflet draw created
    document.addEventListener('leaflet:drawn', ensureMarkersAreDraggable);
    
    // Also apply to existing markers periodically to catch any we might miss
    const interval = setInterval(ensureMarkersAreDraggable, 1000);
    
    return () => {
      isMountedRef.current = false;
      document.removeEventListener('leaflet:drawn', ensureMarkersAreDraggable);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <DrawTools 
      ref={ref}
      onCreated={onCreated} 
      activeTool={activeTool} 
      onClearAll={onClearAll}
      featureGroup={featureGroup}
    />
  );
});

DrawToolsWrapper.displayName = 'DrawToolsWrapper';

export default DrawToolsWrapper;
