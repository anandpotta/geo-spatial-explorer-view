
import { LocationMarker } from '@/utils/marker-utils';

declare global {
  interface Window {
    handleSavedLocationSelect?: (position: [number, number]) => void;
    featureGroup?: L.FeatureGroup;
  }
}

export {};
