
import { toast } from 'sonner';

export function useDrawingAuth() {
  const checkAuthBeforeAction = (actionName: string): boolean => {
    // Always return true to allow all actions without authentication
    console.log(`Action "${actionName}" allowed without authentication`);
    return true;
  };
  
  return {
    isAuthenticated: true,
    currentUser: { id: 'anonymous', name: 'Anonymous User' },
    checkAuthBeforeAction
  };
}
