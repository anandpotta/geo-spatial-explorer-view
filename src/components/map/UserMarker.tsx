
import React, { useCallback, useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';
import L from 'leaflet';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
  mapKey?: string;
}

const UserMarker = ({ marker, onDelete, mapKey = 'global' }: UserMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);
  const markerId = `marker-${marker.id}-${mapKey}`;
  const iconElementRef = useRef<HTMLElement | null>(null);
  const shadowElementRef = useRef<HTMLElement | null>(null);
  
  // Set data attributes on marker elements for identification
  const setMarkerDataAttributes = useCallback((marker: L.Marker | null) => {
    if (!marker) return;
    
    try {
      // Access the icon element
      const icon = marker.getElement();
      if (icon) {
        iconElementRef.current = icon;
        icon.setAttribute('data-marker-id', markerId);
        icon.setAttribute('data-map-key', mapKey);
      }
      
      // Try to find the shadow element
      const iconElementId = icon?.getAttribute('src') || '';
      if (iconElementId) {
        const shadowParts = iconElementId.split('/');
        const iconFileName = shadowParts[shadowParts.length - 1];
        const shadowFileName = iconFileName.replace('marker-icon', 'marker-shadow');
        
        // Look for shadow elements
        document.querySelectorAll('.leaflet-marker-shadow').forEach(el => {
          const shadowSrc = el.getAttribute('src') || '';
          if (shadowSrc.includes(shadowFileName)) {
            shadowElementRef.current = el as HTMLElement;
            el.setAttribute('data-marker-id', markerId);
            el.setAttribute('data-map-key', mapKey);
          }
        });
      }
    } catch (err) {
      console.warn('Error setting data attributes on marker', err);
    }
  }, [markerId, mapKey]);
  
  // Cleanup marker when component unmounts or when clear all is triggered
  useEffect(() => {
    const handleClearAllMarkers = () => {
      if (markerRef.current) {
        try {
          // First try to remove the marker with Leaflet's remove method
          markerRef.current.remove();
        } catch (error) {
          console.error('Error removing marker during clear all:', error);
        }
        
        // Also remove the DOM elements directly
        if (iconElementRef.current) {
          iconElementRef.current.remove();
        }
        if (shadowElementRef.current) {
          shadowElementRef.current.remove();
        }
      }
    };
    
    // Listen for clear all markers event
    window.addEventListener('clearAllMarkers', handleClearAllMarkers);
    
    // Attach the marker reference after a short delay to ensure it's mounted
    setTimeout(() => {
      if (markerRef.current) {
        setMarkerDataAttributes(markerRef.current);
      }
    }, 50);
    
    return () => {
      window.removeEventListener('clearAllMarkers', handleClearAllMarkers);
      
      if (markerRef.current) {
        const leafletElement = markerRef.current;
        if (leafletElement && leafletElement.remove) {
          try {
            leafletElement.remove();
          } catch (error) {
            console.error('Error removing marker:', error);
          }
        }
      }
      
      // Also try to remove the DOM elements directly
      if (iconElementRef.current) {
        iconElementRef.current.remove();
      }
      if (shadowElementRef.current) {
        shadowElementRef.current.remove();
      }
    };
  }, [mapKey, setMarkerDataAttributes]);
  
  const handleDragEnd = useCallback((e: any) => {
    const updatedMarker = e.target;
    const newPosition = updatedMarker.getLatLng();
    
    // Update marker position in local storage
    const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
    const updatedMarkers = savedMarkers.map((m: LocationMarker) => {
      if (m.id === marker.id) {
        return {
          ...m,
          position: [newPosition.lat, newPosition.lng] as [number, number]
        };
      }
      return m;
    });
    
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    
    // Dispatch event to update other components
    window.dispatchEvent(new CustomEvent('markersUpdated'));
  }, [marker.id]);
  
  return (
    <Marker 
      position={marker.position} 
      key={markerId}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: (e) => {
          // Set data attributes when the marker is added to the map
          setMarkerDataAttributes(e.target);
        }
      }}
      ref={(ref) => {
        // In react-leaflet v4, we access the leaflet instance directly
        if (ref) {
          markerRef.current = ref;
          // Set data attributes as soon as marker reference is available
          setMarkerDataAttributes(ref);
        }
      }}
    >
      <MarkerPopup marker={marker} onDelete={onDelete} />
    </Marker>
  );
};

export default React.memo(UserMarker);
