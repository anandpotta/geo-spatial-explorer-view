
import React, { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useMapEvents } from '@/hooks/useMapEvents';
import { useLocationSelection } from '@/hooks/useLocationSelection';
import { Location } from '@/utils/geo-utils';
import { isMapValid } from '@/utils/leaflet-type-utils';
import 'leaflet/dist/leaflet.css';

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
  const mapInitializedRef = useRef(false);
  
  // Ensure the map resizes properly when container changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        try {
          mapRef.current.invalidateSize();
        } catch (err) {
          console.error("Error resizing map:", err);
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [mapRef]);
  
  // Handle map events for location selection
  useMapEvents(mapRef.current, selectedLocation);
  
  // Setup drawing tools on the map
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    
    try {
      // Setup drawing tools and options
      if (activeTool === 'draw-polygon' && mapRef.current) {
        // Drawing logic here
        console.log('Activating polygon drawing tool');
      } else if (activeTool === 'draw-marker' && mapRef.current) {
        // Marker drawing logic here
        console.log('Activating marker drawing tool');
      } else {
        // Clear any existing drawings
        console.log('No tool active, clearing drawings');
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
      // You can perform additional actions here when a location is selected
    }
  );
  
  // Enhanced map initialization
  const initMap = (element: HTMLElement) => {
    try {
      if (!element) return;
      
      // Prevent multiple initializations on the same element
      if (mapInitializedRef.current) {
        console.log("Map already initialized, skipping initialization");
        return;
      }
      
      // Check if element already has a map instance
      if (element._leaflet_id) {
        console.log("Element already has a map instance, skipping initialization");
        return;
      }
      
      mapInitializedRef.current = true;
      
      const map = L.map(element, {
        center: [0, 0],
        zoom: 2,
        zoomControl: false,
        attributionControl: true,
        minZoom: 1,
        maxZoom: 18
      });
      
      // Add tile layer with less intensive loading during preload
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
        // If preloading, use lower quality tiles initially
        tileSize: preload ? 512 : 256,
        zoomOffset: preload ? -1 : 0
      }).addTo(map);
      
      // Initialize feature group for drawing
      const featureGroup = new L.FeatureGroup();
      map.addLayer(featureGroup);
      window.featureGroup = featureGroup;
      
      // Add draw control
      handleSetMapRef(map);
      
      // Notify that map is ready
      setLoading(false);
      
      // Trigger onMapReady callback only once
      if (!isReadyRef.current) {
        isReadyRef.current = true;
        if (onMapReady) onMapReady(map);
      }
      
      // Safely check if map is still valid before final invalidation
      const invalidateMapSafely = () => {
        if (map && isMapValid(map)) {
          try {
            map.invalidateSize(true);
            console.log('Final map invalidation completed');
          } catch (err) {
            console.log('Map container removed before final invalidation');
          }
        }
      };
      
      // Final map invalidation for proper sizing with delay to ensure DOM is ready
      setTimeout(invalidateMapSafely, 500);
    } catch (err) {
      console.error("Map initialization error:", err);
      setMapError(`Failed to initialize map: ${err.message}`);
      mapInitializedRef.current = false;
    }
  };
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      isReadyRef.current = false;
      mapInitializedRef.current = false;
      
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
          if (el && !mapRef.current) initMap(el);
        }}
      />
      
      {/* Loading indicator - only show if not preloading in background */}
      {loading && !preload && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold">Loading Map</h3>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {mapError && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Map Error</h3>
            <p className="text-gray-700">{mapError}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
