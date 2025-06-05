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
  const forceOpenTimeoutRef = useRef<NodeJS.Timeout>();
  
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

  // Force open popup with multiple attempts
  const forceOpenPopup = useCallback((marker: L.Marker, attempt = 1) => {
    if (!marker) return;
    
    console.log(`TempMarker: Force opening popup - attempt ${attempt}`);
    
    try {
      // Check if popup exists
      const popup = marker.getPopup();
      if (!popup) {
        console.error('TempMarker: No popup found on marker');
        return;
      }
      
      // Check if popup is already open
      if (marker.isPopupOpen()) {
        console.log('TempMarker: Popup is already open');
        return;
      }
      
      // Try to open the popup
      marker.openPopup();
      
      // Verify it opened and retry if it didn't
      setTimeout(() => {
        if (!marker.isPopupOpen() && attempt < 5) {
          console.log(`TempMarker: Popup still not open, retrying attempt ${attempt + 1}`);
          forceOpenPopup(marker, attempt + 1);
        } else if (marker.isPopupOpen()) {
          console.log('TempMarker: Popup successfully opened');
          
          // Force focus on the input field
          setTimeout(() => {
            const popupElement = marker.getPopup()?.getElement();
            if (popupElement) {
              const input = popupElement.querySelector('input[type="text"]') as HTMLInputElement;
              if (input) {
                input.focus();
                console.log('TempMarker: Input focused');
              }
            }
          }, 100);
        } else {
          console.error('TempMarker: Failed to open popup after 5 attempts');
        }
      }, 200 * attempt); // Increasing delay with each attempt
      
    } catch (error) {
      console.error('TempMarker: Error opening popup:', error);
    }
  }, []);

  // Set up marker and popup references
  const setMarkerInstance = useCallback((marker: L.Marker) => {
    if (marker) {
      markerRef.current = marker;
      console.log('TempMarker: Marker instance set');
      
      // Clear any existing timeout
      if (forceOpenTimeoutRef.current) {
        clearTimeout(forceOpenTimeoutRef.current);
      }
      
      // Force open popup after a short delay to ensure everything is ready
      forceOpenTimeoutRef.current = setTimeout(() => {
        forceOpenPopup(marker);
      }, 150);
    }
  }, [forceOpenPopup]);

  const setPopupInstance = useCallback((popup: L.Popup) => {
    if (popup) {
      popupRef.current = popup;
      console.log('TempMarker: Popup instance set');
    }
  }, []);

  // Handle marker events
  const handleMarkerAdd = useCallback((e: L.LeafletEvent) => {
    console.log('TempMarker: Marker added to map');
    const marker = e.target as L.Marker;
    
    // Additional delay before forcing popup open
    setTimeout(() => {
      forceOpenPopup(marker);
    }, 100);
  }, [forceOpenPopup]);

  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (forceOpenTimeoutRef.current) {
        clearTimeout(forceOpenTimeoutRef.current);
      }
      
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
        popupopen: () => {
          console.log('TempMarker: Popup opened event fired');
        },
        popupclose: () => {
          console.log('TempMarker: Popup closed event fired');
        }
      }}
    >
      <Popup 
        ref={setPopupInstance}
        closeOnClick={false}
        closeOnEscapeKey={false}
        autoClose={false}
        closeButton={true}
        autoPan={true}
        keepInView={true}
        className="temp-marker-popup"
        maxWidth={300}
        minWidth={250}
      >
        <div style={{ minWidth: '250px', padding: '8px' }}>
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
