
import { LocationMarker } from '@/utils/geo-utils';
import UserMarker from './UserMarker';
import TempMarker from './TempMarker';
import React, { useMemo, useRef } from 'react';

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
  // Use a stable ref for temp marker key to prevent unnecessary re-renders
  const tempMarkerKeyRef = useRef<string>('');
  
  // Only update the key when temp marker position actually changes
  const tempMarkerKey = useMemo(() => {
    if (!tempMarker) {
      tempMarkerKeyRef.current = '';
      return '';
    }
    
    const newKey = `temp-marker-${tempMarker[0]}-${tempMarker[1]}`;
    if (tempMarkerKeyRef.current !== newKey) {
      tempMarkerKeyRef.current = newKey;
    }
    return tempMarkerKeyRef.current;
  }, [tempMarker]);
  
  // Use useMemo to deduplicate markers by ID and prevent unnecessary recalculations
  const uniqueMarkers = useMemo(() => {
    const markerMap = new Map<string, LocationMarker>();
    if (Array.isArray(markers)) {
      markers.forEach(marker => {
        markerMap.set(marker.id, marker);
      });
    }
    return Array.from(markerMap.values());
  }, [markers]);
  
  // Check if temp marker position matches any existing marker position
  const isTemporaryMarkerDuplicate = useMemo(() => {
    if (!tempMarker) return false;
    
    return uniqueMarkers.some(marker => {
      const [lat1, lng1] = marker.position;
      const [lat2, lng2] = tempMarker;
      
      // Use a small threshold for floating point comparison
      const threshold = 0.00001;
      return Math.abs(lat1 - lat2) < threshold && Math.abs(lng1 - lng2) < threshold;
    });
  }, [tempMarker, uniqueMarkers]);

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
      
      {tempMarker && Array.isArray(tempMarker) && !isProcessingMarker && !isTemporaryMarkerDuplicate && (
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
