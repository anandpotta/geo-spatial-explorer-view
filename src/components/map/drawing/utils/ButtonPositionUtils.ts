
import L from 'leaflet';

/**
 * Calculate positions for control buttons based on layer type
 */
export const calculateButtonPositions = (layer: L.Layer): {
  buttonPosition: L.LatLng | null;
  uploadButtonPosition: L.LatLng | null;
  imageControlsPosition: L.LatLng | null;
} => {
  let buttonPosition = null;
  let uploadButtonPosition = null;
  let imageControlsPosition = null;
  
  try {
    if ('getLatLng' in layer) {
      // For markers
      buttonPosition = (layer as L.Marker).getLatLng();
      uploadButtonPosition = L.latLng(
        buttonPosition.lat + 0.0001,
        buttonPosition.lng
      );
      imageControlsPosition = L.latLng(
        buttonPosition.lat - 0.0001,
        buttonPosition.lng
      );
    } else if ('getBounds' in layer) {
      // For polygons, rectangles, etc.
      const bounds = (layer as any).getBounds();
      if (bounds) {
        buttonPosition = bounds.getNorthEast();
        uploadButtonPosition = L.latLng(
          bounds.getNorthEast().lat,
          bounds.getNorthEast().lng - 0.0002
        );
        imageControlsPosition = L.latLng(
          bounds.getNorthEast().lat,
          bounds.getNorthEast().lng - 0.0004
        );
      }
    } else if ('getLatLngs' in layer) {
      // For polylines or complex shapes
      const latlngs = (layer as any).getLatLngs();
      if (latlngs && latlngs.length > 0) {
        buttonPosition = Array.isArray(latlngs[0]) ? latlngs[0][0] : latlngs[0];
        uploadButtonPosition = L.latLng(
          buttonPosition.lat + 0.0001,
          buttonPosition.lng
        );
        imageControlsPosition = L.latLng(
          buttonPosition.lat - 0.0001,
          buttonPosition.lng
        );
      }
    }
  } catch (err) {
    console.error('Error calculating button positions:', err);
  }
  
  return { buttonPosition, uploadButtonPosition, imageControlsPosition };
};
