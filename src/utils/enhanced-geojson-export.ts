
import { StandaloneGeoJSON, StandaloneGeoJSONFeature } from './enhanced-geo-utils';

export interface EnhancedGeoJSONOptions {
  searchLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
  };
  includeSearchMetadata?: boolean;
  filename?: string;
}

export function generateEnhancedGeoJSON(options: EnhancedGeoJSONOptions = {}): StandaloneGeoJSON {
  const { searchLocation, includeSearchMetadata = true } = options;
  
  // Get saved markers and drawings - no user filtering for standalone
  const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
  const savedDrawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]');
  
  const features: StandaloneGeoJSONFeature[] = [];
  const timestamp = new Date().toISOString();

  // Process markers
  savedMarkers.forEach((marker: any) => {
    const feature: StandaloneGeoJSONFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [marker.position[1], marker.position[0]] // [lng, lat]
      },
      properties: {
        id: marker.id,
        name: marker.name,
        type: 'marker',
        markerType: marker.type,
        createdAt: marker.createdAt || timestamp,
        ...(includeSearchMetadata && searchLocation && {
          searchLocation: {
            latitude: searchLocation.latitude,
            longitude: searchLocation.longitude,
            searchString: searchLocation.searchString,
            timestamp
          }
        })
      }
    };
    features.push(feature);
  });

  // Process drawings
  savedDrawings.forEach((drawing: any) => {
    if (drawing.geoJSON && drawing.geoJSON.geometry) {
      const feature: StandaloneGeoJSONFeature = {
        type: 'Feature',
        geometry: drawing.geoJSON.geometry,
        properties: {
          id: drawing.id,
          name: drawing.properties?.name || `Drawing ${drawing.type}`,
          type: 'drawing',
          drawingType: drawing.type,
          createdAt: drawing.properties?.createdAt || timestamp,
          ...(includeSearchMetadata && searchLocation && {
            searchLocation: {
              latitude: searchLocation.latitude,
              longitude: searchLocation.longitude,
              searchString: searchLocation.searchString,
              timestamp
            }
          }),
          ...(drawing.properties || {})
        }
      };
      features.push(feature);
    }
  });

  const geoJSON: StandaloneGeoJSON = {
    type: 'FeatureCollection',
    features,
    ...(includeSearchMetadata && {
      metadata: {
        ...(searchLocation && {
          searchLocation: {
            latitude: searchLocation.latitude,
            longitude: searchLocation.longitude,
            searchString: searchLocation.searchString,
            timestamp
          }
        }),
        exportedAt: timestamp,
        totalFeatures: features.length
      }
    })
  };

  return geoJSON;
}

export function downloadEnhancedGeoJSON(options: EnhancedGeoJSONOptions = {}) {
  const { filename = 'enhanced-geospatial-data.geojson' } = options;
  
  try {
    const geoJSON = generateEnhancedGeoJSON(options);
    const dataStr = JSON.stringify(geoJSON, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/geo+json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('Enhanced GeoJSON downloaded successfully');
    return geoJSON;
  } catch (error) {
    console.error('Error downloading enhanced GeoJSON:', error);
    throw error;
  }
}

export function getEnhancedGeoJSONString(options: EnhancedGeoJSONOptions = {}): string {
  const geoJSON = generateEnhancedGeoJSON(options);
  return JSON.stringify(geoJSON, null, 2);
}
