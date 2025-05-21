
import React, { useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useLocationSync } from '@/hooks/useLocationSync';
import MapView from './MapView';
import { getSavedMarkers, LocationMarker, createMarker } from '@/utils/marker-utils';
import { toast } from '@/components/ui/use-toast';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady: (map: any) => void;
  activeTool?: string | null;
  onClearAll?: () => void;
}

const LeafletMap = ({ 
  selectedLocation, 
  onMapReady,
  activeTool,
  onClearAll
}: LeafletMapProps) => {
  const { 
    mapRef,
    mapInstanceKey,
    isMapReady,
    handleSetMapRef
  } = useMapInitialization(selectedLocation);
  
  // Use our new useLocationSync hook to handle location changes
  useLocationSync(mapRef.current, selectedLocation, isMapReady);
  
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState<number>(2);
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState<string>("");
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('pin');
  
  // Load saved markers on component mount
  useEffect(() => {
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
  }, []);
  
  // When the map is ready, notify the parent component
  useEffect(() => {
    if (isMapReady && mapRef.current) {
      // Save map instance to window for positioning calculations
      (window as any).leafletMapInstance = mapRef.current;
      
      // Call the parent's onMapReady callback
      if (onMapReady) {
        onMapReady(mapRef.current);
      }
      
      // Dispatch a custom event to notify that the Leaflet map is ready
      const mapReadyEvent = new Event('leafletMapReady');
      window.dispatchEvent(mapReadyEvent);
      
      // Notify user once the map is ready
      toast({
        title: "Map Ready",
        description: "The map view is now loaded and ready to use",
        duration: 3000,
      });
      
      // Update position state if we have a selected location
      if (selectedLocation) {
        setPosition([selectedLocation.y, selectedLocation.x]);
        setZoom(14); 
      }
    }
  }, [isMapReady, mapRef, onMapReady, selectedLocation]);

  const handleMapClick = (latlng: any) => {
    setTempMarker([latlng.lat, latlng.lng]);
  };

  const handleLocationSelect = (position: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyTo(position, 14, {
        animate: true, 
        duration: 1
      });
    }
  };

  const handleDeleteMarker = (id: string) => {
    setMarkers(markers.filter(marker => marker.id !== id));
  };

  const handleSaveMarker = () => {
    if (!tempMarker) return;
    
    // Use the createMarker utility function instead of manually constructing the object
    // This ensures all required properties are included
    const newMarker = createMarker({
      id: `marker-${Date.now()}`,
      position: tempMarker,
      name: markerName || 'Unnamed Location',
      type: markerType
    });
    
    const updatedMarkers = [...markers, newMarker];
    setMarkers(updatedMarkers);
    
    // Store markers in localStorage
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    
    // Reset temporary marker state
    setTempMarker(null);
    setMarkerName('');
  };

  const handleShapeCreated = (shape: any) => {
    console.log('Shape created:', shape);
    // Handle shape creation logic
  };

  const handleRegionClick = (drawing: any) => {
    console.log('Region clicked:', drawing);
    // Handle region click logic
  };

  return (
    <div className="w-full h-full">
      <MapView 
        position={position}
        zoom={zoom}
        markers={markers}
        tempMarker={tempMarker}
        markerName={markerName}
        markerType={markerType}
        onMapReady={handleSetMapRef}
        onLocationSelect={handleLocationSelect}
        onMapClick={handleMapClick}
        onDeleteMarker={handleDeleteMarker}
        onSaveMarker={handleSaveMarker}
        setMarkerName={setMarkerName}
        setMarkerType={setMarkerType}
        onShapeCreated={handleShapeCreated}
        activeTool={activeTool}
        onRegionClick={handleRegionClick}
        onClearAll={onClearAll}
        isMapReady={isMapReady}
      />
    </div>
  );
};

export default LeafletMap;
