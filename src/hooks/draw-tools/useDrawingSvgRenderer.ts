
import L from 'leaflet';
import { useEffect } from 'react';
import { configureSvgRenderer } from '@/utils/drawing-tools';

/**
 * Hook to configure SVG renderer for Leaflet drawing tools
 */
export function useDrawingSvgRenderer() {
  useEffect(() => {
    // Set up SVG renderer configuration to reduce flickering
    const cleanupSvgRenderer = configureSvgRenderer();
    
    return () => {
      cleanupSvgRenderer();
    };
  }, []);
}
