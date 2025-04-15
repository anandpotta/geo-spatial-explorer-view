
export const getDrawingOptions = (activeTool: string | null) => ({
  polyline: {
    shapeOptions: {
      color: '#3388ff',
      weight: 5,
      opacity: 1.0,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
      dashArray: null
    },
    metric: true,
    feet: false,
    showLength: true,
    zIndexOffset: 2000
  },
  rectangle: {
    shapeOptions: {
      color: '#3388ff',
      weight: 4,
      opacity: 1.0,
      fill: true,
      fillColor: '#3388ff',
      fillOpacity: 0.3,
      clickable: true,
      dashArray: null
    },
    // Removed showArea property to prevent the "type is not defined" error
    metric: true
  },
  polygon: {
    shapeOptions: {
      color: '#3388ff',
      weight: 4,
      opacity: 1.0,
      fill: true,
      fillColor: '#3388ff',
      fillOpacity: 0.3,
      clickable: true,
      dashArray: null
    },
    allowIntersection: false,
    // Removed showArea and showLength properties to prevent errors
    metric: true,
    drawError: {
      color: '#FF0000',
      timeout: 1000,
      message: '<strong>Error:</strong> Shapes cannot intersect!'
    },
    zIndexOffset: 2000
  },
  circle: {
    shapeOptions: {
      color: '#3388ff',
      weight: 4,
      opacity: 1.0,
      fillColor: '#3388ff',
      fillOpacity: 0.3,
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
