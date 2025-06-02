
import { AzureSQLService } from './core-service';
import { AzureSQLConfig, StoredGeoJSONRecord } from './types';
import { StandaloneGeoJSON } from '@/utils/enhanced-geo-utils';

export class GeoJSONOperations {
  private service: AzureSQLService;

  constructor(config: AzureSQLConfig) {
    this.service = new AzureSQLService(config);
  }

  async storeGeoJSON(
    geojson: StandaloneGeoJSON,
    name?: string,
    searchLocation?: {
      latitude: number;
      longitude: number;
      searchString?: string;
    },
    userId?: string,
    username?: string
  ): Promise<string> {
    try {
      const record: Omit<StoredGeoJSONRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: userId || 'anonymous',
        username,
        name: name || `GeoJSON-${new Date().toISOString()}`,
        geojson,
        searchLocation: searchLocation ? {
          ...searchLocation,
          timestamp: new Date().toISOString()
        } : undefined
      };

      const response = await fetch(`${this.service['apiBaseUrl']}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.service['config'].connectionString}`
        },
        body: JSON.stringify({
          tableName: this.service['config'].tableName || 'geojson_data',
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
      const response = await fetch(`${this.service['apiBaseUrl']}/retrieve/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.service['config'].connectionString}`
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

  async listGeoJSONRecords(limit: number = 50, offset: number = 0, userId?: string): Promise<StoredGeoJSONRecord[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(userId && { userId })
      });

      const response = await fetch(`${this.service['apiBaseUrl']}/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.service['config'].connectionString}`
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
      const response = await fetch(`${this.service['apiBaseUrl']}/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.service['config'].connectionString}`
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
