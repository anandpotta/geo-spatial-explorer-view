
import { toast } from 'sonner';

export function useDrawingAuth() {
  const checkAuthBeforeAction = (actionName: string): boolean => {
    // Always return true since we removed authentication
    return true;
  };
  
  return {
    isAuthenticated: true,
    currentUser: null,
    checkAuthBeforeAction
  };
}
