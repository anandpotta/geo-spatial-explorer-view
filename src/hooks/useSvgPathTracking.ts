
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
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Track SVG path changes with reduced frequency
  useEffect(() => {
    if (!isInitialized || !drawToolsRef.current) return;

    const updatePaths = () => {
      if (!mountedRef.current) return;
      
      // Skip updates during edit mode activation
      if (activeTool === 'edit' && isUpdating) {
        console.log('Skipping SVG path update during edit mode activation');
        return;
      }
      
      try {
        // Don't update too frequently (at most once per 2 seconds)
        const now = Date.now();
        if (now - lastUpdateTime < 2000) {
          return;
        }
        
        const paths = drawToolsRef.current.getSVGPathData();
        
        // Only update if paths have changed
        if (JSON.stringify(paths) !== JSON.stringify(svgPaths)) {
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
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isInitialized, drawToolsRef, mountedRef, onPathsUpdated, svgPaths, lastUpdateTime, activeTool, isUpdating]);
  
  // Add this effect to track edit mode activation
  useEffect(() => {
    if (activeTool === 'edit') {
      setIsUpdating(true);
      
      // After a delay, allow updates again
      const timeoutId = setTimeout(() => {
        setIsUpdating(false);
      }, 3000); // 3 seconds should cover most activation scenarios
      
      return () => clearTimeout(timeoutId);
    }
    
    setIsUpdating(false);
  }, [activeTool]);
  
  return { svgPaths, setSvgPaths };
}
