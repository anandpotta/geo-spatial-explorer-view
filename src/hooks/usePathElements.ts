
import { useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { extractSvgPaths } from '@/utils/svg-path-utils';

/**
 * Hook for managing SVG path elements in a feature group
 */
export function usePathElements(featureGroup: L.FeatureGroup | null) {
  const pathElementsRef = useRef<SVGPathElement[]>([]);
  const pathDataRef = useRef<string[]>([]);
  const lastCheckTimeRef = useRef<number>(0);
  const cachedPathDataRef = useRef<string>('');
  
  // Get all path elements in the feature group
  const getPathElements = useCallback((): SVGPathElement[] => {
    if (!featureGroup) return [];
    
    try {
      // Rate limit checking to prevent excessive DOM access
      const now = Date.now();
      if (now - lastCheckTimeRef.current < 5000) { // 5 seconds between full DOM checks
        return pathElementsRef.current;
      }
      
      // Check if we have the map container
      const map = (featureGroup as any)._map;
      if (!map) return pathElementsRef.current;
      
      const container = map.getContainer();
      if (!container) return pathElementsRef.current;
      
      // Find SVG container in the overlay pane
      const overlayPane = container.querySelector('.leaflet-overlay-pane');
      if (!overlayPane) return pathElementsRef.current;
      
      // Get all path elements
      const pathElements = Array.from(overlayPane.querySelectorAll('path'));
      
      // Only update the ref if the path count has changed to minimize object creation
      if (pathElements.length !== pathElementsRef.current.length) {
        pathElementsRef.current = pathElements as SVGPathElement[];
        lastCheckTimeRef.current = now;
      }
      
      return pathElementsRef.current;
    } catch (err) {
      console.error('Error getting path elements:', err);
      return pathElementsRef.current;
    }
  }, [featureGroup]);

  // Get SVG path data from all path elements with strong caching
  const getSVGPathData = useCallback((): string[] => {
    // Rate limit checking to prevent excessive DOM access
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 5000) { // 5 seconds between checks
      return pathDataRef.current;
    }
    
    lastCheckTimeRef.current = now;
    
    // Get fresh path elements
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
    }
    
    return pathDataRef.current;
  }, [getPathElements]);

  // Clear all path elements (used for clear all operation)
  const clearPathElements = useCallback(() => {
    pathElementsRef.current = [];
    pathDataRef.current = [];
    cachedPathDataRef.current = '';
    lastCheckTimeRef.current = 0;
  }, []);

  return {
    getPathElements,
    getSVGPathData,
    clearPathElements
  };
}
