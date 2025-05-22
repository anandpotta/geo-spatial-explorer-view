
import React, { useRef, useEffect, useState } from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import NewMarkerForm from './NewMarkerForm';

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
  const [markerReady, setMarkerReady] = useState(false);

  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        try {
          // Safely close any open UI elements
          markerRef.current.closeTooltip();
          markerRef.current.closePopup();
        } catch (error) {
          console.error("Error cleaning up temp marker:", error);
        }
      }
    };
  }, []);

  // Update marker position in parent when dragged
  const handleDragEnd = (e: L.LeafletEvent) => {
    const marker = e.target;
    if (marker && marker.getLatLng) {
      const position = marker.getLatLng();
      // Update the position through the global handler if available
      if (window.tempMarkerPositionUpdate) {
        window.tempMarkerPositionUpdate([position.lat, position.lng]);
        console.log("Marker position updated:", [position.lat, position.lng]);
      }
    }
  };

  // Set up marker references
  const setMarkerInstance = (marker: L.Marker) => {
    if (marker) {
      markerRef.current = marker;
      setMarkerReady(true);
    }
  };

  return (
    <Marker
      position={position}
      ref={setMarkerInstance}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: () => {
          // Wait for marker to be added to DOM before showing popup
          setTimeout(() => {
            try {
              if (markerRef.current) {
                markerRef.current.openPopup();
              }
            } catch (error) {
              console.error("Error opening popup:", error);
            }
          }, 100);
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
      <Tooltip
        direction="top"
        offset={[0, -10]}
        opacity={0.9}
        permanent={true}
      >
        <span className="font-medium">{markerName || 'New Location'}</span>
      </Tooltip>
    </Marker>
  );
};

export default TempMarker;
