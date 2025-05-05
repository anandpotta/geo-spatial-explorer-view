
/**
 * Utility functions for safely unmounting React roots
 */

export function safeUnmountRoots(
  removeButtonRoots: Map<string, any>,
  uploadButtonRoots: Map<string, any>,
  imageControlRoots: Map<string, any>
) {
  // Unmount all React roots in a safe way
  const unmountRoot = (root: any) => {
    if (!root) return;
    try {
      // Check if the unmount method exists before calling it
      if (root && typeof root.unmount === 'function') {
        root.unmount();
      }
    } catch (err) {
      console.error('Error unmounting root:', err);
    }
  };
  
  // Safely clear all roots
  const safelyClearRoots = (rootsMap: Map<string, any>) => {
    if (!rootsMap) return;
    
    // Create array of entries to avoid modification during iteration
    const entries = Array.from(rootsMap.entries());
    entries.forEach(([key, root]) => {
      unmountRoot(root);
      rootsMap.delete(key);
    });
  };
  
  // Clear all types of roots
  safelyClearRoots(removeButtonRoots);
  safelyClearRoots(uploadButtonRoots);
  safelyClearRoots(imageControlRoots);
}
