
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
  const hasTriedOpeningRef = useRef(false);
  
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

  // Improved popup opening that waits for both marker and popup to be ready
  const tryOpenPopup = useCallback(() => {
    if (isOpeningRef.current || hasTriedOpeningRef.current || !markerRef.current || !popupRef.current) {
      return;
    }
    
    isOpeningRef.current = true;
    hasTriedOpeningRef.current = true;
    console.log('TempMarker: Attempting to open popup with both marker and popup ready');
    
    try {
      // Close any existing popups first
      markerRef.current.closePopup();
      
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        try {
          if (markerRef.current && popupRef.current) {
            markerRef.current.openPopup();
            
            // Check if popup opened and focus input
            setTimeout(() => {
              if (markerRef.current && markerRef.current.isPopupOpen()) {
                console.log('TempMarker: Popup opened successfully');
                const popupElement = popupRef.current?.getElement();
                if (popupElement) {
                  const input = popupElement.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) {
                    input.focus();
                    input.select();
                    console.log('TempMarker: Input focused and selected');
                  }
                }
              } else {
                console.log('TempMarker: Popup failed to open');
              }
              isOpeningRef.current = false;
            }, 100);
          }
        } catch (error) {
          console.error('TempMarker: Error in requestAnimationFrame:', error);
          isOpeningRef.current = false;
        }
      });
      
    } catch (error) {
      console.error('TempMarker: Error opening popup:', error);
      isOpeningRef.current = false;
    }
  }, []);

  // Set up marker reference
  const setMarkerInstance = useCallback((marker: L.Marker) => {
    if (marker && !markerRef.current) {
      markerRef.current = marker;
      console.log('TempMarker: Marker instance set');
      
      // Try to open popup if popup is also ready
      if (popupRef.current) {
        setTimeout(() => tryOpenPopup(), 250);
      }
    }
  }, [tryOpenPopup]);

  // Set up popup reference
  const setPopupInstance = useCallback((popup: L.Popup) => {
    if (popup && !popupRef.current) {
      popupRef.current = popup;
      console.log('TempMarker: Popup instance set');
      
      // Try to open popup if marker is also ready
      if (markerRef.current) {
        setTimeout(() => tryOpenPopup(), 250);
      }
    }
  }, [tryOpenPopup]);

  // Handle marker events
  const handleMarkerAdd = useCallback((e: L.LeafletEvent) => {
    console.log('TempMarker: Marker added to map');
    // Try opening popup after a delay if both refs are ready
    setTimeout(() => {
      if (markerRef.current && popupRef.current && !hasTriedOpeningRef.current) {
        tryOpenPopup();
      }
    }, 300);
  }, [tryOpenPopup]);

  const handlePopupOpen = useCallback(() => {
    console.log('TempMarker: Popup opened event fired');
  }, []);

  // Simplified popup close handler - allow closing after save
  const handlePopupClose = useCallback(() => {
    console.log('TempMarker: Popup close attempted');
    
    // Only prevent close if we're not processing (saving)
    if (!isProcessing && markerRef.current) {
      console.log('TempMarker: Preventing popup close');
      // Simple reopen after a short delay
      setTimeout(() => {
        if (markerRef.current && !markerRef.current.isPopupOpen()) {
          try {
            markerRef.current.openPopup();
          } catch (error) {
            console.error('TempMarker: Error reopening popup:', error);
          }
        }
      }, 50);
    }
  }, [isProcessing]);

  // Reset refs when position changes
  useEffect(() => {
    hasTriedOpeningRef.current = false;
    isOpeningRef.current = false;
  }, [position]);

  // Cleanup
  useEffect(() => {
    return () => {
      isOpeningRef.current = false;
      hasTriedOpeningRef.current = false;
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
