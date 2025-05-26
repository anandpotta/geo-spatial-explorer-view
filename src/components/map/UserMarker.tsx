
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
  const [currentPosition, setCurrentPosition] = useState<[number, number]>(marker.position);
  
  // Create a custom marker ID for DOM element tracking
  const markerId = `marker-${marker.id}`;

  // Initialize marker position - ensure it's within drawn paths if paths exist
  useEffect(() => {
    const validateInitialPosition = () => {
      try {
        const savedDrawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]');
        
        // If there are no drawings, allow marker at its saved position
        if (savedDrawings.length === 0) {
          setCurrentPosition(marker.position);
          return;
        }
        
        // Check if marker position is within any drawn path
        const isWithinPath = isPointWithinAnyDrawnPath(marker.position);
        
        if (isWithinPath) {
          // Position is valid, use it
          setCurrentPosition(marker.position);
        } else {
          // Position is outside paths, find closest valid position
          const closestPoint = getClosestPointWithinPaths(marker.position);
          setCurrentPosition(closestPoint);
          
          // Update the marker position in localStorage
          const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
          const updatedMarkers = savedMarkers.map((m: LocationMarker) => {
            if (m.id === marker.id) {
              return { ...m, position: closestPoint };
            }
            return m;
          });
          localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
        }
      } catch (error) {
        console.error('Error validating marker position:', error);
        setCurrentPosition(marker.position);
      }
    };

    validateInitialPosition();
  }, [marker.position, marker.id]);

  const handleDragStart = useCallback((e: L.LeafletEvent) => {
    if (markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      setOriginalPosition([currentPos.lat, currentPos.lng]);
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
        setCurrentPosition(closestPoint);
        
        // Show a brief warning toast
        toast.warning('Marker movement restricted to drawn path boundaries', {
          duration: 1000,
          position: 'bottom-center'
        });
      } else {
        setCurrentPosition(newPoint);
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
        setCurrentPosition(originalPosition);
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
      
      setCurrentPosition(newPoint);
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
        } catch (error) {
          console.error('Error cleaning up marker:', error);
        }
      }
    };
  }, [markerId]);

  // Set up marker references
  const setMarkerInstance = (marker: L.Marker) => {
    if (marker && !markerRef.current) {
      markerRef.current = marker;
      
      // Add a custom data attribute to help identify this marker's DOM elements
      const element = marker.getElement();
      if (element) {
        element.setAttribute('data-marker-id', markerId);
      }
      
      setIsReady(true);
    }
  };

  // Debug logging for marker visibility
  useEffect(() => {
    console.log(`Marker ${marker.id} position:`, currentPosition, 'within path:', isPointWithinAnyDrawnPath(currentPosition));
  }, [currentPosition, marker.id]);
  
  return (
    <Marker 
      position={currentPosition} 
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
        <span className="font-medium">{marker.name}</span>
      </Tooltip>
    </Marker>
  );
};

export default React.memo(UserMarker);
