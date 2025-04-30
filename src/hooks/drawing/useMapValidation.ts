
import { toast } from 'sonner';
import L from 'leaflet';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';

export function useMapValidation() {
  const checkMapValidity = (featureGroup: L.FeatureGroup) => {
    // Check if the feature group is attached to a valid map
    try {
      const map = getMapFromLayer(featureGroup);
      if (!map || !(map as any)._loaded) {
        console.warn("Map is not fully loaded, cannot proceed");
        toast.error("Map view is not ready. Please try again in a moment.");
        return false;
      }

      // Check if map container is valid
      if (!map.getContainer() || !document.body.contains(map.getContainer())) {
        console.warn("Map container is not in DOM, cannot proceed");
        toast.error("Map view is not available. Please refresh the page.");
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error checking map validity:', err);
      toast.error("Could not validate map state. Please refresh the page.");
      return false;
    }
  };

  return { checkMapValidity };
}
