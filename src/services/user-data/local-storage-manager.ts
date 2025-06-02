
import { UserData } from '../azure-sql/types';

export class LocalStorageManager {
  getLocalData(key: string): any[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getLocalSvgPaths(userId: string): string[] {
    try {
      const pathsData = localStorage.getItem('svgPaths');
      if (pathsData) {
        const parsedData = JSON.parse(pathsData);
        return parsedData[userId] || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  loadDataToLocalStorage(userData: UserData): void {
    if (userData.annotations) {
      localStorage.setItem('savedDrawings', JSON.stringify(userData.annotations));
    }
    
    if (userData.markers) {
      localStorage.setItem('savedMarkers', JSON.stringify(userData.markers));
    }
    
    if (userData.locations) {
      localStorage.setItem('savedLocations', JSON.stringify(userData.locations));
    }
    
    if (userData.svgPaths && userData.userId) {
      localStorage.setItem('svgPaths', JSON.stringify({ [userData.userId]: userData.svgPaths }));
    }

    if (userData.drawings) {
      localStorage.setItem('savedDrawings', JSON.stringify(userData.drawings));
    }
  }

  collectLocalData(userId: string, username?: string): Partial<UserData> {
    return {
      userId,
      username,
      annotations: this.getLocalData('savedDrawings'),
      markers: this.getLocalData('savedMarkers'),
      locations: this.getLocalData('savedLocations'),
      drawings: this.getLocalData('savedDrawings'),
      svgPaths: this.getLocalSvgPaths(userId)
    };
  }

  dispatchDataUpdateEvents(): void {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('drawingsUpdated'));
  }
}
