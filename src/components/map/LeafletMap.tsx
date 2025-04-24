
import { useRef, useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { setupLeafletIcons } from './LeafletMapIcons';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { toast } from 'sonner';
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
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  
  // Generate a truly unique container ID that won't be reused
  const mapContainerId = useRef<string>(`map-container-${mapInstanceKey}`);
  
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  // Set up icons and CSS on mount
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
    
    // Force recreation of container on key change
    return () => {
      // Clean up the old container to prevent reuse
      const oldContainer = document.getElementById(mapContainerId.current);
      if (oldContainer) {
        // We'll replace it with a fresh one
        const parent = oldContainer.parentElement;
        if (parent) {
          const newContainer = document.createElement('div');
          newContainer.id = mapContainerId.current;
          newContainer.style.width = '100%';
          newContainer.style.height = '100%';
          parent.replaceChild(newContainer, oldContainer);
        }
      }
    };
  }, [mapInstanceKey]);
  
  // Clean up map on unmount or key change
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        try {
          // First remove all layers and handlers to ensure proper cleanup
          mapRef.current.eachLayer(layer => {
            mapRef.current?.removeLayer(layer);
          });
          mapRef.current.remove();
          mapRef.current = null;
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
      }
    };
  }, [mapInstanceKey]);

  // Handle location changes
  useEffect(() => {
    if (selectedLocation && mapRef.current && isMapInitialized) {
      try {
        const lat = selectedLocation.y;
        const lng = selectedLocation.x;
        
        // Validate coordinates before flying
        if (isNaN(lat) || isNaN(lng)) {
          console.error('Invalid coordinates:', { lat, lng });
          toast.error('Invalid location coordinates');
          return;
        }
        
        console.log('Flying to location:', { lat, lng });
        
        // Only fly if coordinates are valid
        mapRef.current.flyTo([lat, lng], 18, {
          animate: true,
          duration: 1.5 // seconds
        });
      } catch (err) {
        console.error('Error flying to location:', err);
        // If there's an error, recreate the map
        setMapInstanceKey(Date.now());
        mapContainerId.current = `map-container-${Date.now()}`;
      }
    }
  }, [selectedLocation, isMapInitialized]);

  const handleSetMapRef = useCallback((map: L.Map) => {
    console.log('Map reference provided');
    
    // Store the map reference
    mapRef.current = map;
    
    // Force invalidate size to ensure proper rendering
    setTimeout(() => {
      if (mapRef.current && mapRef.current.getContainer()) {
        try {
          mapRef.current.invalidateSize(true);
          setIsMapInitialized(true);
          
          // Only fly to location if we have one and the map is ready
          if (selectedLocation) {
            const lat = selectedLocation.y;
            const lng = selectedLocation.x;
            
            // Validate coordinates before flying
            if (!isNaN(lat) && !isNaN(lng)) {
              console.log('Flying to initial location');
              mapRef.current.flyTo([lat, lng], 18, {
                animate: true,
                duration: 1.5
              });
            }
          }
          
          if (onMapReady) {
            onMapReady(map);
          }
        } catch (err) {
          console.error('Error initializing map:', err);
        }
      }
    }, 200);
  }, [selectedLocation, onMapReady]);

  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    
    if (!position || !Array.isArray(position) || position.length < 2) {
      console.error("Invalid position:", position);
      return;
    }
    
    const [lat, lng] = position;
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates:', { lat, lng });
      toast.error('Invalid location coordinates');
      return;
    }
    
    if (mapRef.current && isMapInitialized) {
      try {
        // Use flyTo with animation for smooth transition
        mapRef.current.flyTo(position, 18, {
          animate: true,
          duration: 1.5 // seconds
        });
        
        // If we have an onLocationSelect callback, create a Location object and pass it up
        if (onLocationSelect) {
          const location: Location = {
            id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
            label: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            x: lng,
            y: lat
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
    
    if (mapRef.current && isMapInitialized) {
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
      mapContainerId={mapContainerId.current}
    />
  );
};

export default LeafletMap;
