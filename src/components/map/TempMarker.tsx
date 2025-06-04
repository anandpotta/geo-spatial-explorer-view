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
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const markerId = `temp-marker-${position[0]}-${position[1]}`;

  // Handle cleanup when component unmounts or marker is being processed
  useEffect(() => {
    if (isProcessing) {
      setIsPopupOpen(false);
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

  // Force popup to open when marker is ready and keep it open
  useEffect(() => {
    if (markerRef.current && !isProcessing) {
      const timer = setTimeout(() => {
        try {
          if (markerRef.current) {
            markerRef.current.openPopup();
            console.log('Popup opened for temp marker at position:', position);
          }
        } catch (error) {
          console.error("Error opening popup:", error);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [position, isProcessing]);

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

  // Set up marker references and force popup open
  const setMarkerInstance = (marker: L.Marker) => {
    if (marker) {
      markerRef.current = marker;
      
      const element = marker.getElement();
      if (element) {
        element.setAttribute('data-marker-id', markerId);
      }
      
      // Multiple attempts to ensure popup opens
      setTimeout(() => {
        if (marker) {
          marker.openPopup();
          console.log('Forcing popup open immediately');
        }
      }, 100);
      
      setTimeout(() => {
        if (marker) {
          marker.openPopup();
          console.log('Forcing popup open again');
        }
      }, 300);
    }
  };

  // Don't render if processing
  if (isProcessing) {
    return null;
  }

  return (
    <Marker
      position={position}
      ref={setMarkerInstance}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: (e) => {
          console.log('Temp marker added to map at:', position);
          const marker = e.target;
          // Force popup to open when marker is added to map
          setTimeout(() => {
            if (marker) {
              marker.openPopup();
              console.log('Popup opened on marker add event');
            }
          }, 150);
        },
        popupopen: () => {
          console.log('Popup opened event fired');
        },
        popupclose: (e) => {
          console.log('Popup close event fired - preventing close for temp marker');
          // Immediately reopen the popup for temp markers
          setTimeout(() => {
            if (markerRef.current && !isProcessing) {
              markerRef.current.openPopup();
            }
          }, 50);
        }
      }}
    >
      <Popup 
        closeOnClick={false} 
        autoClose={false}
        closeButton={false}
        autoPan={true}
        className="marker-popup"
        maxWidth={300}
        minWidth={250}
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
        permanent={false}
      >
        <span className="font-medium">{markerName || 'New Location'}</span>
      </Tooltip>
    </Marker>
  );
};

export default TempMarker;
