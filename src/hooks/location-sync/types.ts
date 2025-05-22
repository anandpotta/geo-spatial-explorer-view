
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';

export interface LocationSyncConfig {
  map: L.Map | null;
  selectedLocation?: Location;
  isMapReady?: boolean;
}

export interface LocationSyncCallbacks {
  onFlyStart?: () => void;
  onFlyComplete?: () => void;
  onMarkerAdded?: () => void;
  onError?: (error: Error) => void;
}
