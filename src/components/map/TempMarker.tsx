
import React, { useEffect, useRef, useCallback } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMarkerEvents } from '@/hooks/useMarkerEvents';
import { usePopupStyles } from '@/hooks/usePopupStyles';
import NewMarkerForm from './marker/NewMarkerForm';

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
  const map = useMap();
  // Use stable key to prevent remounting
  const markerKey = useRef(`temp-marker-${Date.now()}`);
  
  // Apply the marker events and popup styles
  useMarkerEvents(map);
  usePopupStyles();
  
  // Prevent map interactions when marker form is active
  const preventMapInteractions = useCallback((e?: L.LeafletEvent) => {
    window.userHasInteracted = true;
    window.tempMarkerPlaced = true;
    if (e && e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
  }, []);
  
  // Add marker-specific class to the map container for CSS targeting
  useEffect(() => {
    const mapContainer = map.getContainer();
    if (mapContainer) {
      mapContainer.classList.add('marker-form-active');
    }
    
    // Set global flags for marker presence - but only for this specific marker
    // This will indicate a user-initiated marker, not an auto-detected one
    if (position && position.length === 2) {
      window.tempMarkerPlaced = true;
      console.log('Setting temporary marker at position:', position);
    }
    
    return () => {
      // Remove the class when the marker is unmounted
      if (mapContainer) {
        mapContainer.classList.remove('marker-form-active');
      }
    };
  }, [map, position]);

  // Create a custom handler for updating marker position
  useEffect(() => {
    // Expose a global function to update the marker position from drag events
    window.tempMarkerPositionUpdate = (newPosition: [number, number]) => {
      console.log('Marker dragged to:', newPosition);
      // This will be used by the dragend event handler to update position state
    };
    
    return () => {
      // Clean up the global function when component unmounts
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  return (
    <Marker 
      key={markerKey.current}
      position={position} 
      draggable={true}
      eventHandlers={{
        dragstart: (e) => {
          // Prevent map movement when dragging the marker
          preventMapInteractions(e);
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
        },
        dragend: (e) => {
          // Ensure map panning is stopped
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
          preventMapInteractions(e);
          // Update position using the global handler if available
          if (window.tempMarkerPositionUpdate) {
            const newPosition = e.target.getLatLng();
            window.tempMarkerPositionUpdate([newPosition.lat, newPosition.lng]);
          }
        },
        click: (e) => {
          // Prevent the click from propagating to the map
          preventMapInteractions(e);
          L.DomEvent.stopPropagation(e);
        }
      }}
    >
      <NewMarkerForm
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={onSave}
      />
    </Marker>
  );
};

export default TempMarker;
