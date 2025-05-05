
import { useEffect, RefObject, useState } from 'react';

/**
 * This hook is no longer used for edit mode since we've removed edit controls
 * Kept as a stub for backward compatibility
 */
export function useEditMode(editControlRef: RefObject<any>, activeTool: string | null) {
  const [isEditActive, setIsEditActive] = useState(false);
  
  // Always return false since edit mode is disabled
  return false;
}
