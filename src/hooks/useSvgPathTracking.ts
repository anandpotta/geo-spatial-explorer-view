
import { useState, useEffect, useRef, RefObject } from 'react';

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

export function useSvgPathTracking({
  isInitialized,
  drawToolsRef,
  mountedRef,
  onPathsUpdated
}: SvgPathTrackingProps) {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const lastPathsRef = useRef<string[]>([]);
  const updateCountRef = useRef(0);

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
          if (paths && paths.length > 0) {
            // Only update if paths have actually changed
            if (!arePathsEqual(paths, lastPathsRef.current)) {
              lastPathsRef.current = [...paths];
              setSvgPaths(paths);
              if (onPathsUpdated) {
                updateCountRef.current += 1;
                
                // Include count in logging for debugging purposes
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
    const intervalId = setInterval(checkForPaths, 3000);
    return () => clearInterval(intervalId);
  }, [isInitialized, drawToolsRef, mountedRef, onPathsUpdated]);

  return {
    svgPaths,
    setSvgPaths
  };
}
