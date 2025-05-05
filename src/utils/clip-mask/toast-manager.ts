
/**
 * Utility functions for managing toasts for clip mask operations
 */
import { toast } from 'sonner';

/**
 * Shows a success toast for clip mask application
 * Manages duplicate prevention to avoid spamming the user
 */
export const showSuccessToast = (
  id: string,
  toastShown: Set<string>
): void => {
  // Only show toast for first time applications to reduce notification spam
  if (!toastShown.has(id)) {
    toastShown.add(id);
    toast.success('Floor plan applied successfully', { id: `floor-plan-${id}` });
  }
};
