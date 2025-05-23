
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
        fillColor: '#33c3f061',
        fillOpacity: 1,
        stroke: true,
        renderer: L.svg() // Explicitly use SVG renderer
      },
      showArea: false, // Disable area calculation to prevent the error
      metric: true
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
        fillColor: '#33c3f061',
        fillOpacity: 1,
        stroke: true,
        lineCap: 'round',
        lineJoin: 'round',
        renderer: L.svg() // Explicitly use SVG renderer
      },
      showArea: false,
      metric: true,
      smoothFactor: 1
    },
    circle: {
      shapeOptions: {
        color: '#33C3F0',
        weight: 4,
        opacity: 1,
        fillColor: '#33c3f061',
        fillOpacity: 1,
        stroke: true,
        renderer: L.svg() // Explicitly use SVG renderer for circles
      }
    },
    circlemarker: false,
    marker: true,
    polyline: false
  };
};

// Add L import to the file
import L from 'leaflet';
