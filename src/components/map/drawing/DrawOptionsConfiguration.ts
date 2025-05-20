
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
        renderer: L.svg(), // Force SVG renderer for rectangles
        lineCap: 'round',  // Add round line caps for rectangles too
        lineJoin: 'round',  // Add round line joins for rectangles too
        metric: true, // Use metric measurements
        showArea: true // Show area while drawing
      }
    },
    polygon: {
      allowIntersection: false, // Restrict to simple polygons
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
      showArea: true, // Show area measurement while drawing
      metric: true,  // Use metric units
      smoothFactor: 1, // Lower value for less smoothing (more accurate paths)
      // Enhance guide line visibility
      guideLayers: true,
      guidelineDistance: 10,
      guidelineOptions: {
        color: '#33C3F0', 
        weight: 2,
        opacity: 1,
        dashArray: '5, 5'
      },
      // Fix for vertex markers
      markerOptions: {
        icon: L.icon({
          iconUrl: 'path/to/marker-icon.png',
          iconSize: [10, 10],
          iconAnchor: [5, 5]
        }),
        zIndexOffset: 2000 // Make sure these are on top
      }
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
    // Disable marker tool to avoid confusion with polygon vertices
    circlemarker: false,
    marker: false,
    polyline: false
  };
};
