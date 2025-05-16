
import React, { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useMapEvents } from '@/hooks/useMapEvents';
import { useLocationSelection } from '@/hooks/useLocationSelection';
import { Location } from '@/utils/geo-utils';
import { isMapValid } from '@/utils/leaflet-type-utils';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

// Import our new components
import MapInitializer from './initialization/MapInitializer';
import TileLayer from './tiles/TileLayer';
import MapResizeHandler from './utilities/MapResizeHandler';
import TileRefresher from './tiles/TileRefresher';
import MapLoadingIndicator from './feedback/MapLoadingIndicator';
import MapErrorDisplay from './feedback/MapErrorDisplay';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
  onClearAll?: () => void;
  preload?: boolean;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  selectedLocation, 
  onMapReady,
  activeTool,
  onClearAll,
  preload = false
}) => {
  const { 
    mapRef, 
    mapInstanceKey, 
    isMapReady, 
    handleSetMapRef 
  } = useMapInitialization(selectedLocation);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const isReadyRef = useRef(false);
  
  // Handle map events for location selection
  useMapEvents(mapRef.current, selectedLocation);
  
  // Setup drawing tools on the map
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    
    try {
      // Setup drawing tools and options based on activeTool
      if (activeTool === 'draw-polygon' && mapRef.current) {
        console.log('Activating polygon drawing tool');
      } else if (activeTool === 'draw-marker' && mapRef.current) {
        console.log('Activating marker drawing tool');
      }
    } catch (err) {
      console.error("Error setting up drawing tools:", err);
    }
  }, [mapRef.current, isMapReady, activeTool]);
  
  // Handle location selection
  const { handleLocationSelect, handleClearAll: clearLocations } = useLocationSelection(
    mapRef,
    isMapReady,
    (location) => {
      console.log("Location selected:", location);
    }
  );
  
  // Enhanced map initialization with error handling
  const initMap = (element: HTMLElement) => {
    if (!element) return;
  };
  
  // Handle when the map is initialized
  const handleMapInitialized = (map: L.Map) => {
    handleSetMapRef(map);
  };
  
  // Handle when tiles are loaded
  const handleTilesLoaded = () => {
    setLoading(false);
    
    if (onMapReady && !isReadyRef.current) {
      isReadyRef.current = true;
      console.log('Calling onMapReady from LeafletMap after tiles loaded');
      if (mapRef.current) {
        onMapReady(mapRef.current);
      }
    }
  };
  
  // Backup ready notification in case tile events don't fire
  useEffect(() => {
    const backupTimeout = setTimeout(() => {
      if (!isReadyRef.current && onMapReady && mapRef.current) {
        isReadyRef.current = true;
        setLoading(false);
        console.log('Calling onMapReady from timeout backup');
        onMapReady(mapRef.current);
        toast.success("Map loaded", { id: "map-loaded", duration: 2000 });
      }
    }, 1000);
    
    return () => clearTimeout(backupTimeout);
  }, [onMapReady, mapRef]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      isReadyRef.current = false;
      
      // Clean up the map instance
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
        } catch (err) {
          console.log('Error during map cleanup:', err);
        }
      }
      
      if (onClearAll) onClearAll();
    };
  }, [mapRef, onClearAll]);

  return (
    <div 
      className="relative w-full h-full"
      ref={containerRef}
    >
      {/* Container for the Leaflet map */}
      <div
        className="absolute inset-0 bg-gray-100"
        key={mapInstanceKey}
        id="leaflet-map-container" 
        ref={(el) => {
          if (el && !mapRef.current) {
            // Initialize map when the container is available
            const element = el;
            if (element) {
              // Use the MapInitializer component via direct DOM reference
              // instead of as a React child to avoid leaflet initialization issues
              initMap(element);
            }
          }
        }}
      />
      
      {/* Conditionally render components based on map state */}
      {containerRef.current && !mapRef.current && (
        <MapInitializer 
          containerElement={containerRef.current.querySelector('#leaflet-map-container') as HTMLElement}
          selectedLocation={selectedLocation}
          onMapInitialized={handleMapInitialized}
        />
      )}
      
      {/* Add map utilities when map is available */}
      {mapRef.current && (
        <>
          <MapResizeHandler map={mapRef.current} containerRef={containerRef} />
          <TileLayer map={mapRef.current} onTilesLoaded={handleTilesLoaded} />
          <TileRefresher map={mapRef.current} isMapReady={isMapReady} />
        </>
      )}
      
      {/* Loading and error indicators */}
      <MapLoadingIndicator loading={loading} preload={preload} />
      <MapErrorDisplay error={mapError} />
    </div>
  );
};

export default LeafletMap;
