
import L from 'leaflet';
import { getMapFromLayer, safelyDisableEditForLayer } from './index';

/**
 * Safely applies patches to edit handlers to prevent common errors
 */
export const makeEditHandlersSafe = (editControlRef: React.RefObject<any>): void => {
  try {
    if (editControlRef.current && editControlRef.current._toolbars) {
      const editToolbar = editControlRef.current._toolbars.edit;
      
      if (editToolbar && editToolbar._modes) {
        // Add safety to all edit modes
        Object.values(editToolbar._modes).forEach((mode: any) => {
          if (!mode || !mode.handler) return;
          
          // Patch missing functions that could cause errors
          if (mode.handler._verticesHandlers) {
            Object.values(mode.handler._verticesHandlers).forEach((handler: any) => {
              // Ensure these methods exist to prevent errors
              if (handler) {
                if (!handler.dispose) handler.dispose = function() {};
                if (!handler.disable) handler.disable = function() {};
              }
            });
          }
          
          // Patch any other potential error points
          if (!mode.handler.dispose) mode.handler.dispose = function() {};
        });
      }
    }
  } catch (err) {
    console.error('Error applying safety patches to edit handlers:', err);
  }
};

/**
 * Cleans up edit handlers before unmounting
 */
export const cleanupEditHandlers = (
  editControlRef: React.RefObject<any>,
  featureGroup: L.FeatureGroup
): void => {
  try {
    if (editControlRef.current && editControlRef.current._toolbars) {
      // Safely disable any active handlers before unmounting
      if (editControlRef.current._toolbars.edit) {
        Object.values(editControlRef.current._toolbars.edit._modes || {}).forEach((mode: any) => {
          if (!mode) return;
          
          if (mode.handler && typeof mode.handler.disable === 'function') {
            try {
              mode.handler.disable();
            } catch (err) {
              console.error('Error disabling edit mode handler:', err);
            }
          }
          
          // Also check for dispose method and make it safe
          if (mode.handler) {
            if (typeof mode.handler.dispose === 'function') {
              try {
                mode.handler.dispose();
              } catch (err) {
                console.error('Error disposing edit mode handler:', err);
              }
            } else {
              // Add a safe dispose method if missing
              mode.handler.dispose = function() {};
            }
            
            // Reset the handler completely to avoid further issues
            Object.keys(mode.handler).forEach(key => {
              try {
                if (typeof mode.handler[key] === 'object' && mode.handler[key] !== null) {
                  mode.handler[key] = null;
                }
              } catch (e) {
                // Silent cleanup
              }
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('Error cleaning up edit control toolbars:', err);
  }
  
  // Schedule cleanup with timeout to ensure it runs after react-leaflet's cleanup
  setTimeout(() => {
    try {
      // Manually remove all editing capabilities from layers
      if (featureGroup) {
        featureGroup.eachLayer((layer: any) => {
          safelyDisableEditForLayer(layer);
        });
      }
    } catch (err) {
      console.error('Error in delayed cleanup:', err);
    }
  }, 0);
};

/**
 * Sets up SVG renderer for Leaflet paths
 */
export const setupSvgRenderer = (): (() => void) => {
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
    
    // Return cleanup function
    return () => {
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
  } catch (err) {
    console.error('Error setting up SVG renderer:', err);
    return () => {};
  }
};
