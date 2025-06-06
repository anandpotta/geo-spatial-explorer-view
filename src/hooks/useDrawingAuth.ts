
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useDrawingAuth() {
  const { isAuthenticated, currentUser } = useAuth();
  
  const checkAuthBeforeAction = (actionName: string): boolean => {
    if (!isAuthenticated) {
      toast.error(`Please log in to ${actionName}`);
      return false;
    }
    return true;
  };
  
  return {
    isAuthenticated,
    currentUser,
    checkAuthBeforeAction
  };
}
