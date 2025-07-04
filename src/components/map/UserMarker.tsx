import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';
import NewMarkerForm from './NewMarkerForm';
import { isPointWithinAnyDrawnPath, getClosestPointWithinPaths } from '@/utils/path-boundary-utils';
import { toast } from 'sonner';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

const UserMarker = ({ marker, onDelete, onRename }: UserMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tooltipKey, setTooltipKey] = useState(`tooltip-${marker.id}-${Date.now()}`);
  const [originalPosition, setOriginalPosition] = useState<[number, number]>(marker.position);
  const [tooltipText, setTooltipText] = useState(marker.name);
  
  // Create a custom marker ID for DOM element tracking
  const markerId = `marker-${marker.id}`;

  // Update tooltip text when marker name changes
  useEffect(() => {
    console.log('UserMarker: marker name changed to:', marker.name);
    setTooltipText(marker.name);
    // Force tooltip re-render with new key
    setTooltipKey(`tooltip-${marker.id}-${Date.now()}`);
  }, [marker.name, marker.id]);

  // Force tooltip to be visible when marker is ready
  useEffect(() => {
    if (markerRef.current && isReady) {
      setTimeout(() => {
        try {
          if (markerRef.current) {
            markerRef.current.openTooltip();
            console.log('UserMarker: tooltip opened for marker:', marker.name);
          }
        } catch (error) {
          console.error('Error opening tooltip:', error);
        }
      }, 100);
    }
  }, [isReady, marker.id, marker.name, tooltipKey]);

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

  // Handler for editing a marker
  const handleEdit = useCallback((id: string) => {
    setIsEditing(true);
    // Close the popup to show the edit form
    if (markerRef.current) {
      markerRef.current.closePopup();
      // Open the popup again after a short delay to show the edit form
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      }, 100);
    }
  }, []);

  // Handler for renaming a marker
  const handleRename = useCallback((id: string, newName: string) => {
    if (onRename) {
      onRename(id, newName);
    }
    setIsEditing(false);
    // Update tooltip text immediately
    setTooltipText(newName);
    setTooltipKey(`tooltip-${marker.id}-${Date.now()}`);
  }, [onRename, marker.id]);

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
      {isEditing ? (
        <NewMarkerForm
          markerName={marker.name}
          setMarkerName={() => {}} // Not used in edit mode
          markerType={marker.type}
          setMarkerType={() => {}} // Not used in edit mode
          onSave={() => {}} // Not used in edit mode
          isEditing={true}
          existingMarkerId={marker.id}
          onRename={handleRename}
        />
      ) : (
        <MarkerPopup 
          marker={marker} 
          onDelete={() => handleDelete(marker.id)}
          onEdit={handleEdit}
        />
      )}

      <Tooltip 
        key={tooltipKey}
        direction="top" 
        offset={[0, -10]} 
        opacity={0.9}
        permanent={true}
      >
        <span className="font-medium">{tooltipText}</span>
      </Tooltip>
    </Marker>
  );
};

export default React.memo(UserMarker);
