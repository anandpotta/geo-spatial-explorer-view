
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
  const saveInProgressRef = useRef(false);
  
  // Create a stable marker ID that doesn't change on every render
  const markerId = `temp-marker-${position[0].toFixed(6)}-${position[1].toFixed(6)}`;

  // Handle cleanup when component unmounts or marker is being processed
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.closeTooltip();
          markerRef.current.closePopup();
        } catch (error) {
          console.error("Error cleaning up temp marker:", error);
        }
      }
    };
  }, []);

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
  
  // Custom save handler that prevents duplicate calls
  const handleSave = useCallback(() => {
    if (isProcessing || saveInProgressRef.current) {
      console.log('Save already in progress, ignoring duplicate call');
      return;
    }
    
    console.log('TempMarker: Save initiated');
    saveInProgressRef.current = true;
    
    // Reset the flag after a delay to allow for processing
    setTimeout(() => {
      saveInProgressRef.current = false;
    }, 2000);
    
    onSave();
  }, [isProcessing, onSave]);

  // Handle marker click - ensure popup opens
  const handleMarkerClick = useCallback((e: L.LeafletMouseEvent) => {
    console.log('Temp marker clicked - forcing popup open');
    
    // Stop propagation to prevent map click
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
    }
    
    // Force popup to open
    if (markerRef.current) {
      try {
        markerRef.current.openPopup();
        console.log('Popup forced open on marker click');
      } catch (error) {
        console.error('Error opening popup on click:', error);
      }
    }
  }, []);

  // Set up marker references and handle initial popup
  const setMarkerInstance = useCallback((marker: L.Marker) => {
    if (marker && isVisible) {
      markerRef.current = marker;
      
      const element = marker.getElement();
      if (element) {
        element.setAttribute('data-marker-id', markerId);
        // Ensure marker is clickable
        element.style.pointerEvents = 'auto';
        element.style.cursor = 'pointer';
      }
      
      // Force popup open immediately after marker is ready
      setTimeout(() => {
        if (markerRef.current && isVisible) {
          try {
            console.log('Force opening popup after marker creation');
            markerRef.current.openPopup();
          } catch (error) {
            console.error("Error force opening popup:", error);
          }
        }
      }, 100);
    }
  }, [markerId, isVisible]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <Marker
      position={position}
      ref={setMarkerInstance}
      draggable={!isProcessing}
      eventHandlers={{
        dragend: handleDragEnd,
        click: handleMarkerClick
      }}
    >
      <Popup 
        closeOnClick={false}
        closeOnEscapeKey={true}
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
