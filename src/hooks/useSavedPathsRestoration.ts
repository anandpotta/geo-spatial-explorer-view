
import { useEffect } from 'react';
import { getCurrentUser } from '@/services/auth-service';

const STORAGE_KEY = 'geospatial_svg_paths';

export function saveSvgPaths(paths: string[]) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  try {
    const userKey = `${STORAGE_KEY}_${currentUser.id}`;
    // Store paths as array of strings, not as JSON objects
    localStorage.setItem(userKey, JSON.stringify(paths));
    console.log(`Saved ${paths.length} SVG paths for user ${currentUser.id}`);
  } catch (error) {
    console.error('Error saving SVG paths:', error);
  }
}

export function getSavedSvgPaths(): string[] {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  
  try {
    const userKey = `${STORAGE_KEY}_${currentUser.id}`;
    const saved = localStorage.getItem(userKey);
    if (!saved) return [];
    
    const paths = JSON.parse(saved);
    console.log(`Loaded ${paths.length} SVG paths for user ${currentUser.id}`);
    return Array.isArray(paths) ? paths : [];
  } catch (error) {
    console.error('Error loading SVG paths:', error);
    return [];
  }
}

export function useSavedPathsRestoration(
  drawToolsRef: React.RefObject<any>,
  isInitialized: boolean
) {
  useEffect(() => {
    if (!isInitialized || !drawToolsRef.current) return;
    
    const restorePaths = () => {
      try {
        const savedPaths = getSavedSvgPaths();
        if (savedPaths.length > 0) {
          console.log('Restoring saved paths:', savedPaths.length);
          
          // Dispatch event to restore paths
          window.dispatchEvent(new CustomEvent('restoreSavedPaths', {
            detail: { paths: savedPaths }
          }));
          
          console.log('Received restore paths event with', savedPaths.length, 'paths');
          
          // Apply each path correctly - don't try to parse as JSON
          savedPaths.forEach((pathData, index) => {
            try {
              if (typeof pathData === 'string' && pathData.trim()) {
                // Create SVG path element directly from path data
                if (drawToolsRef.current && typeof drawToolsRef.current.restorePath === 'function') {
                  drawToolsRef.current.restorePath(pathData);
                }
              }
            } catch (error) {
              console.error(`Failed to restore path ${index}:`, error);
            }
          });
        }
      } catch (error) {
        console.error('Error in path restoration:', error);
      }
    };
    
    // Restore paths after a short delay to ensure drawing tools are ready
    const timeout = setTimeout(restorePaths, 500);
    
    return () => clearTimeout(timeout);
  }, [isInitialized, drawToolsRef]);
}
