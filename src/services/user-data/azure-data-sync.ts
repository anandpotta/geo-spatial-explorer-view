
import { AzureSQLService, UserData } from '../azure-sql-service';
import { 
  saveUserGeospatialData, 
  getUserGeospatialData, 
  updateUserGeospatialData 
} from '../azure-sql-service';
import { toast } from 'sonner';
import { UserSession } from './types';
import { LocalStorageManager } from './local-storage-manager';

export class AzureDataSync {
  private azureService: AzureSQLService | null = null;
  private localStorageManager: LocalStorageManager;

  constructor() {
    this.localStorageManager = new LocalStorageManager();
  }

  setAzureService(session: UserSession): void {
    this.azureService = new AzureSQLService({ connectionString: session.connectionString });
  }

  async loadUserDataFromAzure(session: UserSession): Promise<boolean> {
    if (!session || !this.azureService) {
      throw new Error('No active user session');
    }

    try {
      const userData = await getUserGeospatialData(
        session.userId, 
        session.connectionString
      );

      if (userData) {
        this.localStorageManager.loadDataToLocalStorage(userData);
        this.localStorageManager.dispatchDataUpdateEvents();

        // Notify components of data update
        window.dispatchEvent(new CustomEvent('userDataLoaded', { 
          detail: { userId: session.userId, userData } 
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

  async saveUserDataToAzure(session: UserSession): Promise<boolean> {
    if (!session || !this.azureService) {
      throw new Error('No active user session');
    }

    try {
      const userData = this.localStorageManager.collectLocalData(session.userId, session.username);

      await updateUserGeospatialData(
        session.userId,
        userData,
        session.connectionString,
        session.username
      );

      toast.success('User data saved to Azure SQL');
      return true;
    } catch (error) {
      console.error('Error saving user data to Azure:', error);
      toast.error('Failed to save user data to Azure SQL');
      return false;
    }
  }
}
