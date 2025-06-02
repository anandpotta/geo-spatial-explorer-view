
import { StandaloneGeoJSON } from '@/utils/enhanced-geo-utils';
import { toast } from 'sonner';

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

// Note: This is a client-side implementation that would typically require a backend API
// For production use, you'd want to create backend endpoints that handle the actual SQL operations
export class AzureSQLService {
  private config: AzureSQLConfig;
  private apiBaseUrl: string;

  constructor(config: AzureSQLConfig, apiBaseUrl: string = '/api/azure-sql') {
    this.config = config;
    this.apiBaseUrl = apiBaseUrl;
  }

  // User-specific data operations
  async saveUserData(userId: string, userData: Partial<UserData>, username?: string): Promise<string> {
    try {
      const record = {
        userId,
        username,
        dataType: 'complete' as const,
        data: {
          ...userData,
          metadata: {
            lastUpdated: new Date().toISOString(),
            version: '1.0'
          }
        }
      };

      const response = await fetch(`${this.apiBaseUrl}/user-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.connectionString}`
        },
        body: JSON.stringify({
          tableName: this.config.tableName || 'user_geospatial_data',
          data: record
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save user data: ${response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error saving user data to Azure SQL:', error);
      throw error;
    }
  }

  async getUserData(userId: string): Promise<UserData | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/user-data/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.connectionString}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to retrieve user data: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error retrieving user data from Azure SQL:', error);
      throw error;
    }
  }

  async updateUserData(userId: string, userData: Partial<UserData>, username?: string): Promise<void> {
    try {
      // First get existing data
      const existingData = await this.getUserData(userId);
      
      // Merge with new data
      const mergedData = {
        ...existingData,
        ...userData,
        userId,
        username: username || existingData?.username,
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0'
        }
      };

      const response = await fetch(`${this.apiBaseUrl}/user-data/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.connectionString}`
        },
        body: JSON.stringify({
          tableName: this.config.tableName || 'user_geospatial_data',
          data: mergedData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update user data: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating user data in Azure SQL:', error);
      throw error;
    }
  }

  async deleteUserData(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/user-data/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.connectionString}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user data: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting user data from Azure SQL:', error);
      throw error;
    }
  }

  // Specific data type operations
  async saveUserAnnotations(userId: string, annotations: any[], username?: string): Promise<string> {
    return this.saveUserDataByType(userId, 'annotations', annotations, username);
  }

  async saveUserSvgPaths(userId: string, svgPaths: string[], username?: string): Promise<string> {
    return this.saveUserDataByType(userId, 'svgPaths', svgPaths, username);
  }

  async saveUserMarkers(userId: string, markers: any[], username?: string): Promise<string> {
    return this.saveUserDataByType(userId, 'markers', markers, username);
  }

  async saveUserLocations(userId: string, locations: any[], username?: string): Promise<string> {
    return this.saveUserDataByType(userId, 'locations', locations, username);
  }

  async saveUserDrawings(userId: string, drawings: any[], username?: string): Promise<string> {
    return this.saveUserDataByType(userId, 'drawings', drawings, username);
  }

  private async saveUserDataByType(
    userId: string, 
    dataType: 'annotations' | 'svgPaths' | 'markers' | 'locations' | 'drawings', 
    data: any, 
    username?: string
  ): Promise<string> {
    try {
      const record = {
        userId,
        username,
        dataType,
        data: {
          [dataType]: data,
          lastUpdated: new Date().toISOString()
        }
      };

      const response = await fetch(`${this.apiBaseUrl}/user-data-type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.connectionString}`
        },
        body: JSON.stringify({
          tableName: this.config.tableName || 'user_geospatial_data',
          data: record
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save user ${dataType}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error(`Error saving user ${dataType} to Azure SQL:`, error);
      throw error;
    }
  }

  // Original GeoJSON methods (keeping for backward compatibility)
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

      const response = await fetch(`${this.apiBaseUrl}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.connectionString}`
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

  async listGeoJSONRecords(limit: number = 50, offset: number = 0, userId?: string): Promise<StoredGeoJSONRecord[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(userId && { userId })
      });

      const response = await fetch(`${this.apiBaseUrl}/list?${params}`, {
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
  const service = new AzureSQLService({ connectionString });
  return await service.storeGeoJSON(geojson, name, searchLocation, userId, username);
}

export async function retrieveGeoJSONFromAzureSQL(
  id: string,
  connectionString: string
): Promise<StoredGeoJSONRecord | null> {
  const service = new AzureSQLService({ connectionString });
  return await service.retrieveGeoJSON(id);
}
