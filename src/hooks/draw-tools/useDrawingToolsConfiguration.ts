
import L from 'leaflet';
import { useEffect } from 'react';
import { useDrawingSvgRenderer } from './useDrawingSvgRenderer';
import { useDrawingOptimizations } from './useDrawingOptimizations';
import { useDrawingStyleEnhancer } from './useDrawingStyleEnhancer';
import { useDrawingPathTracking } from './useDrawingPathTracking';

/**
 * Main hook to handle SVG configuration and optimizations for drawing tools
 * This hook combines all individual hooks into one for easier usage
 */
export function useDrawingToolsConfiguration(featureGroup: L.FeatureGroup | null) {
  // Basic setup and optimizations
  useDrawingSvgRenderer();
  useDrawingOptimizations();
  
  useEffect(() => {
    if (!featureGroup) return;
    
    // Fix: Don't use getMap as it doesn't exist on FeatureGroup
    // Use type assertion to access _map internally without TypeScript errors
    const map = (featureGroup as any)._map;
    if (!map) return;
    
    // Get map container for style enhancements
    const mapContainer = map.getContainer();
    
    // No cleanup needed for this effect
  }, [featureGroup]);
  
  // Use separate hooks for different functionality
  const mapContainer = featureGroup ? (featureGroup as any)._map?.getContainer() : null;
  const map = featureGroup ? (featureGroup as any)._map : null;
  
  // Apply style enhancements
  useDrawingStyleEnhancer(mapContainer);
  
  // Path tracking and preservation
  useDrawingPathTracking(map, featureGroup);
}
