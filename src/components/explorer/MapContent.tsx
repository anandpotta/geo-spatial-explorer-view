import { Location } from '@/utils/geo-utils';
import MapContentContainer from './map/MapContentContainer';
import { SearchBarProvider } from '@/contexts/SearchBarContext';

interface MapContentProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
}

const MapContent = (props: MapContentProps) => {
  return (
    <SearchBarProvider>
      <MapContentContainer {...props} />
    </SearchBarProvider>
  );
};

export default MapContent;
