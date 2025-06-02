
import { UserSession } from './types';

export class SessionManager {
  private session: UserSession | null = null;

  constructor() {
    this.restoreSession();
  }

  setUserSession(session: UserSession): void {
    this.session = session;
    
    // Save session to localStorage for persistence
    localStorage.setItem('userSession', JSON.stringify({
      userId: session.userId,
      username: session.username,
      autoSync: session.autoSync
      // Note: We don't store connectionString in localStorage for security
    }));
  }

  getCurrentSession(): UserSession | null {
    return this.session;
  }

  clearSession(): void {
    this.session = null;
    localStorage.removeItem('userSession');
  }

  private restoreSession(): void {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Note: connectionString needs to be provided again for security
        console.log('Found saved session for user:', session.userId);
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('userSession');
      }
    }
  }
}
