
import L from 'leaflet';

/**
 * Configuration for drawing tool options
 */
export const getDrawOptions = () => {
  return {
    rectangle: {
      shapeOptions: {
        color: '#33C3F0',
        weight: 4,
        opacity: 1,
        fillOpacity: 0.3,
        stroke: true,
        renderer: L.svg() // Force SVG renderer for rectangles
      }
    },
    polygon: {
      allowIntersection: false,
      drawError: {
        color: '#e1e100',
        message: '<strong>Cannot draw that shape!</strong>'
      },
      shapeOptions: {
        color: '#33C3F0',
        weight: 4,
        opacity: 1,
        fillOpacity: 0.3,
        stroke: true,
        lineCap: 'round',
        lineJoin: 'round',
        renderer: L.svg() // Force SVG renderer for polygons
      },
      showArea: false,
      metric: true,
      smoothFactor: 1 // Lower value for less smoothing (more accurate paths)
    },
    circle: {
      shapeOptions: {
        color: '#33C3F0',
        weight: 4,
        opacity: 1,
        fillOpacity: 0.3,
        stroke: true,
        renderer: L.svg() // Force SVG renderer for circles
      }
    },
    circlemarker: false,
    marker: true,
    polyline: false
  };
};
