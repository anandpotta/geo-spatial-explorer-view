
import { StandaloneGeoJSON } from '@/utils/enhanced-geo-utils';

export interface AzureSQLConfig {
  connectionString: string;
  tableName?: string;
}

export interface UserSession {
  userId: string;
  username?: string;
  connectionString: string;
  autoSync?: boolean;
}

export interface UserData {
  userId: string;
  username?: string;
  annotations: any[];
  svgPaths: string[];
  markers: any[];
  locations: any[];
  drawings: any[];
  metadata?: {
    lastUpdated: string;
    version: string;
  };
}

export interface StoredGeoJSONRecord {
  id: string;
  userId: string;
  username?: string;
  name?: string;
  geojson: StandaloneGeoJSON;
  searchLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StoredUserDataRecord {
  id: string;
  userId: string;
  username?: string;
  dataType: 'annotations' | 'svgPaths' | 'markers' | 'locations' | 'drawings' | 'complete';
  data: any;
  createdAt: string;
  updatedAt: string;
}

export type DataType = 'annotations' | 'svgPaths' | 'markers' | 'locations' | 'drawings';
