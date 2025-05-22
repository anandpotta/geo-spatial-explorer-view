
import { useState, useRef, useCallback } from 'react';
import { Location } from '@/utils/geo-utils';
import { toast } from '@/components/ui/use-toast';

export function useFlyHandler(onFlyComplete?: () => void) {
  const [isFlying, setIsFlying] = useState(false);
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<string | null>(null);
  const lastFlyLocationRef = useRef<string | null>(null);
  const flyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  
  // Function to fly to a specified location
  const flyToLocation = useCallback((
    location: Location, 
    globeAPI: any
  ) => {
    // Skip if already flying to this location
    if (isFlying && location.id === lastFlyLocationRef.current) {
      console.log(`Already flying to ${location.label}, skipping duplicate request`);
      return;
    }
    
    // Validate that the flyToLocation method exists on the API
    if (!globeAPI || typeof globeAPI.flyToLocation !== 'function') {
      console.error('Globe API missing flyToLocation method');
      return;
    }
    
    // Start flight
    setIsFlying(true);
    setSelectedLocationLabel(location.label);
    lastFlyLocationRef.current = location.id;
    
    console.log(`Flying to ${location.label} at coordinates [${location.y}, ${location.x}]`);
    
    try {
      // Call API method to fly to location
      globeAPI.flyToLocation(location.x, location.y, () => {
        if (isUnmountedRef.current) return;
        
        console.log(`Fly to ${location.label} completed`);
        
        // Clear flying state
        setIsFlying(false);
        setSelectedLocationLabel(null);
        
        // Call completion callback if provided
        if (onFlyComplete) {
          console.log("Calling onFlyComplete callback");
          onFlyComplete();
        }
        
        // Show toast notification
        toast({
          title: "Navigation Complete",
          description: `Arrived at ${location.label}`,
          duration: 3000
        });
      });
    } catch (err) {
      console.error("Error during flyToLocation:", err);
      setIsFlying(false);
      setSelectedLocationLabel(null);
    }
    
    // Add a safety timeout to avoid getting stuck in flying state
    if (flyTimeoutRef.current) {
      clearTimeout(flyTimeoutRef.current);
    }
    
    flyTimeoutRef.current = setTimeout(() => {
      if (isUnmountedRef.current) return;
      
      if (isFlying) {
        console.log("Fly timeout triggered - forcing completion");
        setIsFlying(false);
        setSelectedLocationLabel(null);
        
        if (onFlyComplete) {
          onFlyComplete();
        }
      }
    }, 8000); // 8 second safety timeout
  }, [isFlying, onFlyComplete]);

  const cleanup = useCallback(() => {
    isUnmountedRef.current = true;
    
    if (flyTimeoutRef.current) {
      clearTimeout(flyTimeoutRef.current);
      flyTimeoutRef.current = null;
    }
  }, []);

  return {
    isFlying,
    selectedLocationLabel,
    flyToLocation,
    lastFlyLocationRef,
    isUnmountedRef,
    cleanup
  };
}
