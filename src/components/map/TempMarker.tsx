
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
  // Track the current input value for real-time tooltip updates
  const [currentInputValue, setCurrentInputValue] = useState(markerName || 'New Location');
  const markerId = `temp-marker-${position[0]}-${position[1]}`;
  const initializedRef = useRef(false);

  // Initialize current input value only once when component mounts
  useEffect(() => {
    if (!initializedRef.current) {
      setCurrentInputValue(markerName || 'New Location');
      initializedRef.current = true;
    }
  }, []);

  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        try {
          // Safely close any open UI elements
          markerRef.current.closeTooltip();
          markerRef.current.closePopup();
          
          // Clean up any DOM elements
          const tempIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${markerId}"], .leaflet-marker-shadow[data-marker-id="${markerId}"]`);
          tempIcons.forEach(icon => {
            if (icon.parentNode) {
              icon.parentNode.removeChild(icon);
            }
          });
        } catch (error) {
          console.error("Error cleaning up temp marker:", error);
        }
      }
    };
  }, [markerId]);

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
  
  // Custom save handler to update tooltip only when saving
  const handleSave = () => {
    // Clean up the marker DOM elements before saving
    const tempIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${markerId}"], .leaflet-marker-shadow[data-marker-id="${markerId}"]`);
    tempIcons.forEach(icon => {
      if (icon.parentNode) {
        icon.parentNode.removeChild(icon);
      }
    });
    
    // Call the original save handler
    onSave();
  };

  // Handle real-time input updates for tooltip
  const handleInputUpdate = (value: string) => {
    setCurrentInputValue(value || 'New Location');
  };

  // Set up marker references
  const setMarkerInstance = (marker: L.Marker) => {
    if (marker) {
      markerRef.current = marker;
      
      // Add data attribute for easy identification
      const element = marker.getElement();
      if (element) {
        element.setAttribute('data-marker-id', markerId);
      }
      
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
        onSave={handleSave}
        onInputUpdate={handleInputUpdate}
      />
      <Tooltip
        direction="top"
        offset={[0, -10]}
        opacity={0.9}
        permanent={true}
        key={`tooltip-${currentInputValue}`}
      >
        <span className="font-medium">{currentInputValue}</span>
      </Tooltip>
    </Marker>
  );
};

export default TempMarker;
