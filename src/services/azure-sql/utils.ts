import { AzureSQLService } from './core-service';
import { GeoJSONOperations } from './geojson-operations';
import { UserData, AzureSQLConfig } from './types';
import { StandaloneGeoJSON } from '@/utils/enhanced-geo-utils';

// Enhanced utility functions for RBAC usage
export async function saveUserGeospatialData(
  userId: string,
  userData: Partial<UserData>,
  connectionString: string,
  username?: string
): Promise<string> {
  const service = new AzureSQLService({ connectionString });
  return await service.saveUserData(userId, userData, username);
}

export async function getUserGeospatialData(
  userId: string,
  connectionString: string
): Promise<UserData | null> {
  const service = new AzureSQLService({ connectionString });
  return await service.getUserData(userId);
}

export async function updateUserGeospatialData(
  userId: string,
  userData: Partial<UserData>,
  connectionString: string,
  username?: string
): Promise<void> {
  const service = new AzureSQLService({ connectionString });
  return await service.updateUserData(userId, userData, username);
}

// Original utility functions (keeping for backward compatibility)
export async function storeGeoJSONToAzureSQL(
  geojson: StandaloneGeoJSON,
  connectionString: string,
  name?: string,
  searchLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
  },
  userId?: string,
  username?: string
): Promise<string> {
  const geoJsonOps = new GeoJSONOperations({ connectionString });
  return await geoJsonOps.storeGeoJSON(geojson, name, searchLocation, userId, username);
}

export async function retrieveGeoJSONFromAzureSQL(
  id: string,
  connectionString: string
) {
  const geoJsonOps = new GeoJSONOperations({ connectionString });
  return await geoJsonOps.retrieveGeoJSON(id);
}
