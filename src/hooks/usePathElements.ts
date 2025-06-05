
import { useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';

/**
 * Hook for managing SVG path elements in a feature group
 */
export function usePathElements(featureGroup: L.FeatureGroup | null) {
  const pathElementsRef = useRef<SVGPathElement[]>([]);
  const pathDataRef = useRef<string[]>([]);
  const lastCheckTimeRef = useRef<number>(0);
  const cachedPathDataRef = useRef<string>('');
  const isUpdatingRef = useRef<boolean>(false);
  
  // Get all path elements in the feature group with heavy caching
  const getPathElements = useCallback((): SVGPathElement[] => {
    if (!featureGroup || isUpdatingRef.current) return pathElementsRef.current;
    
    try {
      // Rate limit checking to prevent excessive DOM access - increased to 10 seconds
      const now = Date.now();
      if (now - lastCheckTimeRef.current < 10000) {
        return pathElementsRef.current;
      }
      
      isUpdatingRef.current = true;
      
      // Check if we have the map container
      const map = (featureGroup as any)._map;
      if (!map) {
        isUpdatingRef.current = false;
        return pathElementsRef.current;
      }
      
      const container = map.getContainer();
      if (!container) {
        isUpdatingRef.current = false;
        return pathElementsRef.current;
      }
      
      // Find SVG container in the overlay pane
      const overlayPane = container.querySelector('.leaflet-overlay-pane');
      if (!overlayPane) {
        isUpdatingRef.current = false;
        return pathElementsRef.current;
      }
      
      // Get all path elements
      const pathElements = Array.from(overlayPane.querySelectorAll('path'));
      
      // Only update the ref if the path count has changed significantly
      if (Math.abs(pathElements.length - pathElementsRef.current.length) > 0) {
        pathElementsRef.current = pathElements as SVGPathElement[];
        lastCheckTimeRef.current = now;
      }
      
      isUpdatingRef.current = false;
      return pathElementsRef.current;
    } catch (err) {
      console.error('Error getting path elements:', err);
      isUpdatingRef.current = false;
      return pathElementsRef.current;
    }
  }, [featureGroup]);

  // Get SVG path data with very aggressive caching
  const getSVGPathData = useCallback((): string[] => {
    if (isUpdatingRef.current) return pathDataRef.current;
    
    // Rate limit checking to prevent excessive DOM access - increased to 10 seconds
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 10000) {
      return pathDataRef.current;
    }
    
    // Get fresh path elements only if enough time has passed
    const pathElements = getPathElements();
    if (pathElements.length === 0) return pathDataRef.current;
    
    // Extract path data
    const newPathData = pathElements
      .map(path => path.getAttribute('d'))
      .filter(Boolean) as string[];
    
    // Create a simple fingerprint of the paths
    const pathDataString = newPathData.join('|');
    
    // Only update if data has actually changed
    if (pathDataString !== cachedPathDataRef.current) {
      cachedPathDataRef.current = pathDataString;
      pathDataRef.current = newPathData;
      lastCheckTimeRef.current = now;
    }
    
    return pathDataRef.current;
  }, [getPathElements]);

  // Clear all path elements (used for clear all operation)
  const clearPathElements = useCallback(() => {
    pathElementsRef.current = [];
    pathDataRef.current = [];
    cachedPathDataRef.current = '';
    lastCheckTimeRef.current = 0;
    isUpdatingRef.current = false;
  }, []);

  return {
    getPathElements,
    getSVGPathData,
    clearPathElements
  };
}
