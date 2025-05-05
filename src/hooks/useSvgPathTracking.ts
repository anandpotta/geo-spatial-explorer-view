
import { useState, useEffect, useRef, RefObject } from 'react';
import { getCurrentUser } from '../services/auth-service';

interface SvgPathTrackingProps {
  isInitialized: boolean;
  drawToolsRef: RefObject<any>;
  mountedRef: RefObject<boolean>;
  onPathsUpdated?: (paths: string[]) => void;
}

// Helper function to check if two path arrays are equal
const arePathsEqual = (paths1: string[], paths2: string[]): boolean => {
  if (paths1.length !== paths2.length) return false;
  return paths1.every((path, index) => path === paths2[index]);
};

// Helper to generate a stable hash for an array of paths
const generatePathHash = (paths: string[]): string => {
  if (!paths || paths.length === 0) return '';
  return paths.join('|').substring(0, 100); // Use first 100 chars for performance
};

// Save SVG paths to localStorage with user ID
const saveSvgPaths = (paths: string[]) => {
  if (!paths || paths.length === 0) return;
  
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  try {
    // Get existing paths data (should be an object with userIds as keys)
    const existingData = localStorage.getItem('svgPaths');
    let pathsData: Record<string, string[]> = {};
    
    if (existingData) {
      pathsData = JSON.parse(existingData);
    }
    
    // Save paths for current user
    pathsData[currentUser.id] = paths;
    
    // Store updated data
    localStorage.setItem('svgPaths', JSON.stringify(pathsData));
  } catch (err) {
    console.error('Error saving SVG paths:', err);
  }
};

// Load SVG paths for current user
const loadSvgPaths = (): string[] => {
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

export function useSvgPathTracking({
  isInitialized,
  drawToolsRef,
  mountedRef,
  onPathsUpdated
}: SvgPathTrackingProps) {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const lastPathsRef = useRef<string[]>([]);
  const updateCountRef = useRef(0);
  const updateTimeRef = useRef<number>(0);
  const lastPathHashRef = useRef<string>('');
  const checkingRef = useRef<boolean>(false);
  const timeoutIdRef = useRef<number | null>(null);
  
  // Load saved paths when component initializes
  useEffect(() => {
    if (isInitialized) {
      const savedPaths = loadSvgPaths();
      if (savedPaths.length > 0) {
        setSvgPaths(savedPaths);
        lastPathsRef.current = savedPaths;
        lastPathHashRef.current = generatePathHash(savedPaths);
        
        // If we have onPathsUpdated callback, call it with loaded paths
        if (onPathsUpdated) {
          onPathsUpdated(savedPaths);
        }
      }
    }
  }, [isInitialized, onPathsUpdated]);

  // Handler for clear all event
  useEffect(() => {
    const handleClearAll = () => {
      setSvgPaths([]);
      lastPathsRef.current = [];
      lastPathHashRef.current = '';
      updateCountRef.current = 0;
      if (onPathsUpdated) {
        onPathsUpdated([]);
      }
      console.log('SVG paths cleared');
    };
    
    window.addEventListener('clearAllSvgPaths', handleClearAll);
    
    return () => {
      window.removeEventListener('clearAllSvgPaths', handleClearAll);
    };
  }, [onPathsUpdated]);

  // Periodically check for SVG paths when tools are active - with strong rate limiting
  useEffect(() => {
    if (!isInitialized || !drawToolsRef.current) return;
    
    const checkForPaths = () => {
      // Prevent concurrent checks
      if (checkingRef.current || !mountedRef.current) return;
      
      try {
        checkingRef.current = true;
        
        if (drawToolsRef.current) {
          const paths = drawToolsRef.current.getSVGPathData();
          
          // Only process if we have actual paths
          if (paths && paths.length > 0) {
            // Generate a hash of the paths for more efficient comparison
            const pathHash = generatePathHash(paths);
            
            // Only update if paths have changed AND we're not updating too frequently
            const now = Date.now();
            const timeSinceLastUpdate = now - updateTimeRef.current;
            
            // Add a significant delay between updates (10 seconds) to prevent loops
            if (pathHash !== lastPathHashRef.current && timeSinceLastUpdate > 10000) {
              // Use exact equality check to catch any differences
              if (!arePathsEqual(paths, lastPathsRef.current)) {
                // Save both the full paths and the hash
                lastPathsRef.current = [...paths];
                lastPathHashRef.current = pathHash;
                
                // Update state
                setSvgPaths(paths);
                
                // Save paths to localStorage
                saveSvgPaths(paths);
                updateTimeRef.current = now;
                
                if (onPathsUpdated) {
                  updateCountRef.current += 1;
                  console.log(`SVG Paths updated (${updateCountRef.current}):`, paths);
                  
                  // Further throttle the callback to prevent cascading updates
                  if (timeoutIdRef.current) {
                    window.clearTimeout(timeoutIdRef.current);
                  }
                  
                  timeoutIdRef.current = window.setTimeout(() => {
                    if (mountedRef.current) {
                      onPathsUpdated(paths);
                    }
                    timeoutIdRef.current = null;
                  }, 1000);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error getting SVG paths:', err);
      } finally {
        checkingRef.current = false;
      }
    };
    
    // Initial check
    checkForPaths();
    
    // Use a much longer interval to reduce update frequency
    const intervalId = setInterval(checkForPaths, 15000); // Increased from 5000 to 15000ms
    
    return () => {
      clearInterval(intervalId);
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
      }
    };
  }, [isInitialized, drawToolsRef, mountedRef, onPathsUpdated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return {
    svgPaths,
    setSvgPaths
  };
}
