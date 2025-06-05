
import React, { useRef, useEffect, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import NewMarkerForm from './NewMarkerForm';
import './TempMarker.css';

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
  const popupRef = useRef<L.Popup | null>(null);
  const isOpeningRef = useRef(false);
  
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
  
  // Custom save handler
  const handleSave = useCallback(() => {
    if (isProcessing) {
      console.log('Save already in progress, ignoring duplicate call');
      return;
    }
    
    console.log('TempMarker: Save initiated');
    onSave();
  }, [isProcessing, onSave]);

  // Open popup with retry mechanism
  const openPopupWithRetry = useCallback((marker: L.Marker, attempt = 1) => {
    if (!marker || isOpeningRef.current) return;
    
    isOpeningRef.current = true;
    console.log(`TempMarker: Opening popup attempt ${attempt}`);
    
    try {
      const popup = marker.getPopup();
      if (!popup) {
        console.error('TempMarker: No popup found');
        isOpeningRef.current = false;
        return;
      }
      
      // Force open the popup
      marker.openPopup();
      
      // Check if it opened successfully after a delay
      setTimeout(() => {
        if (marker.isPopupOpen()) {
          console.log('TempMarker: Popup opened successfully');
          // Focus the input
          setTimeout(() => {
            const popupElement = popup.getElement();
            if (popupElement) {
              const input = popupElement.querySelector('input[type="text"]') as HTMLInputElement;
              if (input) {
                input.focus();
                console.log('TempMarker: Input focused');
              }
            }
          }, 100);
        } else if (attempt < 3) {
          console.log(`TempMarker: Popup not open, retry ${attempt + 1}`);
          setTimeout(() => openPopupWithRetry(marker, attempt + 1), 200);
        } else {
          console.error('TempMarker: Failed to open popup after 3 attempts');
        }
        isOpeningRef.current = false;
      }, 150);
      
    } catch (error) {
      console.error('TempMarker: Error opening popup:', error);
      isOpeningRef.current = false;
    }
  }, []);

  // Set up marker reference and auto-open popup
  const setMarkerInstance = useCallback((marker: L.Marker) => {
    if (marker && !markerRef.current) {
      markerRef.current = marker;
      console.log('TempMarker: Marker instance set');
      
      // Open popup after marker is fully ready
      setTimeout(() => {
        openPopupWithRetry(marker);
      }, 200);
    }
  }, [openPopupWithRetry]);

  const setPopupInstance = useCallback((popup: L.Popup) => {
    if (popup && !popupRef.current) {
      popupRef.current = popup;
      console.log('TempMarker: Popup instance set');
    }
  }, []);

  // Handle marker events
  const handleMarkerAdd = useCallback((e: L.LeafletEvent) => {
    console.log('TempMarker: Marker added to map');
    const marker = e.target as L.Marker;
    
    // Additional attempt to open popup when marker is added to map
    setTimeout(() => {
      if (!marker.isPopupOpen()) {
        openPopupWithRetry(marker);
      }
    }, 300);
  }, [openPopupWithRetry]);

  const handlePopupOpen = useCallback(() => {
    console.log('TempMarker: Popup opened successfully');
  }, []);

  const handlePopupClose = useCallback((e: L.PopupEvent) => {
    console.log('TempMarker: Popup close attempted');
    // Prevent popup from closing unless it's a save operation
    if (!isProcessing) {
      e.popup.openOn(e.target);
    }
  }, [isProcessing]);

  // Cleanup
  useEffect(() => {
    return () => {
      isOpeningRef.current = false;
      if (markerRef.current) {
        try {
          markerRef.current.closePopup();
        } catch (error) {
          console.error("Error cleaning up temp marker:", error);
        }
      }
    };
  }, []);

  return (
    <Marker
      position={position}
      ref={setMarkerInstance}
      draggable={!isProcessing}
      eventHandlers={{
        dragend: handleDragEnd,
        add: handleMarkerAdd,
        popupopen: handlePopupOpen,
        popupclose: handlePopupClose
      }}
    >
      <Popup 
        ref={setPopupInstance}
        closeOnClick={false}
        closeOnEscapeKey={false}
        autoClose={false}
        closeButton={false}
        autoPan={true}
        keepInView={true}
        className="temp-marker-popup"
        maxWidth={300}
        minWidth={250}
      >
        <div className="temp-marker-content">
          <NewMarkerForm
            markerName={markerName}
            setMarkerName={setMarkerName}
            markerType={markerType}
            setMarkerType={setMarkerType}
            onSave={handleSave}
            disabled={isProcessing}
          />
        </div>
      </Popup>
    </Marker>
  );
};

export default React.memo(TempMarker);
