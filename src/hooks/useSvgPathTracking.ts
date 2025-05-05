
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
  
  // Effect for tracking SVG paths
  useEffect(() => {
    if (isInitialized && drawToolsRef.current) {
      const trackPaths = () => {
        if (!mountedRef.current) return;
        
        try {
          if (drawToolsRef.current && typeof drawToolsRef.current.getSVGPathData === 'function') {
            const paths = drawToolsRef.current.getSVGPathData();
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
        if (!mountedRef.current) return;
        
        // Debounce path tracking to prevent excessive saves
        if (pathsTimeoutRef.current) {
          window.clearTimeout(pathsTimeoutRef.current);
        }
        
        pathsTimeoutRef.current = window.setTimeout(() => {
          trackPaths();
        }, 100);
      };
      
      // Set up event listeners
      window.addEventListener('drawingCreated', handlePathsUpdated);
      window.addEventListener('drawingDeleted', handlePathsUpdated);
      window.addEventListener('drawingsLoaded', handlePathsUpdated);
      window.addEventListener('floorPlanUpdated', handlePathsUpdated);
      window.addEventListener('svgPathsUpdated', handlePathsUpdated);
      
      return () => {
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
    const handleUserChange = () => {
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
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, [drawToolsRef, isInitialized, onPathsUpdated]);
  
  return { svgPaths, setSvgPaths };
}
