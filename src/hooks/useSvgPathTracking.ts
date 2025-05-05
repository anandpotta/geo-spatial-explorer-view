
import { useState, useEffect, RefObject } from 'react';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';
import { toast } from 'sonner';

interface UseSvgPathTrackingProps {
  isInitialized: boolean;
  drawToolsRef: RefObject<any>;
  mountedRef: RefObject<boolean>;
  onPathsUpdated?: (paths: string[]) => void;
  activeTool?: string | null;
}

export function useSvgPathTracking({
  isInitialized,
  drawToolsRef,
  mountedRef,
  onPathsUpdated,
  activeTool
}: UseSvgPathTrackingProps) {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  
  // Track SVG path changes with reduced frequency
  useEffect(() => {
    if (!isInitialized || !drawToolsRef.current) return;

    const updatePaths = () => {
      if (!mountedRef.current) return;
      
      try {
        // Don't update too frequently (at most once per 2 seconds)
        const now = Date.now();
        if (now - lastUpdateTime < 2000) {
          return;
        }
        
        const paths = drawToolsRef.current.getSVGPathData();
        
        // Only update if paths have changed
        if (JSON.stringify(paths) !== JSON.stringify(svgPaths)) {
          console.log("Updating SVG paths:", paths);
          setSvgPaths(paths);
          setLastUpdateTime(now);
          
          if (onPathsUpdated) {
            onPathsUpdated(paths);
          }
        }
      } catch (err) {
        console.error('Error updating SVG paths:', err);
      }
    };
    
    // Update paths initially
    updatePaths();
    
    // Set up interval for path checking but at a much lower frequency
    const intervalId = setInterval(updatePaths, 5000); // Check every 5 seconds
    
    // Listen for force update events
    const handleForceUpdate = () => {
      console.log("Force SVG path update triggered");
      try {
        if (drawToolsRef.current) {
          const paths = drawToolsRef.current.getSVGPathData();
          console.log("Forced path update:", paths);
          setSvgPaths(paths);
          
          if (onPathsUpdated) {
            onPathsUpdated(paths);
          }
        }
      } catch (err) {
        console.error('Error during forced SVG path update:', err);
      }
    };
    
    window.addEventListener('force-svg-path-update', handleForceUpdate);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('force-svg-path-update', handleForceUpdate);
    };
  }, [isInitialized, drawToolsRef, mountedRef, onPathsUpdated, svgPaths, lastUpdateTime, activeTool]);
  
  return { svgPaths, setSvgPaths };
}
