
import { useEffect, RefObject } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';

/**
 * Hook to set up Leaflet SVG renderer for all paths
 */
export function useSvgRenderer(featureGroup: L.FeatureGroup | null) {
  // Force SVG renderer but in a safer way
  useEffect(() => {
    // This effect will ensure all layers use SVG renderer
    if (!featureGroup) return;
    
    try {
      // Override the _updatePath method once the featureGroup is ready
      const pathPrototype = L.Path.prototype as any;
      if (!pathPrototype._originalUpdatePath) {
        pathPrototype._originalUpdatePath = pathPrototype._updatePath;
        
        pathPrototype._updatePath = function() {
          if (this.options && !this.options.renderer) {
            this.options.renderer = L.svg();
          }
          pathPrototype._originalUpdatePath.call(this);
        };
      }
    } catch (err) {
      console.error('Error setting up SVG renderer:', err);
    }
    
    return () => {
      // Restore original function when component unmounts
      try {
        const pathPrototype = L.Path.prototype as any;
        if (pathPrototype._originalUpdatePath) {
          pathPrototype._updatePath = pathPrototype._originalUpdatePath;
          delete pathPrototype._originalUpdatePath;
        }
      } catch (err) {
        console.error('Error restoring path prototype:', err);
      }
    };
  }, [featureGroup]);
}

/**
 * Hook to ensure draw controls remain visible
 */
export function useDrawControlsVisibility() {
  useEffect(() => {
    const ensureControlsVisibility = () => {
      // Find and force visibility of draw control elements
      const drawControls = document.querySelectorAll('.leaflet-draw.leaflet-control');
      drawControls.forEach(control => {
        (control as HTMLElement).style.display = 'block';
        (control as HTMLElement).style.visibility = 'visible';
        (control as HTMLElement).style.opacity = '1';
        (control as HTMLElement).style.zIndex = '12000';
      });
      
      // Also ensure toolbar is visible
      const toolbars = document.querySelectorAll('.leaflet-draw-toolbar');
      toolbars.forEach(toolbar => {
        (toolbar as HTMLElement).style.display = 'block';
        (toolbar as HTMLElement).style.visibility = 'visible';
        (toolbar as HTMLElement).style.opacity = '1';
        (toolbar as HTMLElement).style.zIndex = '12000';
      });
    };
    
    // Run immediately and set up an interval to maintain visibility
    ensureControlsVisibility();
    const intervalId = setInterval(ensureControlsVisibility, 500);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
}

/**
 * Hook to clean up EditControl when component unmounts
 */
export function useEditControlCleanup(editControlRef: RefObject<any>) {
  useEffect(() => {
    return () => {
      if (editControlRef.current && editControlRef.current._toolbars) {
        try {
          // Disable any active handlers before unmounting
          if (editControlRef.current._toolbars.edit) {
            Object.values(editControlRef.current._toolbars.edit._modes).forEach((mode: any) => {
              if (mode && mode.handler && mode.handler.disable && typeof mode.handler.disable === 'function') {
                try {
                  mode.handler.disable();
                } catch (err) {
                  console.error('Error disabling edit mode:', err);
                }
              }
            });
          }
        } catch (err) {
          console.error('Error cleaning up edit control:', err);
        }
      }
    };
  }, [editControlRef]);
}
