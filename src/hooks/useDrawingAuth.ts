
import { toast } from 'sonner';

export function useDrawingAuth() {
  // Always return authenticated for standalone usage
  const isAuthenticated = true;
  const currentUser = { id: 'standalone-user', username: 'standalone' };
  
  const checkAuthBeforeAction = (actionName: string): boolean => {
    // Always allow actions in standalone mode
    return true;
  };
  
  return {
    isAuthenticated,
    currentUser,
    checkAuthBeforeAction
  };
}
