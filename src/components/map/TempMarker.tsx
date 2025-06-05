import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const [isVisible, setIsVisible] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  
  // Create a stable marker ID that doesn't change on every render
  const markerId = `temp-marker-${position[0].toFixed(6)}-${position[1].toFixed(6)}`;

  // Handle cleanup when component unmounts or marker is being processed
  useEffect(() => {
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
  }, [markerId]);

  // Update marker position in parent when dragged
  const handleDragEnd = useCallback((e: L.LeafletEvent) => {
    if (isProcessing) return;
    
    const marker = e.target;
    if (marker && marker.getLatLng) {
      const position = marker.getLatLng();
      if (window.tempMarkerPositionUpdate) {
        window.tempMarkerPositionUpdate([position.lat, position.lng]);
      }
    }
  }, [isProcessing]);
  
  // Custom save handler that keeps popup open during processing
  const handleSave = useCallback(() => {
    if (isProcessing) return;
    
    console.log('TempMarker: Save initiated');
    
    // Don't hide the marker immediately - let the parent handle the cleanup
    // Keep the popup open during save process
    onSave();
  }, [isProcessing, onSave]);

  // Set up marker references and auto-open popup
  const setMarkerInstance = useCallback((marker: L.Marker) => {
    if (marker && isVisible && !markerRef.current) {
      markerRef.current = marker;
      
      const element = marker.getElement();
      if (element) {
        element.setAttribute('data-marker-id', markerId);
      }
      
      // Auto-open popup after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (markerRef.current && isVisible && !popupOpen) {
          try {
            markerRef.current.openPopup();
            setPopupOpen(true);
          } catch (error) {
            console.error("Error opening popup:", error);
          }
        }
      }, 150);
    }
  }, [markerId, isVisible, popupOpen]);

  // Handle popup events
  const handlePopupOpen = useCallback(() => {
    setPopupOpen(true);
  }, []);

  const handlePopupClose = useCallback(() => {
    setPopupOpen(false);
  }, []);

  // Don't render if not visible or if being processed and popup is closed
  if (!isVisible || (isProcessing && !popupOpen)) {
    return null;
  }

  return (
    <Marker
      position={position}
      ref={setMarkerInstance}
      draggable={!isProcessing}
      eventHandlers={{
        dragend: handleDragEnd,
        popupopen: handlePopupOpen,
        popupclose: handlePopupClose
      }}
    >
      <Popup 
        closeOnClick={false}
        closeOnEscapeKey={false}
        autoClose={false}
        closeButton={!isProcessing}
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

export default React.memo(TempMarker);
