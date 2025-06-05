
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
  const saveInProgressRef = useRef(false);
  const [forcePopupOpen, setForcePopupOpen] = useState(false);
  
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
  
  // Custom save handler that prevents duplicate calls
  const handleSave = useCallback(() => {
    if (isProcessing || saveInProgressRef.current) {
      console.log('Save already in progress, ignoring duplicate call');
      return;
    }
    
    console.log('TempMarker: Save initiated');
    saveInProgressRef.current = true;
    
    // Close popup after save
    setForcePopupOpen(false);
    
    // Reset the flag after a delay to allow for processing
    setTimeout(() => {
      saveInProgressRef.current = false;
    }, 2000);
    
    onSave();
  }, [isProcessing, onSave]);

  // Set up marker references and handle initial popup
  const setMarkerInstance = useCallback((marker: L.Marker) => {
    if (marker && isVisible && !markerRef.current) {
      markerRef.current = marker;
      
      const element = marker.getElement();
      if (element) {
        element.setAttribute('data-marker-id', markerId);
      }
      
      // Force popup open on creation
      setForcePopupOpen(true);
      
      // Auto-open popup after DOM is ready
      setTimeout(() => {
        if (markerRef.current && isVisible) {
          try {
            console.log('Auto-opening marker popup on creation');
            markerRef.current.openPopup();
          } catch (error) {
            console.error("Error opening popup:", error);
          }
        }
      }, 100);
    }
  }, [markerId, isVisible]);

  // Handle popup events
  const handlePopupOpen = useCallback((e: L.PopupEvent) => {
    console.log('Popup opened');
    setPopupOpen(true);
    setForcePopupOpen(true);
  }, []);

  const handlePopupClose = useCallback((e: L.PopupEvent) => {
    console.log('Popup closed');
    setPopupOpen(false);
    // Only allow popup close if not forced open and not processing
    if (!forcePopupOpen || isProcessing) {
      setForcePopupOpen(false);
    }
  }, [forcePopupOpen, isProcessing]);

  // Handle marker click
  const handleMarkerClick = useCallback((e: L.LeafletMouseEvent) => {
    console.log('Temp marker clicked');
    // Stop propagation to prevent map click
    e.originalEvent?.stopPropagation();
    
    // Force popup to stay open
    setForcePopupOpen(true);
    
    // Ensure popup opens on click if not already open
    if (markerRef.current && !popupOpen) {
      markerRef.current.openPopup();
    }
  }, [popupOpen]);

  // Don't render if not visible or if being processed and popup is closed
  if (!isVisible || (isProcessing && !popupOpen && !forcePopupOpen)) {
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
        popupclose: handlePopupClose,
        click: handleMarkerClick
      }}
    >
      <Popup 
        closeOnClick={false}
        closeOnEscapeKey={!forcePopupOpen}
        autoClose={false}
        closeButton={!isProcessing && !forcePopupOpen}
        autoPan={true}
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
