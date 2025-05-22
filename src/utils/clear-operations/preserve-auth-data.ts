
/**
 * Preserves authentication data during clear operations
 * @returns A function to restore preserved authentication data
 */
export function preserveAuthData(): () => boolean {
  // Store authentication data before clear operation
  const authToken = localStorage.getItem('authToken');
  const userProfile = localStorage.getItem('userProfile');
  const refreshToken = localStorage.getItem('refreshToken');
  
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
