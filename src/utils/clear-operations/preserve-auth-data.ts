
/**
 * Preserves authentication data during clear operations
 * @returns A function that restores the preserved auth data
 */
export function preserveAuthData(): (() => boolean) | null {
  // Store authentication data before clear operation
  const authToken = localStorage.getItem('authToken');
  const userProfile = localStorage.getItem('userProfile');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // If no auth data exists, return null instead of a function
  if (!authToken && !userProfile && !refreshToken) {
    return null;
  }
  
  // Function to restore auth data
  return () => {
    // Restore authentication data after clear operation
    if (authToken) localStorage.setItem('authToken', authToken);
    if (userProfile) localStorage.setItem('userProfile', userProfile);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    
    // Return true to indicate operation was successful
    return true;
  };
}
