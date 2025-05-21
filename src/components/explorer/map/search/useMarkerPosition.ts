
import { useState, useEffect, useRef } from 'react';
import { Location } from '@/utils/geo-utils';

interface MarkerPositionHookProps {
  selectedLocation: Location | null;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  flyCompleted: boolean;
}

export const useMarkerPosition = ({ 
  selectedLocation, 
  mapContainerRef, 
  flyCompleted 
}: MarkerPositionHookProps) => {
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const positionUpdateTimerRef = useRef<number | null>(null);
  const lastFlyCompleted = useRef<boolean>(flyCompleted);
  const initialLoadRef = useRef<boolean>(true);
  
  // Calculate the marker position based on the map type and selected location
  const calculateMarkerPosition = () => {
    const container = mapContainerRef.current;
    if (!container || !selectedLocation) return;
    
    // For 3D globe view (center of the screen for simplicity)
    const isCesium = container.getAttribute('data-map-type') === 'cesium';
    
    if (isCesium) {
      // Place in center for 3D view
      const rect = container.getBoundingClientRect();
      setMarkerPos({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    } else {
      // For Leaflet maps we can compute projected coordinates
      try {
        // Try to get Leaflet map instance
        const leafletMapInstance = (window as any).leafletMapInstance;
        
        if (leafletMapInstance && selectedLocation) {
          // Project lat/lng to pixel coordinates
          const point = leafletMapInstance.latLngToContainerPoint([
            selectedLocation.y,
            selectedLocation.x
          ]);
          
          setMarkerPos({
            x: point.x,
            y: point.y,
          });
          
          // Force marker visibility on initial load
          if (initialLoadRef.current) {
            // Add a visible marker to the map
            const markerOptions = {
              icon: L.divIcon({
                className: 'custom-map-marker',
                html: `<div class="marker-pin" style="background-color: #ea384c; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white;"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
            };
            
            try {
              // Check if marker already exists with this ID and remove it
              leafletMapInstance.eachLayer((layer: any) => {
                if (layer.options && layer.options.id === 'search-result-marker') {
                  leafletMapInstance.removeLayer(layer);
                }
              });
              
              // Add new marker
              const marker = L.marker([selectedLocation.y, selectedLocation.x], {
                ...markerOptions,
                id: 'search-result-marker'
              }).addTo(leafletMapInstance);
              
              // Add tooltip with location name
              marker.bindTooltip(selectedLocation.label, {
                permanent: true,
                direction: 'top',
                className: 'location-tooltip'
              }).openTooltip();
              
              console.log(`Added marker for: ${selectedLocation.label}`);
              
              // Create a style for the tooltip if it doesn't exist
              if (!document.getElementById('marker-tooltip-style')) {
                const style = document.createElement('style');
                style.id = 'marker-tooltip-style';
                style.innerHTML = `
                  .location-tooltip {
                    background-color: white;
                    border: none;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                    color: #333;
                    font-weight: bold;
                    padding: 4px 8px;
                  }
                  .custom-map-marker {
                    display: block !important;
                    z-index: 1000 !important;
                  }
                `;
                document.head.appendChild(style);
              }
            } catch (err) {
              console.error('Error adding marker to map:', err);
            }
            
            initialLoadRef.current = false;
          }
        } else {
          // Fallback to center if we can't get the map instance
          const rect = container.getBoundingClientRect();
          setMarkerPos({
            x: rect.width / 2,
            y: rect.height / 2,
          });
        }
      } catch (err) {
        console.error('Error calculating marker position:', err);
        // Fallback to center
        const rect = container.getBoundingClientRect();
        setMarkerPos({
          x: rect.width / 2,
          y: rect.height / 2,
        });
      }
    }
  };

  // Handle fly completion changes
  useEffect(() => {
    // When fly is completed, recalculate the marker position
    if (flyCompleted && !lastFlyCompleted.current && selectedLocation) {
      console.log("Fly completed, recalculating marker position");
      // Give the map a moment to settle before recalculating position
      setTimeout(() => calculateMarkerPosition(), 500);
    }
    
    lastFlyCompleted.current = flyCompleted;
  }, [flyCompleted, selectedLocation]);
  
  // Update position when the location changes or during map movements
  useEffect(() => {
    if (!selectedLocation || !mapContainerRef.current) return;
    
    // Calculate initial position
    calculateMarkerPosition();
    
    // Function to schedule position updates with debounce
    const schedulePositionUpdate = () => {
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
      }
      positionUpdateTimerRef.current = window.setTimeout(() => {
        calculateMarkerPosition();
        positionUpdateTimerRef.current = null;
      }, 200);
    };
    
    // Save the function so we can reference it in the useEffect cleanup
    const handleMapMove = schedulePositionUpdate;
    
    // Add event listeners for map movements and resizing
    window.addEventListener('mapMove', handleMapMove);
    window.addEventListener('resize', handleMapMove);
    
    // Recalculate position periodically while showing tag (for transitions)
    const intervalId = setInterval(() => {
      if (!flyCompleted) {
        calculateMarkerPosition();
      }
    }, 500);
    
    return () => {
      window.removeEventListener('mapMove', handleMapMove);
      window.removeEventListener('resize', handleMapMove);
      clearInterval(intervalId);
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
        positionUpdateTimerRef.current = null;
      }
    };
  }, [selectedLocation, flyCompleted]);
  
  return { markerPos, calculateMarkerPosition };
};
