
/**
 * Preserves authentication data while clearing everything else
 */
export function preserveAuthData() {
  try {
    // Get authentication data before clearing
    const authState = localStorage.getItem('geospatial_auth_state');
    const users = localStorage.getItem('geospatial_users');
    
    return { authState, users };
  } catch (error) {
    console.error('Error preserving auth data:', error);
    return { authState: null, users: null };
  }
}

/**
 * Restores preserved authentication data
 */
export function restoreAuthData(data: { authState: string | null, users: string | null }) {
  try {
    // Restore authentication data
    if (data.authState) {
      localStorage.setItem('geospatial_auth_state', data.authState);
    }
    
    if (data.users) {
      localStorage.setItem('geospatial_users', data.users);
    }
    
    return true;
  } catch (error) {
    console.error('Error restoring auth data:', error);
    return false;
  }
}
