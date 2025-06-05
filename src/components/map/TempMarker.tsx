
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
  const hasOpenedRef = useRef(false);
  
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
  
  // Enhanced save handler that prevents popup closing
  const handleSave = useCallback(() => {
    if (isProcessing) {
      console.log('TempMarker: Save already in progress, ignoring duplicate call');
      return;
    }
    
    console.log('TempMarker: Save initiated, preventing popup close');
    
    // Temporarily disable popup closing during save
    if (popupRef.current) {
      const popup = popupRef.current;
      const originalCloseOnClick = popup.options.closeOnClick;
      const originalCloseOnEscapeKey = popup.options.closeOnEscapeKey;
      
      popup.options.closeOnClick = false;
      popup.options.closeOnEscapeKey = false;
      
      // Restore options after save completes
      setTimeout(() => {
        popup.options.closeOnClick = originalCloseOnClick;
        popup.options.closeOnEscapeKey = originalCloseOnEscapeKey;
      }, 3000);
    }
    
    onSave();
  }, [isProcessing, onSave]);

  // Open popup when marker is ready
  const openPopupSafely = useCallback(() => {
    if (hasOpenedRef.current || !markerRef.current) {
      return;
    }
    
    console.log('TempMarker: Opening popup safely');
    hasOpenedRef.current = true;
    
    try {
      // Ensure popup is attached before opening
      setTimeout(() => {
        if (markerRef.current && !markerRef.current.isPopupOpen()) {
          markerRef.current.openPopup();
          
          // Focus the input after popup opens
          setTimeout(() => {
            const popupElement = markerRef.current?.getPopup()?.getElement();
            if (popupElement) {
              const input = popupElement.querySelector('input[type="text"]') as HTMLInputElement;
              if (input) {
                input.focus();
                input.select();
              }
            }
          }, 100);
        }
      }, 200);
    } catch (error) {
      console.error('TempMarker: Error opening popup:', error);
    }
  }, []);

  // Set up marker reference and open popup
  const setMarkerInstance = useCallback((marker: L.Marker) => {
    if (marker && !markerRef.current) {
      markerRef.current = marker;
      console.log('TempMarker: Marker instance set');
      
      // Open popup after marker is fully ready
      setTimeout(() => openPopupSafely(), 300);
    }
  }, [openPopupSafely]);

  // Set up popup reference
  const setPopupInstance = useCallback((popup: L.Popup) => {
    if (popup) {
      popupRef.current = popup;
      console.log('TempMarker: Popup instance set');
    }
  }, []);

  // Handle popup events
  const handlePopupOpen = useCallback(() => {
    console.log('TempMarker: Popup opened event fired');
  }, []);

  // Prevent popup from closing during processing or initially
  const handlePopupClose = useCallback((e: L.PopupEvent) => {
    if (isProcessing) {
      console.log('TempMarker: Preventing popup close during processing');
      e.preventDefault?.();
      
      // Reopen popup after a brief delay
      setTimeout(() => {
        if (markerRef.current && !markerRef.current.isPopupOpen()) {
          try {
            markerRef.current.openPopup();
          } catch (error) {
            console.error('TempMarker: Error reopening popup:', error);
          }
        }
      }, 50);
    } else {
      console.log('TempMarker: Allowing popup to close');
    }
  }, [isProcessing]);

  // Reset when position changes
  useEffect(() => {
    hasOpenedRef.current = false;
  }, [position]);

  // Cleanup
  useEffect(() => {
    return () => {
      hasOpenedRef.current = false;
      if (markerRef.current) {
        try {
          markerRef.current.closePopup();
        } catch (error) {
          console.error("TempMarker: Error cleaning up:", error);
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
        <NewMarkerForm
          markerName={markerName}
          setMarkerName={setMarkerName}
          markerType={markerType}
          setMarkerType={setMarkerType}
          onSave={handleSave}
          disabled={isProcessing}
        />
      </Popup>
    </Marker>
  );
};

export default React.memo(TempMarker);
