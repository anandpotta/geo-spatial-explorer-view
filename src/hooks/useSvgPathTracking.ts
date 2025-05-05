
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
  const activePathsRef = useRef<Map<string, boolean>>(new Map());

  // Periodically check for SVG paths when tools are active
  useEffect(() => {
    if (!isInitialized || !drawToolsRef.current) return;
    
    const checkForPaths = () => {
      if (!mountedRef.current) return;
      
      try {
        if (drawToolsRef.current) {
          // Get current paths and restore visibility
          if (drawToolsRef.current.restorePathVisibility) {
            drawToolsRef.current.restorePathVisibility();
          }
          
          const paths = drawToolsRef.current.getSVGPathData();
          if (paths && paths.length > 0) {
            // Store paths in active paths map for persistence
            paths.forEach(path => {
              activePathsRef.current.set(path, true);
            });
            
            // Only update if paths have actually changed
            if (!arePathsEqual(paths, lastPathsRef.current)) {
              lastPathsRef.current = [...paths];
              setSvgPaths(paths);
              
              if (onPathsUpdated) {
                updateCountRef.current += 1;
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
    
    // Check more frequently initially, then back off
    const initialIntervalId = setInterval(checkForPaths, 500);
    
    // Set up event listeners for map interactions that might affect paths
    const handleMapEvent = () => {
      requestAnimationFrame(checkForPaths);
    };
    
    if (drawToolsRef.current) {
      try {
        // Get the map instance from the drawTools
        const featureGroup = drawToolsRef.current?.getFeatureGroup?.();
        if (featureGroup) {
          const map = featureGroup._map;
          if (map) {
            map.on('zoomend moveend dragend', handleMapEvent);
            
            // Also observe DOM mutations that might affect path visibility
            const container = map.getContainer();
            if (container) {
              const observer = new MutationObserver(() => {
                requestAnimationFrame(checkForPaths);
              });
              
              observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['d', 'class', 'style']
              });
              
              // Clean up observer on unmount
              return () => {
                clearInterval(initialIntervalId);
                map.off('zoomend moveend dragend', handleMapEvent);
                observer.disconnect();
              };
            }
          }
        }
      } catch (err) {
        console.error('Error setting up map event listeners:', err);
      }
    }
    
    // Use a longer interval for regular checking
    const intervalId = setInterval(checkForPaths, 3000);
    
    return () => {
      clearInterval(initialIntervalId);
      clearInterval(intervalId);
    };
  }, [isInitialized, drawToolsRef, mountedRef, onPathsUpdated]);

  return {
    svgPaths,
    setSvgPaths,
    activePathsRef
  };
}
