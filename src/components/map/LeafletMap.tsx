import React, { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useMapEvents } from '@/hooks/useMapEvents';
import { useLocationSelection } from '@/hooks/useLocationSelection';
import { Location } from '@/utils/geo-utils';
import { isMapValid } from '@/utils/leaflet-type-utils';
import { toast } from 'sonner';
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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const forceTileRefreshRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ensure the map resizes properly when container changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current && isMapValid(mapRef.current)) {
        try {
          mapRef.current.invalidateSize(true);
          console.log("Map resized due to container change");
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
  
  // Add extra tile refresh logic to ensure tiles load properly
  useEffect(() => {
    // Only run this effect when the map is ready
    if (!mapRef.current || !isMapValid(mapRef.current)) return;
    
    const map = mapRef.current;
    
    // Force refresh tiles occasionally
    const refreshTiles = () => {
      try {
        if (map && isMapValid(map)) {
          console.log("Forcing tile refresh");
          
          // First invalidate the map size
          map.invalidateSize(true);
          
          // If there's an existing tile layer, remove and re-add it
          if (tileLayerRef.current) {
            const currentZoom = map.getZoom();
            const currentCenter = map.getCenter();
            
            map.removeLayer(tileLayerRef.current);
            
            // Create and add a new tile layer
            const newTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19
            }).addTo(map);
            
            tileLayerRef.current = newTileLayer;
            
            // Reset view to ensure tiles load properly
            setTimeout(() => {
              if (map && isMapValid(map)) {
                map.setView(currentCenter, currentZoom, { animate: false });
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error("Error during tile refresh:", error);
      }
    };
    
    // Initial tile refresh after map is ready
    const initialRefreshTimeout = setTimeout(refreshTiles, 500);
    
    // Periodic tile refreshes
    const periodicRefreshInterval = setInterval(refreshTiles, 5000);
    
    return () => {
      clearTimeout(initialRefreshTimeout);
      clearInterval(periodicRefreshInterval);
    };
  }, [mapRef.current, isMapReady]);
  
  // Enhanced map initialization with error handling
  const initMap = (element: HTMLElement) => {
    try {
      if (!element) return;
      
      // Prevent multiple initializations on the same element
      if (mapInitializedRef.current) {
        console.log("Map already initialized, skipping initialization");
        return;
      }
      
      mapInitializedRef.current = true;
      console.log("Initializing Leaflet map with preload =", preload);
      
      const map = L.map(element, {
        center: selectedLocation ? [selectedLocation.y, selectedLocation.x] : [0, 0],
        zoom: selectedLocation ? 16 : 2,
        zoomControl: false,
        attributionControl: true,
        minZoom: 1,
        maxZoom: 19,
        fadeAnimation: true,
        zoomAnimation: true,
        // Add rendering options to improve tile loading
        renderer: L.canvas(),
        preferCanvas: true
      });
      
      // Add tile layer with optimizations for initial loading
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        // Standard tile size for better quality
        tileSize: 256,
        zoomOffset: 0,
        className: 'map-tiles', // Add class for CSS targeting
        updateWhenIdle: false, // Update even when map is moving
        updateWhenZooming: false // Update during zoom operations
      });
      
      // Add the tile layer to the map with error handling
      try {
        tileLayer.addTo(map);
      } catch (err) {
        console.error("Error adding tile layer:", err);
        setMapError("Failed to load map tiles. Please try refreshing the page.");
      }
      
      // Set opacity explicitly to ensure visibility
      tileLayer.setOpacity(1.0);
      
      tileLayerRef.current = tileLayer;
      
      // Initialize feature group for drawing
      const featureGroup = new L.FeatureGroup();
      map.addLayer(featureGroup);
      window.featureGroup = featureGroup;
      
      // Store the map reference
      handleSetMapRef(map);
      
      // Force a map redraw after initialization
      setTimeout(() => {
        if (map && isMapValid(map)) {
          map.invalidateSize(true);
          // Add additional redraw to ensure tiles load
          setTimeout(() => {
            map.invalidateSize(true);
            // Trigger events to ensure all map components are properly initialized
            map.fire('load');
            map.fire('moveend');
          }, 200);
        }
      }, 100);
      
      // Listen for tile load events with type assertion to resolve type issues
      const typedTileLayer = tileLayer as L.TileLayer;
      typedTileLayer.on('load', () => {
        console.log('Tiles loaded successfully');
        setLoading(false);
        
        if (onMapReady && !isReadyRef.current) {
          isReadyRef.current = true;
          console.log('Calling onMapReady from LeafletMap after tiles loaded');
          onMapReady(map);
        }
      });
      
      // Listen for tile error events
      typedTileLayer.on('tileerror', (error) => {
        console.error('Tile loading error:', error);
      });
      
      // Force tile loading by triggering pan
      setTimeout(() => {
        try {
          const center = map.getCenter();
          map.panTo([center.lat + 0.0001, center.lng + 0.0001]);
          setTimeout(() => map.panTo(center), 100);
        } catch (err) {
          console.error("Error during map pan:", err);
        }
      }, 300);
      
      // Notify ready in case tile events don't fire (backup)
      setTimeout(() => {
        if (!isReadyRef.current && onMapReady) {
          isReadyRef.current = true;
          setLoading(false);
          console.log('Calling onMapReady from timeout backup');
          onMapReady(map);
          toast.success("Map loaded", { id: "map-loaded", duration: 2000 });
        }
      }, 1000);
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
      tileLayerRef.current = null;
      
      // Clear any refresh timers
      if (forceTileRefreshRef.current) {
        clearTimeout(forceTileRefreshRef.current);
        forceTileRefreshRef.current = null;
      }
      
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
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <h3 className="text-lg font-medium">Loading Map</h3>
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
