
import { DrawingData } from '@/utils/drawings/types';
import { LocationMarker } from '@/utils/markers/types';

/**
 * Generates a GeoJSON FeatureCollection from drawings and markers
 */
export function generateGeoJSON(drawings: DrawingData[], markers: LocationMarker[]) {
  // Create a GeoJSON FeatureCollection
  const featureCollection = {
    type: "FeatureCollection",
    features: [] as any[]
  };
  
  // Add drawings to the collection
  if (drawings && drawings.length > 0) {
    drawings.forEach(drawing => {
      if (drawing.geoJSON) {
        // If drawing already has GeoJSON, use it
        const feature = {
          ...drawing.geoJSON,
          properties: {
            ...drawing.properties,
            id: drawing.id,
            drawingType: drawing.type,
            name: drawing.properties.name || `${drawing.type}-${drawing.id.substring(0, 8)}`
          }
        };
        featureCollection.features.push(feature);
      }
    });
  }

  // Add markers to the collection
  if (markers && markers.length > 0) {
    markers.forEach(marker => {
      const [lat, lng] = marker.position;
      const feature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat] // GeoJSON uses [longitude, latitude]
        },
        properties: {
          id: marker.id,
          name: marker.name,
          markerType: marker.type,
          createdAt: marker.createdAt
        }
      };
      featureCollection.features.push(feature);
    });
  }

  return featureCollection;
}

/**
 * Downloads GeoJSON data as a file
 */
export function downloadGeoJSON(geoJSON: any, filename: string = 'map-annotations.geojson') {
  // Convert to JSON string
  const dataStr = JSON.stringify(geoJSON, null, 2);
  
  // Create a Blob with the data
  const blob = new Blob([dataStr], { type: 'application/geo+json' });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  
  // Append to body, trigger download and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the URL object
  URL.revokeObjectURL(url);
}
