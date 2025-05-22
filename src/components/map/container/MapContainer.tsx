
import React, { useEffect, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, AttributionControl, useMap } from 'react-leaflet';
import { safeInvalidateSize, forceMapTileRefresh } from '@/utils/leaflet-type-utils';
// Import CSS directly from node_modules
import 'leaflet/dist/leaflet.css';

// Helper component to handle map initialization and tile refreshes
const MapInitializer = () => {
  const map = useMap();
  const refreshAttemptsRef = useRef(0);
  const maxRefreshAttempts = 10; // Increased from 8
  
  useEffect(() => {
    if (!map) return;
    
    // Handle initial setup
    const handleInitialSetup = () => {
      safeInvalidateSize(map);
      
      // Set up more frequent tile refreshes
      const refreshIntervals = [100, 300, 600, 900, 1200, 2000, 3000, 4000]; // ms - Added more intervals and reduced initial delay
      
      refreshIntervals.forEach((delay) => {
        setTimeout(() => {
          if (refreshAttemptsRef.current < maxRefreshAttempts) {
            refreshAttemptsRef.current++;
            console.log(`Refreshing map tiles (attempt ${refreshAttemptsRef.current})`);
            
            // Try to ensure the map pane has _leaflet_pos before refreshing
            try {
              const mapPane = map.getPane('mapPane');
              if (mapPane && !(mapPane as any)._leaflet_pos) {
                console.log('Creating _leaflet_pos for mapPane');
                (mapPane as any)._leaflet_pos = { x: 0, y: 0 };
              }
              
              // Also check for _panes.mapPane property
              if ((map as any)._panes && (map as any)._panes.mapPane && !(map as any)._panes.mapPane._leaflet_pos) {
                console.log('Creating _leaflet_pos for _panes.mapPane');
                (map as any)._panes.mapPane._leaflet_pos = { x: 0, y: 0 };
              }
            } catch (e) {
              console.warn('Error accessing map pane:', e);
            }
            
            // Force more aggressive tile refresh
            forceMapTileRefresh(map);
            
            // Also manually redraw tile layers
            map.eachLayer(layer => {
              if ((layer as any).redraw) {
                try {
                  (layer as any).redraw();
                } catch (e) {
                  console.warn('Error redrawing layer:', e);
                }
              }
            });
            
            // Fire moveend event to trigger tile loading
            map.fire('moveend');
          }
        }, delay);
      });
    };
    
    handleInitialSetup();
    
    // Add a final check and refresh after all intervals
    setTimeout(() => {
      if (map && refreshAttemptsRef.current >= maxRefreshAttempts) {
        console.log('Final map refresh attempt');
        forceMapTileRefresh(map);
        map.fire('moveend');
      }
    }, 5000); // Increased from 4000ms
    
    // Add event listener for custom refresh events
    const handleCustomRefresh = () => {
      console.log('Handling leaflet-refresh-needed event');
      if (map) {
        safeInvalidateSize(map);
        forceMapTileRefresh(map);
        
        // Fire events to trigger tile loading
        map.fire('move');
        map.fire('moveend');
        map.fire('zoomend');
      }
    };
    
    document.addEventListener('leaflet-refresh-needed', handleCustomRefresh);
    
    return () => {
      refreshAttemptsRef.current = maxRefreshAttempts; // Stop any pending refreshes
      document.removeEventListener('leaflet-refresh-needed', handleCustomRefresh);
    };
  }, [map]);
  
  return null;
};

interface MapContainerProps {
  position: [number, number];
  zoom: number;
  mapKey: string;
  children: React.ReactNode;
}

const MapContainer: React.FC<MapContainerProps> = ({ position, zoom, mapKey, children }) => {
  // Reference to access the container directly
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle direct DOM manipulations if needed
  useEffect(() => {
    // Force redraw of container to ensure proper rendering
    const container = mapContainerRef.current;
    if (container) {
      // Force a reflow to ensure container is properly sized
      const display = container.style.display;
      container.style.display = 'none';
      // Force reflow
      void container.offsetHeight;
      container.style.display = display;
    }
    
    // Dispatch custom event after short delay to ensure map is ready
    const timer = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('leaflet-refresh-needed'));
    }, 100);
    
    return () => clearTimeout(timer);
  }, [mapKey]);
  
  return (
    <div ref={mapContainerRef} className="w-full h-full">
      <LeafletMapContainer 
        key={mapKey}
        className="w-full h-full"
        attributionControl={false}
        center={position}
        zoom={zoom}
        zoomControl={false}
        fadeAnimation={true}
        markerZoomAnimation={true}
        preferCanvas={true}
        // Add important props to ensure proper rendering
        whenCreated={(mapInstance) => {
          console.log('Map instance created');
          // Manually check for _leaflet_pos
          const mapPane = mapInstance.getPane('mapPane');
          if (mapPane && !(mapPane as any)._leaflet_pos) {
            (mapPane as any)._leaflet_pos = { x: 0, y: 0 };
          }
        }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          maxZoom={19}
          subdomains={['a', 'b', 'c']}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          className="leaflet-tile-pane"
          // Add key to force reload of tiles
          key={`tiles-${mapKey}`}
        />
        <AttributionControl position="bottomright" prefix={false} />
        <MapInitializer />
        
        {children}
      </LeafletMapContainer>
    </div>
  );
};

export default MapContainer;
