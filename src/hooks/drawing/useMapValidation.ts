
import L from 'leaflet';

export function useMapValidation() {
  /**
   * Check if the map associated with a layer is valid
   */
  const checkMapValidity = (layer: L.Layer): boolean => {
    try {
      // Try to get the map from the layer
      const map = (layer as any)._map;
      
      // If no map, try to get it from the feature group
      if (!map && 'getLayers' in layer) {
        const layers = (layer as L.FeatureGroup).getLayers();
        if (layers.length > 0) {
          const firstLayerMap = (layers[0] as any)._map;
          if (firstLayerMap) {
            return isMapValid(firstLayerMap);
          }
        }
        return false;
      }
      
      return isMapValid(map);
    } catch (err) {
      console.error('Error checking map validity:', err);
      return false;
    }
  };
  
  /**
   * Check if a map instance is valid
   */
  const isMapValid = (map: any): boolean => {
    if (!map) return false;
    
    try {
      // Check if the map has a valid container
      const container = map.getContainer();
      if (!container || !document.body.contains(container)) {
        return false;
      }
      
      // Check if the map has been initialized
      if (!map._loaded) {
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error in isMapValid:', err);
      return false;
    }
  };
  
  return { checkMapValidity, isMapValid };
}
