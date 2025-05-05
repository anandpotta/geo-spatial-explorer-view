
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

  // Load saved paths when component initializes
  useEffect(() => {
    if (isInitialized) {
      const savedPaths = loadSvgPaths();
      if (savedPaths.length > 0) {
        setSvgPaths(savedPaths);
        lastPathsRef.current = savedPaths;
        
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

  // Periodically check for SVG paths when tools are active
  useEffect(() => {
    if (!isInitialized || !drawToolsRef.current) return;
    
    const checkForPaths = () => {
      if (!mountedRef.current) return;
      
      try {
        if (drawToolsRef.current) {
          const paths = drawToolsRef.current.getSVGPathData();
          
          // Only process if we have actual paths
          if (paths && paths.length > 0) {
            // Only update if paths have changed AND we're not updating too frequently
            const now = Date.now();
            const timeSinceLastUpdate = now - updateTimeRef.current;
            
            // Add a minimum time between updates (3 seconds) to prevent excessive updates
            if (!arePathsEqual(paths, lastPathsRef.current) && timeSinceLastUpdate > 3000) {
              lastPathsRef.current = [...paths];
              setSvgPaths(paths);
              
              // Save paths to localStorage
              saveSvgPaths(paths);
              updateTimeRef.current = now;
              
              if (onPathsUpdated) {
                updateCountRef.current += 1;
                console.log(`SVG Paths updated (${updateCountRef.current}):`, paths);
                onPathsUpdated(paths);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error getting SVG paths:', err);
      }
    };
    
    // Initial check
    checkForPaths();
    
    // Use a longer interval to reduce update frequency
    const intervalId = setInterval(checkForPaths, 5000); // Increased from 3000 to 5000ms
    return () => clearInterval(intervalId);
  }, [isInitialized, drawToolsRef, mountedRef, onPathsUpdated]);

  return {
    svgPaths,
    setSvgPaths
  };
}
