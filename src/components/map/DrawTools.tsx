import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import { toast } from 'sonner';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getMapFromLayer, safelyDisableEditForLayer } from '@/utils/leaflet';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  const isComponentMounted = useRef(true);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

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
    
    // Initialize the global cleanup timers array if it doesn't exist
    if (!window._leafletCleanupTimers) {
      window._leafletCleanupTimers = [];
    }
    
    // Mark any handlers to make them safe
    const makeEditHandlersSafe = () => {
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
    
    // Add this to cleanup functions
    cleanupFunctionsRef.current.push(makeEditHandlersSafe);
    
    return () => {
      // Mark component as unmounted to prevent further operations
      isComponentMounted.current = false;
      
      // Run all registered cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (err) {
          console.error('Error running cleanup function:', err);
        }
      });
      
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

  // Make sure the edit control is properly disposed when component unmounts
  useEffect(() => {
    // Run safety patches early
    const applySafetyPatches = () => {
      if (!editControlRef.current) return;
      setTimeout(() => {
        try {
          if (editControlRef.current && editControlRef.current._toolbars) {
            const editToolbar = editControlRef.current._toolbars.edit;
            
            if (editToolbar && editToolbar._modes) {
              Object.values(editToolbar._modes).forEach((mode: any) => {
                if (!mode || !mode.handler) return;
                
                // Make dispose and disable safe methods
                if (!mode.handler.dispose) mode.handler.dispose = function() {};
                if (!mode.handler.disable) mode.handler.disable = function() {};
                
                // Special handling for vertex handlers which cause most errors
                if (mode.handler._verticesHandlers) {
                  Object.values(mode.handler._verticesHandlers).forEach((handler: any) => {
                    if (handler) {
                      // Add safe methods
                      if (!handler.dispose) handler.dispose = function() {};
                      if (!handler.disable) handler.disable = function() {};
                    }
                  });
                }
              });
            }
          }
        } catch (err) {
          console.warn('Error applying safety patches:', err);
        }
      }, 200);
    };
    
    // Apply patches when editControl is available
    if (editControlRef.current) {
      applySafetyPatches();
    }
    
    return () => {
      if (!isComponentMounted.current) return;

      try {
        if (editControlRef.current) {
          // Prepare a cleanup function for all edit handlers
          const cleanupFunction = () => {
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
          };
          
          // Add to cleanup functions
          cleanupFunctionsRef.current.push(cleanupFunction);
          
          // Schedule cleanup with timeout to ensure it runs after react-leaflet's cleanup
          const timerId = setTimeout(() => {
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
          
          // Track the timeout so it can be cleared if needed
          if (window._leafletCleanupTimers) {
            // Convert the NodeJS.Timeout to a number
            window._leafletCleanupTimers.push(Number(timerId));
          }
        }
      } catch (err) {
        console.error('Error setting up edit control cleanup:', err);
      }
    };
  }, [featureGroup]);

  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    getPathElements: () => {
      const pathElements: SVGPathElement[] = [];
      // Find all SVG paths within the map container
      if (featureGroup) {
        const map = getMapFromLayer(featureGroup);
        if (map) {
          const container = map.getContainer();
          if (container) {
            const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg');
            svgElements.forEach(svg => {
              const paths = svg.querySelectorAll('path');
              paths.forEach(path => {
                pathElements.push(path as SVGPathElement);
              });
            });
          }
        }
      }
      return pathElements;
    },
    getSVGPathData: () => {
      const pathData: string[] = [];
      // Find all SVG paths within the map container
      if (featureGroup) {
        const map = getMapFromLayer(featureGroup);
        if (map) {
          const container = map.getContainer();
          if (container) {
            const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg');
            svgElements.forEach(svg => {
              const paths = svg.querySelectorAll('path');
              paths.forEach(path => {
                pathData.push(path.getAttribute('d') || '');
              });
            });
          }
        }
      }
      return pathData;
    }
  }));

  const handleCreated = (e: any) => {
    if (!isComponentMounted.current) return;
    
    try {
      const { layerType, layer } = e;
      
      if (!layer) {
        console.error('No layer created');
        return;
      }
      
      // Create a properly structured shape object
      let shape: any = { type: layerType, layer };
      
      // Extract SVG path data if available
      if (layer._path) {
        shape.svgPath = layer._path.getAttribute('d');
      }
      
      // For markers, extract position information
      if (layerType === 'marker' && layer.getLatLng) {
        const position = layer.getLatLng();
        shape.position = [position.lat, position.lng];
      }
      
      // For polygons, rectangles, and circles
      else if (['polygon', 'rectangle', 'circle'].includes(layerType)) {
        // Convert to GeoJSON to have a consistent format
        shape.geoJSON = layer.toGeoJSON();
        
        // Extract coordinates based on shape type
        if (layerType === 'polygon' || layerType === 'rectangle') {
          const latLngs = layer.getLatLngs();
          if (Array.isArray(latLngs) && latLngs.length > 0) {
            // Handle potentially nested arrays (multi-polygons)
            const firstRing = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;
            shape.coordinates = firstRing.map((ll: L.LatLng) => [ll.lat, ll.lng]);
          }
        } else if (layerType === 'circle') {
          const center = layer.getLatLng();
          shape.coordinates = [[center.lat, center.lng]];
          shape.radius = layer.getRadius();
        }
      }
      
      // Wait for the next tick to ensure DOM is updated
      setTimeout(() => {
        // Only proceed if the component is still mounted
        if (!isComponentMounted.current) return;
        
        // Try to get SVG path data after layer is rendered
        if (!shape.svgPath && layer._path) {
          shape.svgPath = layer._path.getAttribute('d');
        }
        
        onCreated(shape);
      }, 50);
    } catch (err) {
      console.error('Error handling created shape:', err);
      toast.error('Error creating shape');
    }
  };

  if (!featureGroup) {
    console.warn('DrawTools received null or undefined featureGroup');
    return null;
  }

  return (
    <EditControl
      ref={editControlRef}
      position="topright"
      draw={{
        rectangle: true,
        polygon: true,
        circle: true,
        circlemarker: false,
        marker: true,
        polyline: false
      }}
      edit={{
        featureGroup: featureGroup,
        edit: {
          selectedPathOptions: {
            maintainColor: false,
            opacity: 0.7
          }
        },
        remove: true
      }}
      onCreated={handleCreated}
      featureGroup={featureGroup}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
