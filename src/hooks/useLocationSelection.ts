
import { toast } from 'sonner';
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';
import { isMapValid } from '@/utils/leaflet-type-utils';

// Define interface for internal map properties not exposed in TypeScript definitions
interface LeafletMapInternal extends L.Map {
  _loaded?: boolean;
}

export function useLocationSelection(
  mapRef: React.MutableRefObject<L.Map | null>,
  isMapReady: boolean,
  onLocationSelect?: (location: Location) => void
) {
  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in useLocationSelection:", position);
    
    // Use utility function to validate map
    if (!mapRef.current || !isMapValid(mapRef.current) || !isMapReady) {
      console.warn("Map is not ready yet, cannot navigate");
      toast.error("Map is not fully loaded yet. Please try again in a moment.");
      
      // Try to recover with a delayed retry
      setTimeout(() => {
        if (mapRef.current && isMapValid(mapRef.current)) {
          try {
            console.log("Retrying location selection after delay");
            mapRef.current.invalidateSize(true);
            
            // Retry the fly operation after a short delay
            setTimeout(() => {
              if (mapRef.current && isMapValid(mapRef.current)) {
                mapRef.current.flyTo(position, 18, {
                  animate: true,
                  duration: 1.5
                });
                
                if (onLocationSelect) {
                  const location: Location = {
                    id: `loc-${position[0]}-${position[1]}`,
                    label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
                    x: position[1],
                    y: position[0]
                  };
                  onLocationSelect(location);
                }
              }
            }, 500);
          } catch (err) {
            console.error('Retry failed:', err);
          }
        }
      }, 1000);
      
      return;
    }
    
    try {
      // Enhanced check for map container validity
      if (!mapRef.current.getContainer()) {
        console.warn("Map container is not available, cannot navigate");
        toast.error("Map view is not available. Please refresh the page.");
        return;
      }
      
      // Check if the container is actually in the DOM
      if (!document.body.contains(mapRef.current.getContainer())) {
        console.warn("Map container is not in DOM, cannot navigate");
        toast.error("Map view is not currently visible. Please switch to map view first.");
        return;
      }
      
      // Additional check to ensure the map is properly initialized
      // Cast to internal map type to access private properties
      const internalMap = mapRef.current as LeafletMapInternal;
      if (!internalMap._loaded) {
        console.warn("Map is not fully loaded yet, cannot navigate");
        toast.error("Map is still initializing. Please try again in a moment.");
        return;
      }
      
      // Add a try-catch inside the actual fly operation
      try {
        mapRef.current.flyTo(position, 18, {
          animate: true,
          duration: 1.5
        });
        
        // If the fly operation succeeded, proceed with location selection
        if (onLocationSelect) {
          const location: Location = {
            id: `loc-${position[0]}-${position[1]}`,
            label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
            x: position[1],
            y: position[0]
          };
          onLocationSelect(location);
        }
      } catch (flyError) {
        console.error('Error during map navigation:', flyError);
        toast.error("Navigation failed. The map may be in an invalid state.");
        
        // Try to recover the map state
        setTimeout(() => {
          if (mapRef.current) {
            try {
              mapRef.current.invalidateSize(true);
            } catch (err) {
              // Ignore recovery errors
            }
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error handling location selection:', err);
      toast.error("Could not navigate to location. Please try again.");
    }
  };

  const handleClearAll = () => {
    if (mapRef.current && isMapReady) {
      try {
        // Cast to internal map type to access private properties
        const internalMap = mapRef.current as LeafletMapInternal;
        if (internalMap._loaded) {
          mapRef.current.invalidateSize();
        }
      } catch (err) {
        console.error('Error invalidating map size:', err);
      }
    }
  };

  return {
    handleLocationSelect,
    handleClearAll
  };
}
