
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
  onLocationSelect?: (location: Location) => void;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool, onLocationSelect }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<string>(`map-container-${Date.now()}`);
  const loadedMarkersRef = useRef(false);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  useEffect(() => {
    setupLeafletIcons();
    
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        try {
          mapRef.current.remove();
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        mapRef.current = null;
      }
    };
  }, [mapInstanceKey]);

  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      try {
        // Only try to fly if the map is properly initialized
        mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
          animate: true,
          duration: 1.5 // seconds
        });
      } catch (err) {
        console.error('Error flying to location:', err);
        // If there's an error, recreate the map
        setMapInstanceKey(Date.now());
      }
    }
  }, [selectedLocation]);

  const handleSetMapRef = (map: L.Map) => {
    console.log('Map reference provided');
    
    if (mapRef.current) {
      console.warn('Map reference already exists, cleaning up old instance first');
      try {
        mapRef.current.remove();
      } catch (err) {
        console.error('Error removing old map:', err);
      }
    }
    
    try {
      // Store the map reference
      mapRef.current = map;
      
      // Force invalidate size to ensure proper rendering
      setTimeout(() => {
        if (map && !map._container._leaflet_id) {
          map.invalidateSize(true);
          
          // Only fly to location if we have one and the map is ready
          if (selectedLocation) {
            console.log('Flying to initial location');
            map.flyTo([selectedLocation.y, selectedLocation.x], 18, {
              animate: true,
              duration: 1.5
            });
          }
          
          if (onMapReady) {
            onMapReady(map);
          }
        }
      }, 200);
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  };

  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    if (mapRef.current) {
      try {
        // Use flyTo with animation for smooth transition
        mapRef.current.flyTo(position, 18, {
          animate: true,
          duration: 1.5 // seconds
        });
        
        // If we have an onLocationSelect callback, create a Location object and pass it up
        if (onLocationSelect) {
          const location: Location = {
            id: `loc-${position[0]}-${position[1]}`,
            label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
            x: position[1],
            y: position[0]
          };
          onLocationSelect(location);
        }
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  };

  const handleClearAll = () => {
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    if (mapRef.current) {
      try {
        mapRef.current.invalidateSize();
      } catch (err) {
        console.error('Error invalidating map size:', err);
      }
    }
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
      activeTool={activeTool || mapState.activeTool}
      onRegionClick={mapState.handleRegionClick}
      onClearAll={handleClearAll}
      mapContainerId={mapContainerRef.current}
    />
  );
};

export default LeafletMap;
