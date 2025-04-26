
import { useEffect } from 'react';
import { LocationMarker } from '@/utils/marker-utils';
import UserMarker from '../UserMarker';
import TempMarker from '../TempMarker';

interface MarkersContainerProps {
  markers: LocationMarker[];
  tempMarker: [number, number] | null;
  markerName: string;
  markerType: 'pin' | 'area' | 'building';
  onDeleteMarker: (id: string) => void;
  onSaveMarker: () => void;
  setMarkerName: (name: string) => void;
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
}

const MarkersContainer = ({
  markers,
  tempMarker,
  markerName,
  markerType,
  onDeleteMarker,
  onSaveMarker,
  setMarkerName,
  setMarkerType
}: MarkersContainerProps) => {
  // Show all markers, removing the deduplication logic that was filtering out similarly located markers
  
  // Listen for storage or markers updated events
  useEffect(() => {
    const handleStorageChange = () => {
      // This is just to ensure the component re-renders when markers are updated externally
      console.log('Storage event received in MarkersContainer, markers count:', markers.length);
    };
    
    window.addEventListener('markersUpdated', handleStorageChange);
    window.addEventListener('mapLayersClearEvent', handleStorageChange);
    
    return () => {
      window.removeEventListener('markersUpdated', handleStorageChange);
      window.removeEventListener('mapLayersClearEvent', handleStorageChange);
    };
  }, [markers.length]);

  return (
    <>
      {Array.isArray(markers) && markers.map((marker) => (
        <UserMarker 
          key={`marker-${marker.id}`} 
          marker={marker} 
          onDelete={onDeleteMarker} 
        />
      ))}
      
      {tempMarker && Array.isArray(tempMarker) && (
        <TempMarker 
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

export default MarkersContainer;
