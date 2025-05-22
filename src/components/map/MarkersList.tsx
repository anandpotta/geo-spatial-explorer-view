
import { LocationMarker } from '@/utils/geo-utils';
import UserMarker from './UserMarker';
import TempMarker from './TempMarker';

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
  // Safely render markers with proper key management
  return (
    <>
      {Array.isArray(markers) && markers.map((marker) => (
        <UserMarker 
          key={`user-marker-${marker.id}`} 
          marker={marker} 
          onDelete={onDeleteMarker} 
        />
      ))}
      
      {tempMarker && Array.isArray(tempMarker) && (
        <TempMarker 
          key={`temp-marker-${tempMarker[0]}-${tempMarker[1]}`}
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

export default MarkersList;
