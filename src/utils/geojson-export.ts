
import { LocationMarker, DrawingData } from '@/utils/geo-utils';

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: {
    name: string;
    type: 'marker' | 'drawing';
    markerType?: 'pin' | 'area' | 'building';
    color?: string;
    createdAt?: string;
    [key: string]: any;
  };
}

export interface GeoJSONExport {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export function generateGeoJSON(): GeoJSONExport {
  const features: GeoJSONFeature[] = [];
  
  // Get saved markers from localStorage
  const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]') as LocationMarker[];
  
  // Convert markers to GeoJSON features
  savedMarkers.forEach(marker => {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [marker.position[1], marker.position[0]] // [lng, lat] for GeoJSON
      },
      properties: {
        name: marker.name,
        type: 'marker',
        markerType: marker.type,
        createdAt: marker.createdAt instanceof Date ? marker.createdAt.toISOString() : (marker.createdAt || new Date().toISOString())
      }
    });
  });
  
  // Get saved drawings from localStorage
  const savedDrawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]') as DrawingData[];
  
  // Convert drawings to GeoJSON features
  savedDrawings.forEach(drawing => {
    if (drawing.geoJSON && drawing.geoJSON.geometry) {
      features.push({
        type: 'Feature',
        geometry: drawing.geoJSON.geometry,
        properties: {
          name: drawing.properties?.name || `Unnamed ${drawing.type}`,
          type: 'drawing',
          color: drawing.properties?.color,
          createdAt: drawing.properties?.createdAt instanceof Date ? drawing.properties.createdAt.toISOString() : (drawing.properties?.createdAt || new Date().toISOString()),
          drawingType: drawing.type
        }
      });
    }
  });
  
  return {
    type: 'FeatureCollection',
    features
  };
}

export function downloadGeoJSON(filename: string = 'map-annotations.geojson') {
  const geoJSON = generateGeoJSON();
  const dataStr = JSON.stringify(geoJSON, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
