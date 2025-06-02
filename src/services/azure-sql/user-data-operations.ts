
import { AzureSQLService } from './core-service';
import { AzureSQLConfig, UserData, DataType } from './types';

export class UserDataOperations {
  private service: AzureSQLService;

  constructor(config: AzureSQLConfig) {
    this.service = new AzureSQLService(config);
  }

  // Specific data type operations
  async saveUserAnnotations(userId: string, annotations: any[], username?: string): Promise<string> {
    return this.service.saveUserDataByType(userId, 'annotations', annotations, username);
  }

  async saveUserSvgPaths(userId: string, svgPaths: string[], username?: string): Promise<string> {
    return this.service.saveUserDataByType(userId, 'svgPaths', svgPaths, username);
  }

  async saveUserMarkers(userId: string, markers: any[], username?: string): Promise<string> {
    return this.service.saveUserDataByType(userId, 'markers', markers, username);
  }

  async saveUserLocations(userId: string, locations: any[], username?: string): Promise<string> {
    return this.service.saveUserDataByType(userId, 'locations', locations, username);
  }

  async saveUserDrawings(userId: string, drawings: any[], username?: string): Promise<string> {
    return this.service.saveUserDataByType(userId, 'drawings', drawings, username);
  }
}
