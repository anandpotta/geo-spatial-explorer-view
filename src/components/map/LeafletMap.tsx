
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
  const onMapReadyCalledRef = useRef(false);
  const mapReadyRetryCountRef = useRef(0);
  const maxMapReadyRetries = 5;
  
  // Ensure the map resizes properly when container changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current && isMapValid(mapRef.current)) {
        try {
          mapRef.current.invalidateSize();
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
            try {
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
                  try {
                    // Check if map panes are initialized before setting view
                    if (map.getPane('mapPane') && (map.getPane('mapPane') as any)._leaflet_pos) {
                      map.setView(currentCenter, currentZoom, { animate: false });
                    } else {
                      console.log('Map panes not ready for setView');
                    }
                  } catch (e) {
                    console.error('Error in setView:', e);
                  }
                }
              }, 100);
            } catch (e) {
              console.error('Error refreshing tiles:', e);
            }
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
  
  // Monitor map readiness and call onMapReady callback
  useEffect(() => {
    const triggerMapReady = () => {
      if (!mapRef.current || onMapReadyCalledRef.current) {
        return;
      }
      
      try {
        // Check if map is valid before calling onMapReady
        if (isMapValid(mapRef.current)) {
          console.log('Map is valid, calling onMapReady');
          
          // Mark as ready
          onMapReadyCalledRef.current = true;
          
          // Call onMapReady callback
          if (onMapReady) {
            setTimeout(() => {
              if (mapRef.current && isMapValid(mapRef.current)) {
                console.log('Calling onMapReady from LeafletMap');
                onMapReady(mapRef.current);
              }
            }, 100);
          }
        } else {
          // If map is not valid yet and we haven't exceeded max retries, try again
          if (mapReadyRetryCountRef.current < maxMapReadyRetries) {
            mapReadyRetryCountRef.current++;
            console.log(`Map not valid yet, retry ${mapReadyRetryCountRef.current}/${maxMapReadyRetries}`);
            
            // Try to invalidate the map size
            if (mapRef.current) {
              try {
                // Fix for the TypeScript error - check map type before calling invalidateSize
                if ('invalidateSize' in mapRef.current) {
                  mapRef.current.invalidateSize(true);
                } else {
                  console.warn('invalidateSize method not available on map object');
                }
              } catch (e) {
                console.warn('Error invalidating map size:', e);
              }
            }
            
            // Try again after a delay
            setTimeout(triggerMapReady, 500);
          } else {
            console.warn('Max map ready retries reached');
          }
        }
      } catch (err) {
        console.error('Error checking map validity:', err);
      }
    };
    
    // Start monitoring map readiness when map ref changes
    if (mapRef.current && !onMapReadyCalledRef.current) {
      mapReadyRetryCountRef.current = 0;
      setTimeout(triggerMapReady, 300);
    }
    
    return () => {
      // Reset when component unmounts or map ref changes
      mapReadyRetryCountRef.current = 0;
    };
  }, [mapRef.current, onMapReady]);
  
  // Force tile refreshes periodically when preloaded to ensure they load properly
  useEffect(() => {
    // Clear any existing refresh timer
    if (forceTileRefreshRef.current) {
      clearTimeout(forceTileRefreshRef.current);
      forceTileRefreshRef.current = null;
    }
    
    // When in preload mode, force refresh tiles occasionally
    if (mapRef.current && preload) {
      forceTileRefreshRef.current = setTimeout(() => {
        if (mapRef.current && isMapValid(mapRef.current)) {
          console.log("Forcing tile refresh for preloaded map");
          mapRef.current.invalidateSize(true);
        }
      }, 1000); // Shorter timeout for faster loading
    }
    
    return () => {
      if (forceTileRefreshRef.current) {
        clearTimeout(forceTileRefreshRef.current);
      }
    };
  }, [preload, mapRef.current]);
  
  // Enhanced map initialization with error handling
  const initMap = (element: HTMLElement) => {
    try {
      if (!element) return;
      
      // Prevent multiple initializations on the same element
      if (mapInitializedRef.current) {
        console.log("Map already initialized, skipping initialization");
        return;
      }
      
      // Check if element already has a map instance
      const leafletId = (element as HTMLElement & { _leaflet_id?: number })._leaflet_id;
      if (leafletId) {
        console.log("Element already has a map instance, skipping initialization");
        return;
      }
      
      mapInitializedRef.current = true;
      console.log("Initializing Leaflet map with preload =", preload);
      
      // Create map without trying to center or zoom yet
      const map = L.map(element, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 1,
        maxZoom: 19,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true
      });
      
      // Set initial view after map creation
      try {
        if (selectedLocation) {
          map.setView([selectedLocation.y, selectedLocation.x], 16);
        } else {
          map.setView([0, 0], 2);
        }
      } catch (e) {
        console.warn('Error setting initial view:', e);
        // Default fallback
        try {
          map.setView([0, 0], 2);
        } catch (e2) {
          console.error('Error setting fallback view:', e2);
        }
      }
      
      // Add tile layer with optimizations for initial loading
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        // Standard tile size for better quality
        tileSize: 256,
        zoomOffset: 0
      }).addTo(map);
      
      tileLayerRef.current = tileLayer;
      
      // Initialize feature group for drawing
      const featureGroup = new L.FeatureGroup();
      map.addLayer(featureGroup);
      window.featureGroup = featureGroup;
      
      // Store the map reference
      handleSetMapRef(map);
      
      // Reset flags
      onMapReadyCalledRef.current = false;
      
      // Force a map redraw after initialization
      setTimeout(() => {
        if (map && isMapValid(map)) {
          map.invalidateSize(true);
          // Add additional redraw to ensure tiles load
          setTimeout(() => map.invalidateSize(true), 200);
        }
      }, 100);
      
      // Notify that map is ready sooner
      setLoading(false);
      
      // Additional invalidate after initialization
      if (map && isMapValid(map)) {
        map.invalidateSize(true);
      }
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
      onMapReadyCalledRef.current = false;
      
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
