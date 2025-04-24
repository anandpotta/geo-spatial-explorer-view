
import React, { useEffect, useRef } from 'react';
import { Marker, useMapEvents } from 'react-leaflet';
import NewMarkerForm from './NewMarkerForm';
import L from 'leaflet';

interface TempMarkerProps {
  position: [number, number];
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
}

const TempMarker = ({
  position,
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave
}: TempMarkerProps) => {
  // Generate a unique key for the marker based on its position
  const markerKey = `temp-marker-${position[0]}-${position[1]}-${Date.now()}`;
  const isInitializedRef = useRef(false);
  const flagIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  // Disable ALL map keyboard events while marker is active
  useMapEvents({
    // Use event handlers with higher priority to intercept events
    keypress: (e) => {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    },
    keydown: (e) => {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    },
    keyup: (e) => {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
  });
  
  useEffect(() => {
    // Only run this once per marker instance
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    // Set flags immediately to prevent map navigation
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
    
    console.log('TempMarker mounted - enforcing tempMarkerPlaced=true and userHasInteracted=true');
    
    // Update position if the window function exists
    if (window.tempMarkerPositionUpdate) {
      window.tempMarkerPositionUpdate([...position]);
    }
    
    // Save position to localStorage as backup
    try {
      localStorage.setItem('tempMarkerPosition', JSON.stringify(position));
    } catch (error) {
      console.error('Failed to store marker in localStorage:', error);
    }
    
    // Less frequent flag updates to reduce interference
    flagIntervalRef.current = setInterval(() => {
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
    }, 3000);
    
    // Apply global CSS to prevent map keyboard events from interfering
    const style = document.createElement('style');
    style.innerHTML = `
      .marker-form-popup .leaflet-popup-content-wrapper,
      .marker-form-popup .leaflet-popup-content {
        pointer-events: auto !important;
      }
      .marker-form-popup .leaflet-popup-content-wrapper {
        cursor: default !important;
      }
      .marker-form-popup input:focus {
        z-index: 1000;
      }
      /* Disable map interactions when popup is open */
      .marker-form-active .leaflet-control-container {
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    
    // Add a class to the map container to help with styling
    if (markerRef.current && markerRef.current._map && markerRef.current._map._container) {
      markerRef.current._map._container.classList.add('marker-form-active');
    }
    
    return () => {
      // Clean up
      if (flagIntervalRef.current !== null) {
        clearInterval(flagIntervalRef.current);
        flagIntervalRef.current = null;
      }
      
      // Remove the style element
      document.head.removeChild(style);
      
      // Remove the class from the map container
      if (markerRef.current && markerRef.current._map && markerRef.current._map._container) {
        markerRef.current._map._container.classList.remove('marker-form-active');
      }
      
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
    };
  }, [position]);
  
  // Save handler with propagation control
  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onSave();
  };
  
  return (
    <Marker 
      key={markerKey}
      position={position} 
      draggable={true}
      ref={markerRef}
      eventHandlers={{
        dragstart: (e) => {
          // Stop propagation
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
          window.userHasInteracted = true;
          window.tempMarkerPlaced = true;
        },
        dragend: (e) => {
          // Stop propagation
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
          
          const marker = e.target;
          const newPosition = marker.getLatLng();
          
          window.userHasInteracted = true;
          window.tempMarkerPlaced = true;
          
          // Update marker position
          if (window.tempMarkerPositionUpdate) {
            window.tempMarkerPositionUpdate([newPosition.lat, newPosition.lng]);
            
            try {
              localStorage.setItem('tempMarkerPosition', JSON.stringify([newPosition.lat, newPosition.lng]));
            } catch (error) {
              console.error('Failed to store marker position:', error);
            }
          }
        },
        click: (e) => {
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
        },
        popupopen: (e) => {
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
          
          // Focus the input field when popup opens
          setTimeout(() => {
            const input = document.querySelector('.marker-form-popup input') as HTMLInputElement;
            if (input) {
              input.focus();
              input.select();
            }
          }, 100);
        }
      }}
    >
      <NewMarkerForm
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={handleSave}
      />
    </Marker>
  );
};

export default TempMarker;
