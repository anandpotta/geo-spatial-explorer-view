
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
  const stableOnPathsUpdatedRef = useRef(onPathsUpdated);
  const trackingInProgress = useRef(false);
  
  // Update ref when callback changes but don't trigger re-renders
  stableOnPathsUpdatedRef.current = onPathsUpdated;
  
  // Stable callback for tracking paths - dependencies are minimal and stable
  const trackPaths = useCallback(() => {
    if (!mountedRef.current || !isInitialized || trackingInProgress.current) return;
    
    trackingInProgress.current = true;
    
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
          
          if (stableOnPathsUpdatedRef.current) {
            stableOnPathsUpdatedRef.current(paths);
          }
        }
      }
    } catch (e) {
      console.error('Error tracking SVG paths:', e);
    } finally {
      trackingInProgress.current = false;
    }
  }, [isInitialized, mountedRef]); // Only depend on stable values
  
  // Heavily debounced path tracking handler
  const handlePathsUpdated = useCallback(() => {
    if (!mountedRef.current || trackingInProgress.current) return;
    
    // Clear existing timeout
    if (pathsTimeoutRef.current) {
      window.clearTimeout(pathsTimeoutRef.current);
    }
    
    // Set new timeout with very long delay to prevent excessive calls
    pathsTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        trackPaths();
      }
    }, 1000); // Increased to 1 second
  }, [trackPaths, mountedRef]);
  
  // Effect for tracking SVG paths - only run when truly necessary
  useEffect(() => {
    if (!isInitialized || !drawToolsRef.current) return;
    
    // Track paths initially with delay
    const initTimeout = setTimeout(() => {
      if (mountedRef.current) {
        trackPaths();
      }
    }, 500);
    
    // Set up event listeners with heavily debounced handler
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
      clearTimeout(initTimeout);
      events.forEach(event => {
        window.removeEventListener(event, handlePathsUpdated);
      });
      
      if (pathsTimeoutRef.current) {
        window.clearTimeout(pathsTimeoutRef.current);
      }
    };
  }, [isInitialized]); // Only depend on isInitialized
  
  // Handle user changes with minimal dependencies
  useEffect(() => {
    if (drawToolsRef.current && isInitialized) {
      const timeout = setTimeout(() => {
        if (mountedRef.current) {
          trackPaths();
        }
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [isInitialized]); // Remove user dependency to prevent loops
  
  return { svgPaths, setSvgPaths };
}
