
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
  isProcessing?: boolean;
}

const TempMarker: React.FC<TempMarkerProps> = ({
  position,
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave,
  isProcessing = false
}) => {
  const markerRef = useRef<L.Marker | null>(null);
  const [markerReady, setMarkerReady] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  const markerId = `temp-marker-${position[0]}-${position[1]}`;

  // Handle cleanup when component unmounts or marker is being processed
  useEffect(() => {
    if (isProcessing) {
      setIsVisible(false);
    }
    
    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.closeTooltip();
          markerRef.current.closePopup();
          
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
  }, [markerId, isProcessing]);

  // Auto-open popup when marker is ready
  useEffect(() => {
    if (markerRef.current && markerReady && !popupOpen && !isProcessing) {
      setTimeout(() => {
        try {
          if (markerRef.current && isVisible) {
            markerRef.current.openPopup();
            setPopupOpen(true);
            console.log('Popup opened for temp marker');
          }
        } catch (error) {
          console.error("Error opening popup:", error);
        }
      }, 200);
    }
  }, [markerReady, popupOpen, isProcessing, isVisible]);

  // Update marker position in parent when dragged
  const handleDragEnd = (e: L.LeafletEvent) => {
    if (isProcessing) return;
    
    const marker = e.target;
    if (marker && marker.getLatLng) {
      const position = marker.getLatLng();
      if (window.tempMarkerPositionUpdate) {
        window.tempMarkerPositionUpdate([position.lat, position.lng]);
      }
    }
  };
  
  // Custom save handler with processing state
  const handleSave = () => {
    if (isProcessing) return;
    
    // Hide the marker immediately to prevent flickering
    setIsVisible(false);
    
    // Clean up DOM elements
    const tempIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${markerId}"], .leaflet-marker-shadow[data-marker-id="${markerId}"]`);
    tempIcons.forEach(icon => {
      if (icon.parentNode) {
        icon.parentNode.removeChild(icon);
      }
    });
    
    // Call the save handler
    onSave();
  };

  // Set up marker references
  const setMarkerInstance = (marker: L.Marker) => {
    if (marker && isVisible) {
      markerRef.current = marker;
      
      const element = marker.getElement();
      if (element) {
        element.setAttribute('data-marker-id', markerId);
      }
      
      setMarkerReady(true);
    }
  };

  // Don't render if not visible or processing
  if (!isVisible || isProcessing) {
    return null;
  }

  return (
    <Marker
      position={position}
      ref={setMarkerInstance}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: () => {
          console.log('Temp marker added to map');
          setMarkerReady(true);
        },
        popupopen: () => {
          console.log('Popup opened');
          setPopupOpen(true);
        },
        popupclose: () => {
          console.log('Popup closed');
          setPopupOpen(false);
        }
      }}
    >
      <Popup 
        closeOnClick={false} 
        autoClose={false}
        closeButton={false}
        autoPan={true}
      >
        <NewMarkerForm
          markerName={markerName}
          setMarkerName={setMarkerName}
          markerType={markerType}
          setMarkerType={setMarkerType}
          onSave={handleSave}
          disabled={isProcessing}
        />
      </Popup>
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
