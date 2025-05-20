
import { DrawingData } from '@/utils/drawing-utils';
import { LocationMarker } from '@/utils/marker-utils';
import { saveAs } from 'file-saver';

/**
 * Converts drawing data to a GeoJSON FeatureCollection
 */
export const drawingsToGeoJSON = (drawings: DrawingData[], markers: LocationMarker[] = []) => {
  // Create a GeoJSON FeatureCollection
  const featureCollection = {
    type: "FeatureCollection",
    features: [] as any[]
  };

  // Add drawings to the feature collection
  drawings.forEach(drawing => {
    if (drawing.geoJSON) {
      // If the drawing already has GeoJSON, use it
      if (drawing.geoJSON.type === 'Feature') {
        featureCollection.features.push(drawing.geoJSON);
      } else if (drawing.geoJSON.type === 'FeatureCollection' && drawing.geoJSON.features) {
        // If it's a FeatureCollection, add all features
        featureCollection.features = featureCollection.features.concat(drawing.geoJSON.features);
      }
    }
  });

  // Convert markers to GeoJSON features and add them
  markers.forEach(marker => {
    const feature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [marker.position[1], marker.position[0]] // GeoJSON uses [lng, lat]
      },
      properties: {
        name: marker.name,
        type: marker.type,
        id: marker.id,
        createdAt: marker.createdAt
      },
      id: marker.id
    };
    featureCollection.features.push(feature);
  });

  return featureCollection;
};

/**
 * Exports GeoJSON data to a file
 */
export const exportGeoJSON = (drawings: DrawingData[], markers: LocationMarker[] = []) => {
  const geoJSON = drawingsToGeoJSON(drawings, markers);
  const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
  saveAs(blob, `map-export-${new Date().toISOString().slice(0, 10)}.geojson`);
};
