
import { useEffect } from 'react';
import L from 'leaflet';
import { getCurrentUser } from '@/services/auth-service';

/**
 * Enhanced SVG path data structure with unique identifiers
 */
interface SvgPathData {
  id: string;
  path: string;
  uniqueId: string;
  timestamp: number;
}

/**
 * Save SVG paths for current user with unique identifiers
 */
export const saveSvgPaths = (paths: string[]): void => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  try {
    // Get existing paths data
    const pathsData = localStorage.getItem('svgPaths') || '{}';
    const parsedData = JSON.parse(pathsData);
    
    // Convert simple paths to enhanced structure if needed
    const enhancedPaths = paths.map((path, index) => {
      if (typeof path === 'string') {
        return {
          id: crypto.randomUUID(),
          path: path,
          uniqueId: crypto.randomUUID(),
          timestamp: Date.now() + index
        };
      }
      return path;
    });
    
    // Store paths for current user
    parsedData[currentUser.id] = enhancedPaths;
    
    // Save back to localStorage
    localStorage.setItem('svgPaths', JSON.stringify(parsedData));
    console.log(`Saved ${enhancedPaths.length} SVG paths with UIDs for user ${currentUser.id}`);
  } catch (err) {
    console.error('Error saving SVG paths:', err);
  }
};

/**
 * Load SVG paths for current user
 */
export const loadSvgPaths = (): (string | SvgPathData)[] => {
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
      console.log('Restoring saved paths with UIDs:', savedPaths.length);
      
      // Dispatch an event to signal that paths should be restored
      window.dispatchEvent(new CustomEvent('restoreSavedPaths', { 
        detail: { paths: savedPaths }
      }));
    }
  }, [featureGroup]);
}
