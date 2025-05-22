
/**
 * Preserves authentication data during clear operations
 * @returns A function that restores the preserved auth data when called, or null if no auth data exists
 */
export function preserveAuthData(): (() => boolean) | null {
  // Store authentication data before clear operation
  const authToken = localStorage.getItem('authToken');
  const userProfile = localStorage.getItem('userProfile');
  const refreshToken = localStorage.getItem('refreshToken');
  const authState = localStorage.getItem('geospatial_auth_state');
  
  // If no auth data exists, return null instead of a function
  if (!authToken && !userProfile && !refreshToken && !authState) {
    return null;
  }
  
  // Function to restore auth data
  return () => {
    // Restore authentication data after clear operation
    if (authToken) localStorage.setItem('authToken', authToken);
    if (userProfile) localStorage.setItem('userProfile', userProfile);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (authState) localStorage.setItem('geospatial_auth_state', authState);
    
    // Return true to indicate operation was successful
    return true;
  };
}
