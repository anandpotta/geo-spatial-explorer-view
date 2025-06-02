
import React, { useCallback } from 'react';
import { loadUserData, saveUserData, getCurrentUser } from '../../../services/user-data-service';
import { toast } from 'sonner';

interface AzureControlsProps {
  userSession?: {
    userId: string;
    username?: string;
    connectionString: string;
    autoSync?: boolean;
  };
  onDataSync?: (success: boolean, operation: 'load' | 'save') => void;
}

export const AzureControls: React.FC<AzureControlsProps> = ({ 
  userSession, 
  onDataSync 
}) => {
  const saveToAzure = useCallback(async () => {
    if (!userSession) {
      toast.error('No user session configured');
      return false;
    }
    
    try {
      const success = await saveUserData();
      if (onDataSync) {
        onDataSync(success, 'save');
      }
      return success;
    } catch (error) {
      console.error('Save failed:', error);
      if (onDataSync) {
        onDataSync(false, 'save');
      }
      return false;
    }
  }, [userSession, onDataSync]);

  const loadFromAzure = useCallback(async () => {
    if (!userSession) {
      toast.error('No user session configured');
      return false;
    }
    
    try {
      const success = await loadUserData();
      if (onDataSync) {
        onDataSync(success, 'load');
      }
      return success;
    } catch (error) {
      console.error('Load failed:', error);
      if (onDataSync) {
        onDataSync(false, 'load');
      }
      return false;
    }
  }, [userSession, onDataSync]);

  if (!userSession) {
    return null;
  }

  return (
    <div className="absolute top-2 right-2 z-[1000] flex gap-2">
      <button
        onClick={saveToAzure}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        title="Save to Azure SQL"
      >
        Save
      </button>
      <button
        onClick={loadFromAzure}
        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        title="Load from Azure SQL"
      >
        Load
      </button>
    </div>
  );
};
