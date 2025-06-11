
import { getCurrentUser } from '@/services/auth-service';
import { DrawingData } from '@/utils/drawing-utils';

/**
 * Checks if the current user can interact with a drawing
 */
export const canUserInteractWithDrawing = (drawing: DrawingData): boolean => {
  const currentUser = getCurrentUser();
  
  // Allow anonymous users to interact with drawings, but only allow interaction with their own drawings
  // For anonymous users, we'll use 'anonymous' as the userId
  const effectiveUserId = currentUser?.id || 'anonymous';
  
  // Only allow interaction with drawings owned by the current user (including anonymous)
  if (drawing.userId && drawing.userId !== effectiveUserId) {
    console.log(`Drawing ${drawing.id} belongs to another user, user cannot interact`);
    return false;
  }
  
  return true;
};
