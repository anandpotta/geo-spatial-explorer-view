
import { useEffect, useState, useRef, useCallback } from 'react';
import { saveSvgPaths } from './useSavedPathsRestoration';
import { getCurrentUser } from '@/services/auth-service';

interface UseSvgPathTrackingProps {
  isInitialized: boolean;
  drawToolsRef: any;
  mountedRef: React.MutableRefObject<boolean>;
  onPathsUpdated?: (paths: string[]) => void;
}

export function useSvgPathTracking({
  isInitialized,
  drawToolsRef,
  mountedRef,
  onPathsUpdated
}: UseSvgPathTrackingProps) {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const pathsTimeoutRef = useRef<number | null>(null);
  const lastPathsRef = useRef<string>('');
  
  // Stable callback for tracking paths
  const trackPaths = useCallback(() => {
    if (!mountedRef.current || !isInitialized) return;
    
    try {
      if (drawToolsRef.current && typeof drawToolsRef.current.getSVGPathData === 'function') {
        const paths = drawToolsRef.current.getSVGPathData();
        const pathsString = JSON.stringify(paths);
        
        // Only update if paths have actually changed
        if (pathsString !== lastPathsRef.current) {
          lastPathsRef.current = pathsString;
          setSvgPaths(paths);
          
          // User-specific save
          const currentUser = getCurrentUser();
          if (currentUser) {
            saveSvgPaths(paths);
          }
          
          if (onPathsUpdated) {
            onPathsUpdated(paths);
          }
        }
      }
    } catch (e) {
      console.error('Error tracking SVG paths:', e);
    }
  }, [isInitialized, drawToolsRef, mountedRef, onPathsUpdated]);
  
  // Debounced path tracking handler
  const handlePathsUpdated = useCallback(() => {
    if (!mountedRef.current) return;
    
    // Clear existing timeout
    if (pathsTimeoutRef.current) {
      window.clearTimeout(pathsTimeoutRef.current);
    }
    
    // Set new timeout with longer delay to prevent excessive calls
    pathsTimeoutRef.current = window.setTimeout(() => {
      trackPaths();
    }, 500); // Increased from 100ms to 500ms
  }, [trackPaths]);
  
  // Effect for tracking SVG paths
  useEffect(() => {
    if (!isInitialized || !drawToolsRef.current) return;
    
    // Track paths initially
    trackPaths();
    
    // Set up event listeners with debounced handler
    const events = [
      'drawingCreated',
      'drawingDeleted', 
      'drawingsLoaded',
      'floorPlanUpdated'
    ];
    
    events.forEach(event => {
      window.addEventListener(event, handlePathsUpdated);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handlePathsUpdated);
      });
      
      if (pathsTimeoutRef.current) {
        window.clearTimeout(pathsTimeoutRef.current);
      }
    };
  }, [isInitialized, trackPaths, handlePathsUpdated]);
  
  // Handle user changes with stable callback
  const handleUserChange = useCallback(() => {
    if (drawToolsRef.current && isInitialized) {
      // Use timeout to prevent immediate re-render
      setTimeout(() => {
        trackPaths();
      }, 100);
    }
  }, [drawToolsRef, isInitialized, trackPaths]);
  
  useEffect(() => {
    window.addEventListener('userChanged', handleUserChange);
    
    return () => {
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, [handleUserChange]);
  
  return { svgPaths, setSvgPaths };
}
