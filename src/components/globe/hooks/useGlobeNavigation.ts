
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
  const flyCompletionTimerRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);

  // Safe fly completion handler that checks component mount state
  const handleFlyComplete = () => {
    if (isUnmountedRef.current) return;
    
    console.log("ThreeGlobe: Fly animation complete, notifying parent");
    setIsFlying(false);
    
    // Cancel any pending completion timer
    if (flyCompletionTimerRef.current !== null) {
      clearTimeout(flyCompletionTimerRef.current);
    }
    
    // Set a small delay to ensure animation is fully complete
    flyCompletionTimerRef.current = window.setTimeout(() => {
      if (isUnmountedRef.current) return;
      
      if (onFlyComplete) {
        console.log("ThreeGlobe: Calling onFlyComplete callback with slight delay");
        onFlyComplete();
      }
      flyCompletionTimerRef.current = null;
    }, 200);
  };

  // Get the globe API
  const globeAPI = useThreeGlobe();

  // Handle location changes
  useEffect(() => {
    if (!selectedLocation || !globeAPI.isInitialized || !isInitialized) return;
    
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
    
    // Prevent duplicate fly operations for the same location
    const locationId = selectedLocation.id;
    if (locationId === lastFlyLocationRef.current && isFlying) {
      console.log("ThreeGlobe: Skipping duplicate location selection:", locationId);
      return;
    }
    
    console.log(`ThreeGlobe: Flying to location: ${selectedLocation.label} at coordinates [${selectedLocation.x}, ${selectedLocation.y}]`);
    setIsFlying(true);
    setSelectedLocationLabel(selectedLocation.label);
    lastFlyLocationRef.current = locationId;
    
    // Show a toast to inform the user about navigation
    toast({
      title: "Navigating to location",
      description: `Flying to ${selectedLocation.label}`,
      duration: 3000
    });
    
    // Clear any previous markers first
    if (globeAPI.clearMarkers) {
      globeAPI.clearMarkers();
      console.log("Cleared all markers from the globe");
    }
    
    // Calculate marker position 
    const markerPosition = createMarkerPosition(selectedLocation, 1.01); // Slightly above globe surface
    
    // Fly to the location - Y is latitude, X is longitude
    globeAPI.flyToLocation(selectedLocation.x, selectedLocation.y, handleFlyComplete);
    console.log(`EnhancedFlyToLocation: Flying to ${selectedLocation.y}, ${selectedLocation.x}`);
    
    // Add marker after a slight delay
    setTimeout(() => {
      if (!isUnmountedRef.current && globeAPI.addMarker) {
        console.log(`Adding marker for ${selectedLocation.label}`);
        globeAPI.addMarker(selectedLocation.id, markerPosition, selectedLocation.label);
      }
    }, 300);
  }, [selectedLocation, globeAPI, isFlying, isInitialized, globeAPI.isInitialized]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      lastFlyLocationRef.current = null;
      
      if (flyCompletionTimerRef.current !== null) {
        clearTimeout(flyCompletionTimerRef.current);
      }
      
      // Ensure any ongoing flights are canceled
      if (globeAPI.cancelFlight) {
        globeAPI.cancelFlight();
      }
    };
  }, [globeAPI]);

  return {
    isFlying,
    selectedLocationLabel
  };
}
