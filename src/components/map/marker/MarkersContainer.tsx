
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
  // Filter out any potential duplicate markers that might exist with nearly identical positions
  const deduplicatedMarkers = markers.reduce((acc: LocationMarker[], marker: LocationMarker) => {
    // Check if we already have a very similar marker by position in our accumulator
    const isDuplicate = acc.some(m => {
      if (m.id === marker.id) return false; // Same marker ID is not a duplicate
      
      // Check if positions are very close (within ~10 meters)
      const distLat = Math.abs(m.position[0] - marker.position[0]);
      const distLng = Math.abs(m.position[1] - marker.position[1]);
      return distLat < 0.0001 && distLng < 0.0001;
    });
    
    if (!isDuplicate) {
      acc.push(marker);
    }
    
    return acc;
  }, []);

  return (
    <>
      {Array.isArray(deduplicatedMarkers) && deduplicatedMarkers.map((marker) => (
        <UserMarker 
          key={marker.id} 
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
