
import { toast } from '@/components/ui/use-toast';
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';
import { useTimers } from './useTimers';

export function useLocationProcessing() {
  const { safeSetTimeout } = useTimers();

  function processLocationChange(
    map: L.Map,
    locationId: string, 
    location: Location,
    options: {
      onComplete?: () => void,
      isUnmountedRef: React.MutableRefObject<boolean>,
      flyInProgressRef: React.MutableRefObject<boolean>,
      transitionInProgressRef: React.MutableRefObject<boolean>,
      processedLocationRef: React.MutableRefObject<string | null>,
      setHasInitialPositioning: (value: boolean) => void
    }
  ) {
    if (options.isUnmountedRef.current || !map) return;
    
    // Set transition state
    options.transitionInProgressRef.current = true;
    
    // Update location reference and set fly in progress
    console.log(`useLocationProcessing: Flying to location ${location.label} at [${location.y}, ${location.x}]`);
    options.processedLocationRef.current = locationId;
    options.flyInProgressRef.current = true;

    try {
      // Force map invalidation to ensure proper rendering
      safeSetTimeout(() => {
        if (!map || options.isUnmountedRef.current) return;
        
        console.log("useLocationProcessing: Invalidating map size");
        map.invalidateSize(true);
        
        // Position the map at the selected location
        const newPosition: [number, number] = [location.y, location.x];
        
        // Use flyTo with animation for smoother experience
        map.flyTo(newPosition, 14, {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.5
        });
        
        // Add a marker after a short delay
        safeSetTimeout(() => {
          if (!map || options.isUnmountedRef.current) {
            options.flyInProgressRef.current = false;
            options.transitionInProgressRef.current = false;
            return;
          }

          try {
            // Clear existing markers to prevent cluttering
            map.eachLayer((layer) => {
              if (layer instanceof L.Marker) {
                map.removeLayer(layer);
              }
            });

            // Add a new marker at the precise location
            const marker = L.marker(newPosition).addTo(map);
            marker.bindPopup(
              `<b>${location.label || 'Selected Location'}</b><br>` +
              `${location.y.toFixed(6)}, ${location.x.toFixed(6)}`
            ).openPopup();
            
            // Reset the transition flags
            safeSetTimeout(() => {
              options.flyInProgressRef.current = false;
              options.transitionInProgressRef.current = false;
              if (!options.isUnmountedRef.current) {
                options.setHasInitialPositioning(true);
              }
            }, 300);
            
            if (!options.isUnmountedRef.current) {
              toast({
                title: "Location Found",
                description: `Navigated to ${location.label || 'coordinates'}: ${newPosition[0].toFixed(4)}, ${newPosition[1].toFixed(4)}`,
                duration: 3000,
              });
            }
          } catch (err) {
            console.error('Error adding location marker:', err);
            options.flyInProgressRef.current = false;
            options.transitionInProgressRef.current = false;
          }
        }, 500);
      }, 200);
    } catch (error) {
      console.error('Error flying to location in Leaflet:', error);
      options.flyInProgressRef.current = false;
      options.transitionInProgressRef.current = false;
      
      if (!options.isUnmountedRef.current) {
        toast({
          title: "Navigation Error",
          description: "Could not navigate to the selected location",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  }

  return { processLocationChange };
}
