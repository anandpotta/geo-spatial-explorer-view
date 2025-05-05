
import { toast } from 'sonner';

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be hashed
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

const USERS_STORAGE_KEY = 'geospatial_users';
const AUTH_STATE_KEY = 'geospatial_auth_state';

// Initialize default users if they don't exist
export const initializeDefaultUsers = (): void => {
  const existingUsers = getUsers();
  
  if (existingUsers.length === 0) {
    const defaultUsers: User[] = [
      { id: 'user1', username: 'user1', password: 'Password@123' },
      { id: 'user2', username: 'user2', password: 'Password@123' },
      { id: 'user3', username: 'user3', password: 'Password@123' }
    ];
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    console.log('Default users initialized');
  }
};

export const getUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

export const login = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Set authentication state
    const authState: AuthState = {
      currentUser: user,
      isAuthenticated: true
    };
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(authState));
    return user;
  }
  
  return null;
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_STATE_KEY);
};

export const getCurrentUser = (): User | null => {
  const authJson = localStorage.getItem(AUTH_STATE_KEY);
  if (!authJson) return null;
  
  const authState: AuthState = JSON.parse(authJson);
  return authState.currentUser;
};

export const isAuthenticated = (): boolean => {
  const authJson = localStorage.getItem(AUTH_STATE_KEY);
  if (!authJson) return false;
  
  const authState: AuthState = JSON.parse(authJson);
  return authState.isAuthenticated;
};
