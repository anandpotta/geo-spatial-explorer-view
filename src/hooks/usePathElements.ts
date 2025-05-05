
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
  
  // Get all path elements in the feature group
  const getPathElements = useCallback((): SVGPathElement[] => {
    if (!featureGroup) return [];
    
    try {
      // Check if we have the map container
      const map = (featureGroup as any)._map;
      if (!map) return [];
      
      const container = map.getContainer();
      if (!container) return [];
      
      // Find SVG container in the overlay pane
      const overlayPane = container.querySelector('.leaflet-overlay-pane');
      if (!overlayPane) return [];
      
      // Get all path elements
      const pathElements = Array.from(overlayPane.querySelectorAll('path'));
      pathElementsRef.current = pathElements as SVGPathElement[];
      return pathElementsRef.current;
    } catch (err) {
      console.error('Error getting path elements:', err);
      return [];
    }
  }, [featureGroup]);

  // Get SVG path data from all path elements
  const getSVGPathData = useCallback((): string[] => {
    // Rate limit checking to prevent excessive DOM access
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 2000) { // 2 seconds between checks
      return pathDataRef.current;
    }
    
    lastCheckTimeRef.current = now;
    
    // Get fresh path elements
    const pathElements = getPathElements();
    if (pathElements.length === 0) return [];
    
    // Extract and update path data
    const pathData = pathElements.map(path => path.getAttribute('d')).filter(Boolean) as string[];
    pathDataRef.current = pathData;
    return pathData;
  }, [getPathElements]);

  // Clear all path elements (used for clear all operation)
  const clearPathElements = useCallback(() => {
    pathElementsRef.current = [];
    pathDataRef.current = [];
  }, []);

  return {
    getPathElements,
    getSVGPathData,
    clearPathElements
  };
}
