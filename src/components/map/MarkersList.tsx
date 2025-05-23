
import { LocationMarker } from '@/utils/geo-utils';
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
    window.preventMapClick = true;
    
    // Prevent event propagation and default behavior
    onDeleteMarker(id);
    
    // Clear any active DOM elements that might trigger marker creation
    setTimeout(() => {
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
        window.preventMapClick = false;
      }, 500);
    }, 0);
  };
  
  return (
    <>
      {uniqueMarkers.map((marker) => (
        <UserMarker 
          key={`user-marker-${marker.id}`} 
          marker={marker} 
          onDelete={handleDeleteMarker} 
        />
      ))}
      
      {tempMarker && Array.isArray(tempMarker) && (
        <TempMarker 
          key={tempMarkerKey}
          position={tempMarker}
          markerName={markerName}
          setMarkerName={setMarkerName}
          markerType={markerType}
          setMarkerType={setMarkerType}
          onSave={onSaveMarker}
        />
      )}
    </>
  );
};

export default React.memo(MarkersList);
