
import { AzureSQLConfig, StoredGeoJSONRecord, UserData, DataType } from './types';
import { StandaloneGeoJSON } from '@/utils/enhanced-geo-utils';

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

  async saveUserDataByType(
    userId: string, 
    dataType: DataType, 
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
}
