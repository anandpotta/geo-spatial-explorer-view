import { useState, useRef, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { createMarkerPosition } from '@/utils/globe-utils';
import { useThreeGlobe } from '@/hooks/useThreeGlobe';
import { toast } from '@/components/ui/use-toast';

export function useGlobeNavigation(
  selectedLocation?: Location,
  isInitialized: boolean = false,
  onFlyComplete?: () => void
) {
  const [isFlying, setIsFlying] = useState(false);
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<string>('');
  const lastFlyLocationRef = useRef<string | null>(null);
  const flyCompletionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const initializationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigationAttemptsRef = useRef<number>(0);
  const maxNavigationAttempts = 5;
  
  // Create a dummy ref for useThreeGlobe since we're just accessing the global API
  const dummyContainerRef = useRef<HTMLDivElement>(null);

  // Safe fly completion handler that checks component mount state
  const handleFlyComplete = () => {
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
  };

  // Get the globe API - pass dummyContainerRef to satisfy the function signature
  const globeAPI = useThreeGlobe(dummyContainerRef);

  // Set up an initialization timer to retry initialization if needed
  useEffect(() => {
    console.log("ThreeGlobe: Setting up initialization check timer");
    
    initializationTimerRef.current = setTimeout(() => {
      if (globeAPI && !isFlying && selectedLocation) {
        console.log("ThreeGlobe: Initialization check - attempting navigation if needed");
        
        // Force attempt navigation after delay if globe is available but not marked as initialized
        const locationId = selectedLocation.id;
        if (locationId !== lastFlyLocationRef.current && globeAPI.flyToLocation) {
          console.log(`ThreeGlobe: Forced navigation attempt to ${selectedLocation.label}`);
          handleLocationNavigation(selectedLocation, globeAPI);
        }
      }
    }, 2000); // Wait 2 seconds before trying forced navigation
    
    return () => {
      if (initializationTimerRef.current !== null) {
        clearTimeout(initializationTimerRef.current);
      }
    };
  }, [selectedLocation, globeAPI, isFlying]);

  // Separate function to handle location navigation to avoid code duplication
  const handleLocationNavigation = (location: Location, api: any) => {
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
  };

  // Handle location changes
  useEffect(() => {
    if (!selectedLocation) {
      console.log("Globe navigation: No location selected");
      return;
    }
    
    if (!globeAPI) {
      console.log("Globe navigation: Globe API not available yet");
      return;
    }
    
    // If we're already flying to this location, don't start another flight
    const locationId = selectedLocation.id;
    if (locationId === lastFlyLocationRef.current && isFlying) {
      console.log(`ThreeGlobe: Already flying to ${selectedLocation.label}, skipping duplicate navigation`);
      return;
    }
    
    console.log(`ThreeGlobe: Received navigation request to ${selectedLocation.label}`, {
      globeAPIAvailable: !!globeAPI,
      isInitialized,
      globalInitialized: globeAPI?.isInitialized,
      hasFlightMethod: !!globeAPI?.flyToLocation
    });
    
    // Validate the coordinates first
    if (typeof selectedLocation.x !== 'number' || 
        typeof selectedLocation.y !== 'number' ||
        isNaN(selectedLocation.x) || 
        isNaN(selectedLocation.y)) {
      console.error("Invalid coordinates for location:", selectedLocation);
      toast({
        title: "Navigation Error",
        description: "Invalid coordinates provided",
        variant: "destructive"
      });
      return;
    }
    
    // Try to navigate - if the API looks ready
    if (isInitialized && globeAPI.flyToLocation) {
      console.log(`ThreeGlobe: Attempting to fly to ${selectedLocation.label}`);
      handleLocationNavigation(selectedLocation, globeAPI);
    } else {
      console.log("Globe API not fully ready or not initialized yet");
      
      // Set a retry timer for this specific location
      setTimeout(() => {
        if (isUnmountedRef.current) return;
        
        // Only retry if we haven't navigated to this location yet
        if (lastFlyLocationRef.current !== locationId && globeAPI && globeAPI.flyToLocation) {
          console.log(`ThreeGlobe: Retry navigation to ${selectedLocation.label}`);
          handleLocationNavigation(selectedLocation, globeAPI);
        }
      }, 1000);
    }
  }, [selectedLocation, globeAPI, isFlying, isInitialized]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      lastFlyLocationRef.current = null;
      navigationAttemptsRef.current = 0;
      
      if (flyCompletionTimerRef.current !== null) {
        clearTimeout(flyCompletionTimerRef.current);
      }
      
      if (initializationTimerRef.current !== null) {
        clearTimeout(initializationTimerRef.current);
      }
      
      // Ensure any ongoing flights are canceled
      if (globeAPI && globeAPI.cancelFlight) {
        globeAPI.cancelFlight();
      }
    };
  }, [globeAPI]);

  return {
    isFlying,
    selectedLocationLabel
  };
}
