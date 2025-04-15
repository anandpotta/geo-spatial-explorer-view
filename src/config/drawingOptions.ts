
export const getDrawingOptions = (activeTool: string | null) => ({
  rectangle: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 3,
      opacity: 1,
      fillColor: '#D3E4FD',
      fillOpacity: 0.5
    },
    showArea: true,
    metric: true,
    feet: false
  },
  polygon: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 3,
      opacity: 1,
      fillColor: '#D3E4FD',
      fillOpacity: 0.5
    },
    allowIntersection: false,
    showArea: true,
    metric: true,
    feet: false,
    drawError: {
      color: '#e1e100',
      message: '<strong>Drawing error:</strong> Shapes cannot intersect!'
    }
  },
  circle: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 3,
      opacity: 1,
      fillColor: '#D3E4FD',
      fillOpacity: 0.5
    },
    showRadius: true,
    metric: true,
    feet: false
  },
  polyline: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 3,
      opacity: 1
    },
    metric: true,
    feet: false,
    showLength: true
  },
  circlemarker: false,
  marker: activeTool === 'marker'
});

export const editOptions = {
  edit: {
    selectedPathOptions: {
      color: '#fe57a1',
      opacity: 0.6,
      dashArray: '10, 10',
      fill: true,
      fillColor: '#fe57a1',
      fillOpacity: 0.1,
    }
  },
  remove: true
};
