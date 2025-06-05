
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

  // Improved popup opening with better timing
  const openPopupSafely = useCallback((marker: L.Marker) => {
    if (!marker || isOpeningRef.current) return;
    
    isOpeningRef.current = true;
    console.log('TempMarker: Opening popup safely');
    
    try {
      // Ensure popup exists
      const popup = marker.getPopup();
      if (!popup) {
        console.error('TempMarker: No popup found');
        isOpeningRef.current = false;
        return;
      }
      
      // Close any existing popups first
      marker.closePopup();
      
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        try {
          marker.openPopup();
          
          // Check if popup opened and focus input
          setTimeout(() => {
            if (marker.isPopupOpen()) {
              console.log('TempMarker: Popup opened successfully');
              const popupElement = popup.getElement();
              if (popupElement) {
                const input = popupElement.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) {
                  input.focus();
                  input.select();
                  console.log('TempMarker: Input focused and selected');
                }
              }
            } else {
              console.log('TempMarker: Popup failed to open, retrying...');
              setTimeout(() => marker.openPopup(), 100);
            }
            isOpeningRef.current = false;
          }, 100);
          
        } catch (error) {
          console.error('TempMarker: Error in requestAnimationFrame:', error);
          isOpeningRef.current = false;
        }
      });
      
    } catch (error) {
      console.error('TempMarker: Error opening popup safely:', error);
      isOpeningRef.current = false;
    }
  }, []);

  // Set up marker reference and auto-open popup
  const setMarkerInstance = useCallback((marker: L.Marker) => {
    if (marker && !markerRef.current) {
      markerRef.current = marker;
      console.log('TempMarker: Marker instance set');
      
      // Open popup after marker is ready
      setTimeout(() => {
        openPopupSafely(marker);
      }, 250);
    }
  }, [openPopupSafely]);

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
    
    // Ensure popup opens when marker is added to map
    setTimeout(() => {
      if (!marker.isPopupOpen()) {
        openPopupSafely(marker);
      }
    }, 300);
  }, [openPopupSafely]);

  const handlePopupOpen = useCallback(() => {
    console.log('TempMarker: Popup opened event fired');
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
