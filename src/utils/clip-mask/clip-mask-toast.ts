
/**
 * Utilities for managing toast notifications for clip masks
 */
import { toast } from 'sonner';

// Track which drawings have been displayed with toasts to avoid duplicates
const toastShown = new Set<string>();

/**
 * Show a success toast for a clip mask application, but only once per drawing ID
 */
export const showClipMaskSuccessToast = (id: string): void => {
  if (!toastShown.has(id)) {
    toastShown.add(id);
    toast.success('Floor plan applied successfully', { id: `floor-plan-${id}` });
  }
};

/**
 * Show an error toast for clip mask application
 */
export const showClipMaskErrorToast = (message: string): void => {
  toast.error(message);
};

/**
 * Reset the toast tracking when the page reloads
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    toastShown.clear();
  });
}
