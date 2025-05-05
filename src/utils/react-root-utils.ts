
/**
 * Safely unmount a React root with error handling
 */
export const safelyUnmountRoot = (root: any) => {
  if (!root) return;
  try {
    if (root.unmount && typeof root.unmount === 'function') {
      root.unmount();
    }
  } catch (err) {
    console.error('Error unmounting root:', err);
  }
};
