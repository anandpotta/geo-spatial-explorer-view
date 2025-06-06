
import { toast } from 'sonner';

export function useDrawingAuth() {
  const isAuthenticated = true; // Always authenticated now
  const currentUser = { id: 'default-user', username: 'user' }; // Default user
  
  const checkAuthBeforeAction = (actionName: string): boolean => {
    // Always return true since we removed authentication
    return true;
  };
  
  return {
    isAuthenticated,
    currentUser,
    checkAuthBeforeAction
  };
}
