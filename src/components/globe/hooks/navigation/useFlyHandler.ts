
import { useState, useRef, useCallback } from 'react';
import { Location } from '@/utils/geo-utils';
import { createMarkerPosition } from '@/utils/globe-utils';
import { toast } from '@/components/ui/use-toast';

/**
 * Custom hook to handle flying to a location on the globe
 */
export function useFlyHandler(
  onFlyComplete?: () => void
) {
  const [isFlying, setIsFlying] = useState(false);
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<string>('');
  const lastFlyLocationRef = useRef<string | null>(null);
  const flyCompletionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const navigationAttemptsRef = useRef<number>(0);
  const maxNavigationAttempts = 5;

  // Safe fly completion handler that checks component mount state
  const handleFlyComplete = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    console.log("ThreeGlobe: Fly animation complete, notifying parent");
    setIsFlying(false);
    
    // Reset navigation attempts on successful completion
    navigationAttemptsRef.current = 0;
    
    // Cancel any pending completion timer
    if (flyCompletionTimerRef.current !== null) {
      clearTimeout(flyCompletionTimerRef.current);
    }
    
    // Set a small delay to ensure animation is fully complete
    flyCompletionTimerRef.current = setTimeout(() => {
      if (isUnmountedRef.current) return;
      
      if (onFlyComplete) {
        console.log("ThreeGlobe: Calling onFlyComplete callback with slight delay");
        onFlyComplete();
      }
      flyCompletionTimerRef.current = null;
    }, 200);
  }, [onFlyComplete]);

  // Navigate to a location
  const flyToLocation = useCallback((location: Location, api: any): boolean => {
    if (!location || !api || !api.flyToLocation) {
      console.log("Cannot navigate: missing location or globe API");
      return false;
    }
    
    // Increment navigation attempts
    navigationAttemptsRef.current++;
    
    // Check if we've tried too many times
    if (navigationAttemptsRef.current > maxNavigationAttempts) {
      console.log(`Exceeded max navigation attempts (${maxNavigationAttempts}) for ${location.label}`);
      toast({
        title: "Navigation Aborted",
        description: "Too many navigation attempts, please try again later",
        variant: "destructive"
      });
      return false;
    }
    
    setIsFlying(true);
    setSelectedLocationLabel(location.label);
    lastFlyLocationRef.current = location.id;
    
    // Show a toast to inform the user about navigation
    toast({
      title: "Navigating to location",
      description: `Flying to ${location.label}`,
      duration: 3000
    });
    
    // Clear any previous markers first
    if (api.clearMarkers) {
      api.clearMarkers();
      console.log("Cleared all markers from the globe");
    }
    
    // Calculate marker position 
    const markerPosition = createMarkerPosition(location, 1.01); // Slightly above globe surface
    
    // Fly to the location - Y is latitude, X is longitude
    console.log(`EnhancedFlyToLocation: Flying to coordinates [${location.y}, ${location.x}]`);
    
    // Make the actual call to fly to location
    api.flyToLocation(location.x, location.y, handleFlyComplete);
    
    // Add marker after a slight delay
    setTimeout(() => {
      if (!isUnmountedRef.current && api.addMarker) {
        console.log(`Adding marker for ${location.label}`);
        api.addMarker(location.id, markerPosition, location.label);
      }
    }, 300);
    
    return true;
  }, [handleFlyComplete]);

  // Clean up function for component unmount
  const cleanup = useCallback(() => {
    isUnmountedRef.current = true;
    lastFlyLocationRef.current = null;
    navigationAttemptsRef.current = 0;
    
    if (flyCompletionTimerRef.current !== null) {
      clearTimeout(flyCompletionTimerRef.current);
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
