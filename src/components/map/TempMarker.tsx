
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
  const [hasOpenedPopup, setHasOpenedPopup] = useState(false);
  
  // Create a stable marker ID that doesn't change on every render
  const markerId = `temp-marker-${position[0].toFixed(6)}-${position[1].toFixed(6)}`;

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
  
  // Custom save handler with processing state
  const handleSave = useCallback(() => {
    if (isProcessing) return;
    
    console.log('TempMarker: Save initiated');
    
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
  }, [isProcessing, markerId, onSave]);

  // Set up marker references
  const setMarkerInstance = useCallback((marker: L.Marker) => {
    if (marker && isVisible && !markerRef.current) {
      markerRef.current = marker;
      
      const element = marker.getElement();
      if (element) {
        element.setAttribute('data-marker-id', markerId);
      }
    }
  }, [markerId, isVisible]);

  // Handle popup opening only once
  const handleMarkerAdd = useCallback(() => {
    if (!hasOpenedPopup && markerRef.current && isVisible) {
      setTimeout(() => {
        try {
          if (markerRef.current && isVisible) {
            markerRef.current.openPopup();
            setHasOpenedPopup(true);
          }
        } catch (error) {
          console.error("Error opening popup:", error);
        }
      }, 100);
    }
  }, [hasOpenedPopup, isVisible]);

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
        add: handleMarkerAdd
      }}
    >
      <NewMarkerForm
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={handleSave}
        disabled={isProcessing}
      />
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
