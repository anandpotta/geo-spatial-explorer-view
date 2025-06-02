
import { StandaloneGeoJSON } from '@/utils/enhanced-geo-utils';
import { toast } from 'sonner';

export interface AzureSQLConfig {
  connectionString: string;
  tableName?: string;
}

export interface StoredGeoJSONRecord {
  id: string;
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

// Note: This is a client-side implementation that would typically require a backend API
// For production use, you'd want to create backend endpoints that handle the actual SQL operations
export class AzureSQLService {
  private config: AzureSQLConfig;
  private apiBaseUrl: string;

  constructor(config: AzureSQLConfig, apiBaseUrl: string = '/api/azure-sql') {
    this.config = config;
    this.apiBaseUrl = apiBaseUrl;
  }

  async storeGeoJSON(
    geojson: StandaloneGeoJSON,
    name?: string,
    searchLocation?: {
      latitude: number;
      longitude: number;
      searchString?: string;
    }
  ): Promise<string> {
    try {
      const record: Omit<StoredGeoJSONRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name || `GeoJSON-${new Date().toISOString()}`,
        geojson,
        searchLocation: searchLocation ? {
          ...searchLocation,
          timestamp: new Date().toISOString()
        } : undefined
      };

      const response = await fetch(`${this.apiBaseUrl}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.connectionString}` // This would be handled differently in production
        },
        body: JSON.stringify({
          tableName: this.config.tableName || 'geojson_data',
          data: record
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to store GeoJSON: ${response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error storing GeoJSON to Azure SQL:', error);
      throw error;
    }
  }

  async retrieveGeoJSON(id: string): Promise<StoredGeoJSONRecord | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/retrieve/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.config.connectionString}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to retrieve GeoJSON: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error retrieving GeoJSON from Azure SQL:', error);
      throw error;
    }
  }

  async listGeoJSONRecords(limit: number = 50, offset: number = 0): Promise<StoredGeoJSONRecord[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/list?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${this.config.connectionString}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list GeoJSON records: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing GeoJSON records from Azure SQL:', error);
      throw error;
    }
  }

  async deleteGeoJSON(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.connectionString}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete GeoJSON: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting GeoJSON from Azure SQL:', error);
      throw error;
    }
  }
}

// Utility functions for easier usage
export async function storeGeoJSONToAzureSQL(
  geojson: StandaloneGeoJSON,
  connectionString: string,
  name?: string,
  searchLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
  }
): Promise<string> {
  const service = new AzureSQLService({ connectionString });
  return await service.storeGeoJSON(geojson, name, searchLocation);
}

export async function retrieveGeoJSONFromAzureSQL(
  id: string,
  connectionString: string
): Promise<StoredGeoJSONRecord | null> {
  const service = new AzureSQLService({ connectionString });
  return await service.retrieveGeoJSON(id);
}
