
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, login as authLogin, logout as authLogout, getCurrentUser, isAuthenticated as checkAuth, initializeDefaultUsers } from '../services/auth-service';
import { toast } from 'sonner';
import { clearImageUrlCache } from '../utils/clip-mask/core/image-loading';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Initialize default users
    initializeDefaultUsers();
    
    // Check if user is already logged in
    const user = getCurrentUser();
    const isAuth = checkAuth();
    
    setCurrentUser(user);
    setIsAuthenticated(isAuth);
  }, []);
  
  const login = async (username: string, password: string) => {
    const user = authLogin(username, password);
    
    if (user) {
      // Clear image cache on login to ensure fresh data load
      clearImageUrlCache();
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      toast.success(`Welcome, ${user.username}!`);
      
      // Trigger data reload for the new user
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      window.dispatchEvent(new Event('drawingsUpdated'));
      
      return true;
    } else {
      toast.error('Invalid username or password');
      return false;
    }
  };
  
  const logout = () => {
    authLogout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    
    // Clear image cache on logout
    clearImageUrlCache();
    
    toast.info('You have been logged out');
  };
  
  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
