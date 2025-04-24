
import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { setupLeafletIcons } from './LeafletMapIcons';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const loadedMarkersRef = useRef(false);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [mapInitialized, setMapInitialized] = useState(false);
  
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  // Set up Leaflet icons and CSS
  useEffect(() => {
    setupLeafletIcons();
    
    // Ensure leaflet CSS is loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    // Clean up on component unmount
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        try {
          if (mapRef.current && mapRef.current.remove) {
            try {
              // Check if the container still exists before removal
              const container = mapRef.current.getContainer();
              if (container && document.body.contains(container)) {
                mapRef.current.remove();
              }
            } catch (e) {
              console.log('Map already removed or container not available');
            }
          }
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        mapRef.current = null;
      }
    };
  }, [mapInstanceKey]);

  // Handle flying to selected location
  useEffect(() => {
    if (selectedLocation && mapRef.current && mapInitialized) {
      try {
        // Make sure the map is valid before attempting to fly to a location
        if (mapRef.current.getContainer() && document.body.contains(mapRef.current.getContainer())) {
          console.log('Flying to location:', [selectedLocation.y, selectedLocation.x]);
          mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
            animate: true,
            duration: 1
          });
        }
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  }, [selectedLocation, mapInitialized]);

  const handleSetMapRef = (map: L.Map) => {
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    console.log('Setting map reference');
    mapRef.current = map;
    
    // Mark the map as initialized
    setMapInitialized(true);
    
    if (onMapReady) {
      onMapReady(map);
    }
    
    // Ensure the map is fully initialized with proper delays
    setTimeout(() => {
      try {
        if (!mapRef.current) return;
        
        // First invalidate size to ensure proper rendering
        mapRef.current.invalidateSize(true);
        
        // Then try to fly to location if provided
        if (selectedLocation && mapRef.current.getContainer() && 
            document.body.contains(mapRef.current.getContainer())) {
          console.log('Flying to initial location after initialization');
          mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
            animate: true,
            duration: 1.5
          });
        }
      } catch (err) {
        console.error('Error flying to location after map ready:', err);
      }
    }, 1000); // Increased delay for more reliable initialization
  };

  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    if (!mapRef.current || !mapInitialized) return;
    
    try {
      // Check if map is valid and container exists
      if (mapRef.current.getContainer() && document.body.contains(mapRef.current.getContainer())) {
        mapRef.current.flyTo(position, 18, {
          duration: 2
        });
      }
    } catch (err) {
      console.error('Error flying to selected location:', err);
    }
  };

  const handleClearAll = () => {
    console.log("Handling clear all in LeafletMap");
    
    // Reset all map state
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    // Force map to refresh with safer approach
    try {
      if (mapRef.current && mapRef.current.getContainer() && 
          document.body.contains(mapRef.current.getContainer())) {
        console.log('Invalidating map size safely');
        mapRef.current.invalidateSize({ animate: false, pan: false });
      }
    } catch (err) {
      console.error('Error invalidating map size:', err);
    }
    
    // Force reload the map instance to clear all layers
    setTimeout(() => {
      setMapInstanceKey(Date.now());
    }, 300);
  };

  if (mapState.showFloorPlan) {
    return (
      <FloorPlanView 
        onBack={() => mapState.setShowFloorPlan(false)} 
        drawing={mapState.selectedDrawing}
      />
    );
  }

  return (
    <MapView
      key={`map-view-${mapInstanceKey}`}
      position={mapState.position}
      zoom={mapState.zoom}
      markers={mapState.markers}
      tempMarker={mapState.tempMarker}
      markerName={mapState.markerName}
      markerType={mapState.markerType}
      onMapReady={handleSetMapRef}
      onLocationSelect={handleLocationSelect}
      onMapClick={handleMapClick}
      onDeleteMarker={mapState.handleDeleteMarker}
      onSaveMarker={mapState.handleSaveMarker}
      setMarkerName={mapState.setMarkerName}
      setMarkerType={mapState.setMarkerType}
      onShapeCreated={handleShapeCreated}
      activeTool={activeTool || null}
      onRegionClick={mapState.handleRegionClick}
      onClearAll={handleClearAll}
    />
  );
};

export default LeafletMap;
