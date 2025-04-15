
export const getDrawingOptions = (activeTool: string | null) => ({
  polyline: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 4,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round'
    },
    metric: true,
    feet: false,
    showLength: true,
    zIndexOffset: 2000  // Ensure lines appear above other elements
  },
  rectangle: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 4,
      opacity: 0.8,
      fillColor: '#D3E4FD',
      fillOpacity: 0.5,
      clickable: true
    },
    showArea: true,
    metric: true
  },
  polygon: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 4,
      opacity: 0.8,
      fillColor: '#D3E4FD',
      fillOpacity: 0.5,
      clickable: true
    },
    allowIntersection: false,
    showArea: true,
    showLength: true,
    metric: true,
    drawError: {
      color: '#e1e100',
      timeout: 1000,
      message: '<strong>Error:</strong> Shapes cannot intersect!'
    },
    zIndexOffset: 2000  // Ensure lines appear above other elements
  },
  circle: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 4,
      opacity: 0.8,
      fillColor: '#D3E4FD',
      fillOpacity: 0.5,
      clickable: true
    },
    showRadius: true,
    metric: true
  },
  marker: activeTool === 'marker'
});

export const editOptions = {
  edit: {
    featureGroup: null, // This will be set dynamically
    selectedPathOptions: {
      color: '#fe57a1',
      opacity: 0.8,
      dashArray: '10, 10',
      fill: true,
      fillColor: '#fe57a1',
      fillOpacity: 0.1,
    }
  },
  remove: true
};
