
import React, { useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import NewMarkerForm from './NewMarkerForm';
import L from 'leaflet';
import { isMapValid } from '@/utils/leaflet-type-utils';

interface TempMarkerProps {
  position: [number, number];
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
}

const TempMarker: React.FC<TempMarkerProps> = ({
  position,
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave
}) => {
  const markerRef = useRef<L.Marker | null>(null);
  const map = useMap();
  
  // Create a custom marker with higher z-index to ensure it's on top
  const markerOptions = {
    draggable: true,
    autoPan: true,
    zIndexOffset: 9999, // Higher z-index to ensure visibility
    eventHandlers: {
      dragend: (e: L.LeafletEvent) => {
        // Update marker position when dragged
        const marker = e.target;
        if (marker && marker.getLatLng) {
          const position = marker.getLatLng();
          // Update the position through the global handler
          if (window.tempMarkerPositionUpdate) {
            window.tempMarkerPositionUpdate([position.lat, position.lng]);
            console.log("Marker position updated:", [position.lat, position.lng]);
          }
        }
      }
    }
  };
  
  // Check if map is valid before opening popup
  useEffect(() => {
    if (markerRef.current && isMapValid(map)) {
      try {
        // Short delay to ensure DOM is ready
        const timer = setTimeout(() => {
          if (markerRef.current && isMapValid(map)) {
            markerRef.current.openPopup();
          }
        }, 100);
        
        return () => clearTimeout(timer);
      } catch (err) {
        console.error("Error opening popup:", err);
      }
    }
  }, [map, position]);
  
  if (!isMapValid(map)) {
    return null; // Don't render marker if map is invalid
  }
  
  return (
    <Marker 
      position={position} 
      {...markerOptions}
      ref={markerRef}
    >
      <NewMarkerForm
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={onSave}
      />
    </Marker>
  );
};

export default TempMarker;
