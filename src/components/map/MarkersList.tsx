
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
  isProcessingMarker?: boolean;
}

const MarkersList = ({
  markers,
  tempMarker,
  markerName,
  markerType,
  onDeleteMarker,
  onSaveMarker,
  setMarkerName,
  setMarkerType,
  isProcessingMarker = false
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
    if (isProcessingMarker) return;
    
    console.log(`MarkersList: Initiating delete for marker ${id}`);
    
    // Set global flag to prevent map click events temporarily
    window.preventMapClick = true;
    
    // Call the delete handler
    onDeleteMarker(id);
    
    // Clean up DOM elements without triggering additional events
    setTimeout(() => {
      const markerId = `marker-${id}`;
      const duplicateIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${markerId}"], .leaflet-marker-shadow[data-marker-id="${markerId}"]`);
      duplicateIcons.forEach(icon => {
        if (icon.parentNode) {
          icon.parentNode.removeChild(icon);
        }
      });
      
      const activePopups = document.querySelectorAll('.leaflet-popup');
      activePopups.forEach(popup => {
        try {
          popup.remove();
        } catch (e) {
          console.error('Error removing popup:', e);
        }
      });
      
      setTimeout(() => {
        window.preventMapClick = false;
      }, 300);
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
      
      {tempMarker && Array.isArray(tempMarker) && !isProcessingMarker && (
        <TempMarker 
          key={tempMarkerKey}
          position={tempMarker}
          markerName={markerName}
          setMarkerName={setMarkerName}
          markerType={markerType}
          setMarkerType={setMarkerType}
          onSave={onSaveMarker}
          isProcessing={isProcessingMarker}
        />
      )}
    </>
  );
};

export default React.memo(MarkersList);
