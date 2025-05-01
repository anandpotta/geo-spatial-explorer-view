
import { useState, useEffect, RefObject } from 'react';

interface SvgPathTrackingProps {
  isInitialized: boolean;
  drawToolsRef: RefObject<any>;
  mountedRef: RefObject<boolean>;
  onPathsUpdated?: (paths: string[]) => void;
}

export function useSvgPathTracking({
  isInitialized,
  drawToolsRef,
  mountedRef,
  onPathsUpdated
}: SvgPathTrackingProps) {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);

  // Periodically check for SVG paths when tools are active
  useEffect(() => {
    if (!isInitialized || !drawToolsRef.current) return;
    
    const checkForPaths = () => {
      if (!mountedRef.current) return;
      
      try {
        if (drawToolsRef.current) {
          const paths = drawToolsRef.current.getSVGPathData();
          if (paths && paths.length > 0) {
            setSvgPaths(paths);
            if (onPathsUpdated) {
              onPathsUpdated(paths);
            }
          }
        }
      } catch (err) {
        console.error('Error getting SVG paths:', err);
      }
    };
    
    const intervalId = setInterval(checkForPaths, 1000);
    return () => clearInterval(intervalId);
  }, [isInitialized, drawToolsRef, mountedRef, onPathsUpdated]);

  return {
    svgPaths,
    setSvgPaths
  };
}
