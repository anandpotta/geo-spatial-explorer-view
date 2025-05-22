
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
        stroke: true
      },
      metric: true,
      showArea: true
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
        lineJoin: 'round'
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
        stroke: true
      }
    },
    circlemarker: false,
    marker: true,
    polyline: false
  };
};
