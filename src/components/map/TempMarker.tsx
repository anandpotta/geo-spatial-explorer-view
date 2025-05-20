
import React, { useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import NewMarkerForm from './NewMarkerForm';
import L from 'leaflet';

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
  // Track if this marker has been initialized to prevent double creation
  const hasInitialized = useRef(false);
  const markerRef = useRef<L.Marker | null>(null);
  
  // Create a unique ID for this temporary marker based on position
  const tempMarkerId = `temp-marker-${position[0]}-${position[1]}`;
  
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
      },
      add: () => {
        // Only process the initialization once to prevent duplicates
        if (hasInitialized.current) return;
        hasInitialized.current = true;
        
        // Force popup to open when marker is added to the map
        setTimeout(() => {
          const markerElement = document.querySelector('.leaflet-marker-draggable');
          if (markerElement) {
            markerElement.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            }));
          }
        }, 100);
      }
    }
  };
  
  // Clean up marker when component unmounts
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.remove();
        } catch (error) {
          console.error('Error removing temp marker:', error);
        }
        markerRef.current = null;
      }
    };
  }, []);
  
  // Reset the initialization flag when position changes
  useEffect(() => {
    hasInitialized.current = false;
  }, [position]);
  
  return (
    <Marker 
      position={position} 
      {...markerOptions}
      key={tempMarkerId}
      ref={(ref) => {
        // In react-leaflet v4, we access the leaflet instance directly
        if (ref) {
          markerRef.current = ref;
        }
      }}
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
