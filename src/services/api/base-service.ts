
import { getConnectionStatus } from '@/utils/api-service';
import { toast } from '@/components/ui/use-toast';

export interface StorageOptions {
  showToasts?: boolean;
}

export const baseStorageService = {
  getFromStorage<T>(key: string): T[] {
    const json = localStorage.getItem(key);
    if (!json) return [];
    
    try {
      return JSON.parse(json);
    } catch (e) {
      console.error(`Failed to parse ${key} from storage`, e);
      return [];
    }
  },
  
  saveToStorage<T>(key: string, data: T[], options: StorageOptions = {}): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key} to storage`, e);
      if (options.showToasts) {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: "Could not save data to local storage",
        });
      }
    }
  }
};

export const getBackendStatus = () => {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  return { isAvailable: isOnline && isBackendAvailable };
};
