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
  onSave: (finalName?: string) => void;
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
  const [tooltipText, setTooltipText] = useState(markerName || 'New Location');
  const [tooltipKey, setTooltipKey] = useState(0);
  const markerId = `temp-marker-${position[0]}-${position[1]}`;

  // Only update tooltip text when marker name changes externally (not on every keystroke)
  useEffect(() => {
    // Only update if this is the initial load or an external change
    if (!markerName || markerName === tooltipText) return;
    
    const newTooltipText = markerName || 'New Location';
    setTooltipText(newTooltipText);
    setTooltipKey(prev => prev + 1);
  }, [markerName]);

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
  
  // Custom save handler to update tooltip and then save
  const handleSave = (finalName?: string) => {
    // Update tooltip with the final name
    const nameToUse = finalName || markerName || 'New Location';
    setTooltipText(nameToUse);
    setTooltipKey(prev => prev + 1);
    
    // Clean up the marker DOM elements before saving
    const tempIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${markerId}"], .leaflet-marker-shadow[data-marker-id="${markerId}"]`);
    tempIcons.forEach(icon => {
      if (icon.parentNode) {
        icon.parentNode.removeChild(icon);
      }
    });
    
    // Call the original save handler with the final name
    onSave(finalName);
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
      />
      <Tooltip
        key={`tooltip-${tooltipKey}`}
        direction="top"
        offset={[0, -10]}
        opacity={0.9}
        permanent={true}
      >
        <span className="font-medium">{tooltipText}</span>
      </Tooltip>
    </Marker>
  );
};

export default TempMarker;
