
import { useEffect } from 'react';
import L from 'leaflet';
import { getCurrentUser } from '@/services/auth-service';

/**
 * Load SVG paths for current user
 */
export const loadSvgPaths = (): string[] => {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  
  try {
    const pathsData = localStorage.getItem('svgPaths');
    if (!pathsData) return [];
    
    const parsedData = JSON.parse(pathsData);
    return parsedData[currentUser.id] || [];
  } catch (err) {
    console.error('Error loading SVG paths:', err);
    return [];
  }
};

/**
 * Hook to restore saved paths when component mounts
 */
export function useSavedPathsRestoration(featureGroup: L.FeatureGroup | null) {
  useEffect(() => {
    if (!featureGroup) return;
    
    // Get the map from the feature group
    const map = (featureGroup as any)._map;
    if (!map) return;
    
    // Load saved paths
    const savedPaths = loadSvgPaths();
    if (savedPaths && savedPaths.length > 0) {
      // We need to attempt to restore the paths
      console.log('Restoring saved paths:', savedPaths.length);
      
      // Dispatch an event to signal that paths should be restored
      window.dispatchEvent(new CustomEvent('restoreSavedPaths', { 
        detail: { paths: savedPaths }
      }));
    }
  }, [featureGroup]);
}
