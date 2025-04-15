
export const getDrawingOptions = (activeTool: string | null) => ({
  rectangle: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 3,
      opacity: 1,
      fillColor: '#D3E4FD',
      fillOpacity: 0.5,
      dashArray: '5, 10'
    }
  },
  polygon: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 3,
      opacity: 1,
      fillColor: '#D3E4FD',
      fillOpacity: 0.5,
      dashArray: '5, 10'
    },
    allowIntersection: false,
    drawError: {
      color: '#e1e100',
      message: '<strong>Drawing error:</strong> Shapes cannot intersect!'
    },
    showArea: true
  },
  circle: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 3,
      opacity: 1,
      fillColor: '#D3E4FD',
      fillOpacity: 0.5,
      dashArray: '5, 10'
    },
    showRadius: true
  },
  polyline: {
    shapeOptions: {
      color: '#1EAEDB',
      weight: 3,
      opacity: 1,
      dashArray: '5, 10'
    },
    metric: true,
    feet: false,
    showLength: true
  },
  circlemarker: false,
  marker: activeTool === 'marker'
});

export const editOptions = {
  remove: true,
  edit: {
    selectedPathOptions: {
      color: '#fe57a1',
      dashArray: '5, 10'
    }
  }
};
