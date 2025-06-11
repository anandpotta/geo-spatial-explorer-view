
import { useEffect, useState, useRef } from 'react';
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
  const trackingCountRef = useRef(0);
  
  // Effect for tracking SVG paths
  useEffect(() => {
    console.log('useSvgPathTracking: Main effect triggered', {
      isInitialized,
      hasDrawToolsRef: !!drawToolsRef.current,
      mounted: mountedRef.current
    });
    
    if (isInitialized && drawToolsRef.current) {
      const trackPaths = () => {
        trackingCountRef.current += 1;
        console.log(`useSvgPathTracking: trackPaths called #${trackingCountRef.current}`);
        
        if (!mountedRef.current) {
          console.log('useSvgPathTracking: Component not mounted, skipping');
          return;
        }
        
        try {
          if (drawToolsRef.current && typeof drawToolsRef.current.getSVGPathData === 'function') {
            const paths = drawToolsRef.current.getSVGPathData();
            console.log('useSvgPathTracking: Got SVG paths', { pathCount: paths.length });
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
        } catch (e) {
          console.error('Error tracking SVG paths:', e);
        }
      };
      
      // Track paths initially
      trackPaths();
      
      // Set up tracking on drawing events
      const handlePathsUpdated = () => {
        console.log('useSvgPathTracking: Event-triggered path update');
        
        if (!mountedRef.current) return;
        
        // Debounce path tracking to prevent excessive saves
        if (pathsTimeoutRef.current) {
          window.clearTimeout(pathsTimeoutRef.current);
        }
        
        pathsTimeoutRef.current = window.setTimeout(() => {
          console.log('useSvgPathTracking: Debounced trackPaths executing');
          trackPaths();
        }, 100);
      };
      
      // Set up event listeners
      console.log('useSvgPathTracking: Setting up event listeners');
      window.addEventListener('drawingCreated', handlePathsUpdated);
      window.addEventListener('drawingDeleted', handlePathsUpdated);
      window.addEventListener('drawingsLoaded', handlePathsUpdated);
      window.addEventListener('floorPlanUpdated', handlePathsUpdated);
      window.addEventListener('svgPathsUpdated', handlePathsUpdated);
      
      return () => {
        console.log('useSvgPathTracking: Cleaning up event listeners');
        window.removeEventListener('drawingCreated', handlePathsUpdated);
        window.removeEventListener('drawingDeleted', handlePathsUpdated);
        window.removeEventListener('drawingsLoaded', handlePathsUpdated);
        window.removeEventListener('floorPlanUpdated', handlePathsUpdated);
        window.removeEventListener('svgPathsUpdated', handlePathsUpdated);
        
        if (pathsTimeoutRef.current) {
          window.clearTimeout(pathsTimeoutRef.current);
        }
      };
    }
  }, [isInitialized, drawToolsRef, mountedRef, onPathsUpdated]);
  
  // Make sure we re-initialize when user changes
  useEffect(() => {
    console.log('useSvgPathTracking: User change effect triggered');
    
    const handleUserChange = () => {
      console.log('useSvgPathTracking: User change event received');
      if (drawToolsRef.current && isInitialized) {
        const paths = drawToolsRef.current.getSVGPathData();
        setSvgPaths(paths);
        
        if (onPathsUpdated) {
          onPathsUpdated(paths);
        }
      }
    };
    
    window.addEventListener('userChanged', handleUserChange);
    
    return () => {
      console.log('useSvgPathTracking: Removing user change listener');
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, [drawToolsRef, isInitialized, onPathsUpdated]);
  
  return { svgPaths, setSvgPaths };
}
