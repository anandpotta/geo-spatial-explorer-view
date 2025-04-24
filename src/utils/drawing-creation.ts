
import { v4 as uuidv4 } from 'uuid';
import { saveDrawing } from './drawing-utils';
import { toast } from 'sonner';
import { getCoordinatesFromLayer } from './leaflet-drawing-config';

export const handleDrawingCreated = (e: any, wasRecentlyCleared: React.MutableRefObject<boolean>, onCreated: (shape: any) => void) => {
  const { layerType, layer } = e;
  const id = uuidv4();
  
  if (wasRecentlyCleared.current) {
    console.log('Skipping save because drawings were recently cleared');
    return;
  }
  
  if (layerType === 'marker' && 'getLatLng' in layer) {
    const markerLayer = layer as L.Marker;
    const { lat, lng } = markerLayer.getLatLng();
    onCreated({ type: 'marker', position: [lat, lng], id });
    return;
  }

  const layerWithOptions = layer as L.Path;
  const options = layerWithOptions.options || {};
  
  layer.drawingId = id;
  
  const drawingData = {
    id,
    type: layerType,
    coordinates: getCoordinatesFromLayer(layer, layerType),
    geoJSON: layer.toGeoJSON(),
    options: {
      color: options.color,
      weight: options.weight,
      opacity: options.opacity,
      fillOpacity: options.fillOpacity
    },
    properties: {
      name: `New ${layerType}`,
      color: options.color || '#3388ff',
      createdAt: new Date()
    }
  };
  
  saveDrawing(drawingData);
  toast.success(`${layerType} created successfully`);
  onCreated({ type: layerType, layer, geoJSON: layer.toGeoJSON(), id });
};
