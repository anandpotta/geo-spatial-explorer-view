
import React, { useRef, useEffect, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
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
  const popupRef = useRef<L.Popup | null>(null);
  
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

  // Set up marker and popup references
  const setMarkerInstance = useCallback((marker: L.Marker) => {
    if (marker) {
      markerRef.current = marker;
      
      // Get the popup instance from the marker
      const popup = marker.getPopup();
      if (popup) {
        popupRef.current = popup;
      }
      
      console.log('TempMarker: Marker instance set');
      
      // Open popup immediately after marker is mounted
      setTimeout(() => {
        if (markerRef.current) {
          try {
            console.log('TempMarker: Opening popup');
            markerRef.current.openPopup();
          } catch (error) {
            console.error("Error opening popup:", error);
          }
        }
      }, 100);
    }
  }, []);

  const setPopupInstance = useCallback((popup: L.Popup) => {
    if (popup) {
      popupRef.current = popup;
      console.log('TempMarker: Popup instance set');
    }
  }, []);

  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
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
        add: (e) => {
          console.log('TempMarker: Marker added to map');
          // Force popup open when marker is added to map
          setTimeout(() => {
            if (e.target && e.target.openPopup) {
              console.log('TempMarker: Force opening popup on add');
              e.target.openPopup();
            }
          }, 50);
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
