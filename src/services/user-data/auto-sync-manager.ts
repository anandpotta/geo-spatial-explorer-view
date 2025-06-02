
import { UserSession } from './types';

export class AutoSyncManager {
  private saveTimeout: number | null = null;
  private session: UserSession | null = null;
  private saveCallback: (() => Promise<boolean>) | null = null;

  setSession(session: UserSession | null): void {
    this.session = session;
  }

  setSaveCallback(callback: () => Promise<boolean>): void {
    this.saveCallback = callback;
  }

  enableAutoSync(): void {
    if (!this.session) return;

    const handleDataChange = () => {
      if (this.session?.autoSync) {
        this.debouncedSave();
      }
    };

    window.addEventListener('storage', handleDataChange);
    window.addEventListener('markersUpdated', handleDataChange);
    window.addEventListener('drawingsUpdated', handleDataChange);
    window.addEventListener('svgPathsUpdated', handleDataChange);
  }

  private debouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = window.setTimeout(() => {
      if (this.saveCallback) {
        this.saveCallback().catch(console.error);
      }
    }, 2000); // Save after 2 seconds of inactivity
  }
}
