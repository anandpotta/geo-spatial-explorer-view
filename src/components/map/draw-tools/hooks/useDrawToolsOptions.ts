
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';

/**
 * Hook to provide drawing and editing options for Leaflet Draw
 */
export function useDrawToolsOptions(featureGroup: L.FeatureGroup) {
  // Create a properly structured edit object
  const editOptions = {
    featureGroup: featureGroup,
    edit: {
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7
      }
    },
    remove: true
  };

  const drawOptions = {
    rectangle: true,
    polygon: {
      allowIntersection: false,
      drawError: {
        color: '#e1e100',
        message: '<strong>Cannot draw that shape!</strong>'
      },
      shapeOptions: {
        color: '#3388ff',
        weight: 4,
        opacity: 0.7,
        fillOpacity: 0.2
      },
      showArea: false,
      metric: true,
      smoothFactor: 1 // Lower value for less smoothing (more accurate paths)
    },
    circle: true,
    circlemarker: false,
    marker: true,
    polyline: false
  };

  return {
    editOptions,
    drawOptions
  };
}
