
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';
import { isPointWithinAnyDrawnPath, getClosestPointWithinPaths } from '@/utils/path-boundary-utils';
import { toast } from 'sonner';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const UserMarker = ({ marker, onDelete }: UserMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tooltipKey, setTooltipKey] = useState(`tooltip-${marker.id}-${Date.now()}`);
  const [originalPosition, setOriginalPosition] = useState<[number, number]>(marker.position);
  const [currentMarkerName, setCurrentMarkerName] = useState(marker.name);
  const [imageUid] = useState(() => crypto.randomUUID());
  const [iconUid] = useState(() => crypto.randomUUID());
  
  // Create a custom marker ID for DOM element tracking
  const markerId = `marker-${marker.id}`;

  // Update current marker name when marker prop changes
  useEffect(() => {
    if (marker.name !== currentMarkerName) {
      setCurrentMarkerName(marker.name);
      setTooltipKey(`tooltip-${marker.id}-${Date.now()}`);
    }
  }, [marker.name, currentMarkerName, marker.id]);

  const handleDragStart = useCallback((e: L.LeafletEvent) => {
    if (markerRef.current) {
      const currentPosition = markerRef.current.getLatLng();
      setOriginalPosition([currentPosition.lat, currentPosition.lng]);
    }
  }, []);

  const handleDrag = useCallback((e: L.LeafletEvent) => {
    if (!markerRef.current || isDeleting) return;
    
    try {
      const updatedMarker = e.target;
      const newPosition = updatedMarker.getLatLng();
      const newPoint: [number, number] = [newPosition.lat, newPosition.lng];
      
      // Check if the new position is within any drawn path
      const isWithinPath = isPointWithinAnyDrawnPath(newPoint);
      
      if (!isWithinPath) {
        // If outside all paths, find the closest point within a path
        const closestPoint = getClosestPointWithinPaths(newPoint);
        
        // Set marker to the closest valid position
        updatedMarker.setLatLng(closestPoint);
        
        // Show a brief warning toast
        toast.warning('Marker movement restricted to drawn path boundaries', {
          duration: 1000,
          position: 'bottom-center'
        });
      }
    } catch (error) {
      console.error('Error during marker drag:', error);
    }
  }, [isDeleting]);

  const handleDragEnd = useCallback((e: L.LeafletEvent) => {
    if (!markerRef.current || isDeleting) return;
    
    try {
      const updatedMarker = e.target;
      const newPosition = updatedMarker.getLatLng();
      const newPoint: [number, number] = [newPosition.lat, newPosition.lng];
      
      // Final check - ensure the marker is within a drawn path
      const isWithinPath = isPointWithinAnyDrawnPath(newPoint);
      
      if (!isWithinPath) {
        // If still outside, revert to original position
        updatedMarker.setLatLng(originalPosition);
        toast.error('Marker must stay within drawn path boundaries');
        return;
      }
      
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
      
      // Update tooltip key to force re-render
      setTooltipKey(`tooltip-${marker.id}-${Date.now()}`);
    } catch (error) {
      console.error('Error updating marker position:', error);
    }
  }, [marker.id, isDeleting, originalPosition]);

  // Handler for deleting a marker safely
  const handleDelete = useCallback((id: string) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    // First close any open popups or tooltips
    if (markerRef.current) {
      try {
        markerRef.current.closeTooltip();
        markerRef.current.closePopup();
      } catch (e) {
        console.error('Error cleaning up marker before deletion:', e);
      }
    }
    
    // Then delete the marker
    onDelete(id);
    
    // Reset isDeleting state after a short delay
    setTimeout(() => {
      setIsDeleting(false);
    }, 100);
  }, [onDelete, isDeleting]);

  // Set up marker references and handle cleanup when unmounting
  useEffect(() => {
    // Cleanup function for when the marker is unmounted
    return () => {
      if (markerRef.current) {
        try {
          // First close tooltips and popups
          markerRef.current.closeTooltip();
          markerRef.current.closePopup();
          
          // Clean up any leftover DOM elements that might be causing duplicates
          const duplicateIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${markerId}"], .leaflet-marker-shadow[data-marker-id="${markerId}"]`);
          duplicateIcons.forEach(icon => {
            if (icon.parentNode) {
              icon.parentNode.removeChild(icon);
            }
          });
          
          // Clean up marker image elements
          const duplicateImages = document.querySelectorAll(`[data-image-uid="${imageUid}"]`);
          duplicateImages.forEach(img => {
            if (img.parentNode) {
              img.parentNode.removeChild(img);
            }
          });

          // Clean up leaflet-marker-icon elements
          const duplicateMarkerIcons = document.querySelectorAll(`[data-icon-uid="${iconUid}"]`);
          duplicateMarkerIcons.forEach(icon => {
            if (icon.parentNode) {
              icon.parentNode.removeChild(icon);
            }
          });
        } catch (error) {
          console.error('Error cleaning up marker:', error);
        }
      }
    };
  }, [markerId, imageUid, iconUid]);

  // Set up marker references
  const setMarkerInstance = (leafletMarker: L.Marker) => {
    if (leafletMarker && !markerRef.current) {
      markerRef.current = leafletMarker;
      
      // Add a custom data attribute to help identify this marker's DOM elements
      const element = leafletMarker.getElement();
      if (element) {
        element.setAttribute('data-marker-id', markerId);
        element.setAttribute('data-marker-uid', iconUid);
        
        // Add UID to the leaflet-marker-icon element
        if (element.classList.contains('leaflet-marker-icon')) {
          element.setAttribute('data-icon-uid', iconUid);
          element.setAttribute('data-marker-icon-id', markerId);
          element.setAttribute('data-marker-type', 'user');
          element.id = `marker-icon-${iconUid}`;
          console.log(`User marker icon configured with UID: ${iconUid} for marker: ${marker.id}`);
        }
        
        // Add UID to the marker image element
        const imgElement = element.querySelector('img');
        if (imgElement) {
          imgElement.setAttribute('data-image-uid', imageUid);
          imgElement.setAttribute('data-marker-image-id', markerId);
          imgElement.setAttribute('data-image-type', 'marker-icon');
          imgElement.setAttribute('data-marker-type', 'user');
          imgElement.setAttribute('data-marker-img-uid', imageUid);
          imgElement.id = `marker-image-${imageUid}`;
          console.log(`User marker image configured with UID: ${imageUid} for marker: ${marker.id}`);
        }
      }
      
      setIsReady(true);
    }
  };
  
  return (
    <Marker 
      position={marker.position} 
      key={`marker-${marker.id}`}
      draggable={true}
      ref={setMarkerInstance}
      eventHandlers={{ 
        dragstart: handleDragStart,
        drag: handleDrag,
        dragend: handleDragEnd 
      }}
      attribution={`marker-${marker.id}`}
    >
      <MarkerPopup 
        marker={marker} 
        onDelete={() => handleDelete(marker.id)} 
      />

      <Tooltip 
        key={tooltipKey}
        direction="top" 
        offset={[0, -10]} 
        opacity={0.9}
        permanent={true}
      >
        <span className="font-medium">{currentMarkerName}</span>
      </Tooltip>
    </Marker>
  );
};

export default React.memo(UserMarker);
