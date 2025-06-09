
import { LocationMarker } from '@/utils/marker-utils';
import UserMarker from './UserMarker';
import TempMarker from './TempMarker';
import React, { useMemo } from 'react';

interface MarkersListProps {
  markers: LocationMarker[];
  tempMarker: [number, number] | null;
  markerName: string;
  markerType: 'pin' | 'area' | 'building';
  onDeleteMarker: (id: string) => void;
  onSaveMarker: () => void;
  setMarkerName: (name: string) => void;
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
}

const MarkersList = ({
  markers,
  tempMarker,
  markerName,
  markerType,
  onDeleteMarker,
  onSaveMarker,
  setMarkerName,
  setMarkerType
}: MarkersListProps) => {
  // Generate a unique key for the temp marker that changes when position changes
  const tempMarkerKey = tempMarker ? `temp-marker-${tempMarker[0]}-${tempMarker[1]}-${Date.now()}` : '';
  
  // Use useMemo to deduplicate markers by ID
  const uniqueMarkers = useMemo(() => {
    const markerMap = new Map<string, LocationMarker>();
    if (Array.isArray(markers)) {
      markers.forEach(marker => {
        markerMap.set(marker.id, marker);
      });
    }
    return Array.from(markerMap.values());
  }, [markers]);
  
  // Safe delete handler that prevents unwanted marker creation
  const handleDeleteMarker = (id: string) => {
    // Set global flag to prevent map click events temporarily
    if (typeof window !== 'undefined' && window.preventMapClick !== undefined) {
      window.preventMapClick = true;
    }
    
    // Call the delete handler
    onDeleteMarker(id);
    
    // Clear any active DOM elements that might trigger marker creation
    setTimeout(() => {
      // Remove any leftover marker icons that might be causing duplicates
      const markerId = `marker-${id}`;
      const duplicateIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${markerId}"], .leaflet-marker-shadow[data-marker-id="${markerId}"]`);
      duplicateIcons.forEach(icon => {
        if (icon.parentNode) {
          icon.parentNode.removeChild(icon);
        }
      });
      
      // Clean up any active popups
      const activePopups = document.querySelectorAll('.leaflet-popup');
      activePopups.forEach(popup => {
        try {
          popup.remove();
        } catch (e) {
          console.error('Error removing popup:', e);
        }
      });
      
      // Reset preventMapClick flag after a short delay
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.preventMapClick !== undefined) {
          window.preventMapClick = false;
        }
      }, 500);
    }, 0);
  };

  // Handle marker rename
  const handleRenameMarker = (id: string, newName: string) => {
    // Implementation for renaming marker would go here
    console.log(`Renaming marker ${id} to ${newName}`);
  };
  
  return (
    <>
      {uniqueMarkers.map((marker) => (
        <UserMarker 
          key={`user-marker-${marker.id}`} 
          marker={marker} 
          onDelete={handleDeleteMarker}
          onRename={handleRenameMarker}
        />
      ))}
      
      {tempMarker && Array.isArray(tempMarker) && (
        <TempMarker 
          key={tempMarkerKey}
          position={tempMarker}
        />
      )}
    </>
  );
};

export default React.memo(MarkersList);
