
import { 
  AzureSQLService, 
  UserData, 
  saveUserGeospatialData, 
  getUserGeospatialData, 
  updateUserGeospatialData 
} from './azure-sql-service';
import { toast } from 'sonner';

export interface UserSession {
  userId: string;
  username?: string;
  connectionString: string;
  autoSync?: boolean;
}

export class UserDataService {
  private session: UserSession | null = null;
  private azureService: AzureSQLService | null = null;

  constructor() {
    // Try to restore session from localStorage
    this.restoreSession();
  }

  // Session management
  setUserSession(session: UserSession): void {
    this.session = session;
    this.azureService = new AzureSQLService({ connectionString: session.connectionString });
    
    // Save session to localStorage for persistence
    localStorage.setItem('userSession', JSON.stringify({
      userId: session.userId,
      username: session.username,
      autoSync: session.autoSync
      // Note: We don't store connectionString in localStorage for security
    }));
  }

  getCurrentSession(): UserSession | null {
    return this.session;
  }

  clearSession(): void {
    this.session = null;
    this.azureService = null;
    localStorage.removeItem('userSession');
  }

  private restoreSession(): void {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Note: connectionString needs to be provided again for security
        console.log('Found saved session for user:', session.userId);
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('userSession');
      }
    }
  }

  // Data synchronization methods
  async loadUserDataFromAzure(): Promise<boolean> {
    if (!this.session || !this.azureService) {
      throw new Error('No active user session');
    }

    try {
      const userData = await getUserGeospatialData(
        this.session.userId, 
        this.session.connectionString
      );

      if (userData) {
        // Load data into localStorage
        if (userData.annotations) {
          localStorage.setItem('savedDrawings', JSON.stringify(userData.annotations));
        }
        
        if (userData.markers) {
          localStorage.setItem('savedMarkers', JSON.stringify(userData.markers));
        }
        
        if (userData.locations) {
          localStorage.setItem('savedLocations', JSON.stringify(userData.locations));
        }
        
        if (userData.svgPaths) {
          localStorage.setItem('svgPaths', JSON.stringify({ [this.session.userId]: userData.svgPaths }));
        }

        if (userData.drawings) {
          localStorage.setItem('savedDrawings', JSON.stringify(userData.drawings));
        }

        // Notify components of data update
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('markersUpdated'));
        window.dispatchEvent(new Event('drawingsUpdated'));
        window.dispatchEvent(new CustomEvent('userDataLoaded', { 
          detail: { userId: this.session.userId, userData } 
        }));

        toast.success('User data loaded successfully');
        return true;
      } else {
        console.log('No existing data found for user');
        return false;
      }
    } catch (error) {
      console.error('Error loading user data from Azure:', error);
      toast.error('Failed to load user data from Azure SQL');
      return false;
    }
  }

  async saveUserDataToAzure(): Promise<boolean> {
    if (!this.session || !this.azureService) {
      throw new Error('No active user session');
    }

    try {
      // Collect current data from localStorage
      const userData: Partial<UserData> = {
        userId: this.session.userId,
        username: this.session.username,
        annotations: this.getLocalData('savedDrawings'),
        markers: this.getLocalData('savedMarkers'),
        locations: this.getLocalData('savedLocations'),
        drawings: this.getLocalData('savedDrawings'),
        svgPaths: this.getLocalSvgPaths()
      };

      await updateUserGeospatialData(
        this.session.userId,
        userData,
        this.session.connectionString,
        this.session.username
      );

      toast.success('User data saved to Azure SQL');
      return true;
    } catch (error) {
      console.error('Error saving user data to Azure:', error);
      toast.error('Failed to save user data to Azure SQL');
      return false;
    }
  }

  private getLocalData(key: string): any[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private getLocalSvgPaths(): string[] {
    try {
      const pathsData = localStorage.getItem('svgPaths');
      if (pathsData && this.session) {
        const parsedData = JSON.parse(pathsData);
        return parsedData[this.session.userId] || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  // Auto-sync functionality
  enableAutoSync(): void {
    if (!this.session) return;

    // Listen for data changes and auto-save
    const handleDataChange = () => {
      if (this.session?.autoSync) {
        // Debounce saves to avoid too frequent requests
        this.debouncedSave();
      }
    };

    window.addEventListener('storage', handleDataChange);
    window.addEventListener('markersUpdated', handleDataChange);
    window.addEventListener('drawingsUpdated', handleDataChange);
    window.addEventListener('svgPathsUpdated', handleDataChange);
  }

  private saveTimeout: number | null = null;
  private debouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = window.setTimeout(() => {
      this.saveUserDataToAzure().catch(console.error);
    }, 2000); // Save after 2 seconds of inactivity
  }
}

// Global instance for easy access
export const userDataService = new UserDataService();

// Utility functions for easy integration
export function setUserSession(userId: string, connectionString: string, username?: string, autoSync: boolean = true): void {
  userDataService.setUserSession({ userId, username, connectionString, autoSync });
  if (autoSync) {
    userDataService.enableAutoSync();
  }
}

export function loadUserData(): Promise<boolean> {
  return userDataService.loadUserDataFromAzure();
}

export function saveUserData(): Promise<boolean> {
  return userDataService.saveUserDataToAzure();
}

export function clearUserSession(): void {
  userDataService.clearSession();
}

export function getCurrentUser(): { userId: string; username?: string } | null {
  const session = userDataService.getCurrentSession();
  return session ? { userId: session.userId, username: session.username } : null;
}
