
import { AzureSQLService } from './azure-sql-service';
import { UserSession } from './user-data/types';
import { SessionManager } from './user-data/session-manager';
import { AutoSyncManager } from './user-data/auto-sync-manager';
import { AzureDataSync } from './user-data/azure-data-sync';

export class UserDataService {
  private sessionManager: SessionManager;
  private autoSyncManager: AutoSyncManager;
  private azureDataSync: AzureDataSync;

  constructor() {
    this.sessionManager = new SessionManager();
    this.autoSyncManager = new AutoSyncManager();
    this.azureDataSync = new AzureDataSync();
    
    // Set up auto-sync callback
    this.autoSyncManager.setSaveCallback(() => this.saveUserDataToAzure());
  }

  // Session management
  setUserSession(session: UserSession): void {
    this.sessionManager.setUserSession(session);
    this.autoSyncManager.setSession(session);
    this.azureDataSync.setAzureService(session);
  }

  getCurrentSession(): UserSession | null {
    return this.sessionManager.getCurrentSession();
  }

  clearSession(): void {
    this.sessionManager.clearSession();
    this.autoSyncManager.setSession(null);
  }

  // Data synchronization methods
  async loadUserDataFromAzure(): Promise<boolean> {
    const session = this.sessionManager.getCurrentSession();
    if (!session) {
      throw new Error('No active user session');
    }
    return await this.azureDataSync.loadUserDataFromAzure(session);
  }

  async saveUserDataToAzure(): Promise<boolean> {
    const session = this.sessionManager.getCurrentSession();
    if (!session) {
      throw new Error('No active user session');
    }
    return await this.azureDataSync.saveUserDataToAzure(session);
  }

  // Auto-sync functionality
  enableAutoSync(): void {
    this.autoSyncManager.enableAutoSync();
  }
}

// Global instance for easy access
export const userDataService = new UserDataService();

// Utility functions for easy integration
export function setUserSession(userId: string, connectionString: string, username?: string, autoSync: boolean = true): void {
  userDataService.setUserSession({ userId, username, connectionString, autoSync });
  if (autoSync) {
    userDataService.enableAutoSync();
  }
}

export function loadUserData(): Promise<boolean> {
  return userDataService.loadUserDataFromAzure();
}

export function saveUserData(): Promise<boolean> {
  return userDataService.saveUserDataToAzure();
}

export function clearUserSession(): void {
  userDataService.clearSession();
}

export function getCurrentUser(): { userId: string; username?: string } | null {
  const session = userDataService.getCurrentSession();
  return session ? { userId: session.userId, username: session.username } : null;
}

// Re-export types for backward compatibility
export type { UserSession } from './user-data/types';
