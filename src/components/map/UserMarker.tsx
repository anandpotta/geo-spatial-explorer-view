
import { Marker } from 'react-leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';
import { useBuildingIcon, useAreaIcon, usePinIcon } from '@/hooks/useMarkerIcons';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

const UserMarker = ({ marker, onDelete, onRename }: UserMarkerProps) => {
  const buildingIcon = useBuildingIcon();
  const areaIcon = useAreaIcon();
  const pinIcon = usePinIcon();
  
  const getIcon = () => {
    switch (marker.type) {
      case 'building':
        return buildingIcon;
      case 'area':
        return areaIcon;
      case 'pin':
      default:
        return pinIcon;
    }
  };

  return (
    <Marker 
      position={marker.position} 
      icon={getIcon()}
      key={`marker-${marker.id}`}
      eventHandlers={{
        add: (e) => {
          // Add a data attribute to help with cleanup
          const element = e.target.getElement();
          if (element) {
            element.setAttribute('data-marker-id', `marker-${marker.id}`);
          }
        }
      }}
    >
      <MarkerPopup marker={marker} onDelete={onDelete} onRename={onRename} />
    </Marker>
  );
};

export default UserMarker;
