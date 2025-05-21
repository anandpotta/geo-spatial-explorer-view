
import { useEffect, useRef, forwardRef } from 'react';
import { useLeafletContext } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet-draw';

// Interface for EditControl component props
interface EditControlProps {
  position?: string;
  draw?: any;
  edit?: boolean | any;
  featureGroup: L.FeatureGroup;
  onCreated?: (e: any) => void;
  onEdited?: (e: any) => void;
  onDeleted?: (e: any) => void;
  ref?: any;
}

/**
 * A safer implementation of EditControl that properly handles cleanup
 * to prevent the "dispose" error during unmounting
 */
export const EditControl = forwardRef<any, EditControlProps>(
  ({ position, onCreated, draw, edit, featureGroup, onEdited, onDeleted }, ref) => {
    const context = useLeafletContext();
    const controlRef = useRef<any>(null);
    const mapRef = useRef<L.Map | null>(null);
    const eventHandlersRef = useRef<{ [key: string]: (e: any) => void }>({});
    const isInitializedRef = useRef(false);
    const isUnmountingRef = useRef(false);

    useEffect(() => {
      try {
        const map = context.map;
        mapRef.current = map;
        const container = context.layerContainer || map;

        // Prevent multiple initializations
        if (isInitializedRef.current) return;

        // Mark component as initialized
        isInitializedRef.current = true;
        
        console.log('Initializing EditControl with feature group:', featureGroup);

        // Prepare edit options considering the featureGroup
        const editOptions = edit === false 
          ? false 
          : {
              featureGroup,
              edit: edit?.edit !== false,
              remove: edit?.remove !== false,
            };

        // Create DrawControl options
        const drawControlOptions: any = {
          edit: editOptions,
          draw: draw,
          position: position || 'topright'
        };

        // Create DrawControl
        const drawControl = new L.Control.Draw(drawControlOptions);
        
        // Store reference to control
        controlRef.current = drawControl;

        // Add control to map
        map.addControl(drawControl);

        // Store event handlers for later removal
        if (onCreated) {
          const createdHandler = (e: any) => {
            try {
              const layer = e.layer;
              
              // Ensure editing is available for this layer
              if (layer.editing) {
                layer.editing.enable();
              }
              
              container.addLayer(layer);
              onCreated(e);
            } catch (err) {
              console.error('Error in created handler:', err);
            }
          };
          
          map.on(L.Draw.Event.CREATED, createdHandler);
          eventHandlersRef.current.created = createdHandler;
        }

        if (onEdited) {
          map.on(L.Draw.Event.EDITED, onEdited);
          eventHandlersRef.current.edited = onEdited;
        }

        if (onDeleted) {
          map.on(L.Draw.Event.DELETED, onDeleted);
          eventHandlersRef.current.deleted = onDeleted;
        }
        
        // Apply styles to ensure drawing tools are visible
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
          .leaflet-draw-toolbar {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .leaflet-draw {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 1000 !important;
          }
        `;
        document.head.appendChild(styleEl);

        // Expose control through ref if provided
        if (ref) {
          if (typeof ref === 'function') {
            ref(drawControl);
          } else {
            ref.current = drawControl;
          }
        }

        // Cleanup function with extra safety checks
        return () => {
          try {
            // Set unmounting flag to prevent further operations
            isUnmountingRef.current = true;
            
            console.log('Cleaning up EditControl');
            
            // Remove event listeners with extra guards
            if (mapRef.current) {
              if (eventHandlersRef.current.created) {
                mapRef.current.off(L.Draw.Event.CREATED, eventHandlersRef.current.created);
              }
              if (eventHandlersRef.current.edited) {
                mapRef.current.off(L.Draw.Event.EDITED, eventHandlersRef.current.edited);
              }
              if (eventHandlersRef.current.deleted) {
                mapRef.current.off(L.Draw.Event.DELETED, eventHandlersRef.current.deleted);
              }
            }
            
            // Safely remove control with extra guards
            if (controlRef.current && mapRef.current) {
              try {
                // Pre-emptively clean up references that could cause errors
                if (controlRef.current._toolbars) {
                  Object.values(controlRef.current._toolbars).forEach((toolbar: any) => {
                    if (!toolbar) return;
                    
                    // Clean up all modes in this toolbar
                    if (toolbar._modes) {
                      Object.values(toolbar._modes).forEach((mode: any) => {
                        if (!mode || !mode.handler) return;
                        
                        // Disable the handler to prevent operations during unmount
                        if (mode.handler.disable && typeof mode.handler.disable === 'function') {
                          try {
                            mode.handler.disable();
                          } catch (e) {
                            console.warn('Error disabling handler:', e);
                          }
                        }
                        
                        // Clear references to prevent dispose errors
                        if (mode.handler._shape) mode.handler._shape = null;
                        if (mode.handler._shapes) mode.handler._shapes = null;
                        if (mode.handler._map) mode.handler._map = null;
                        
                        // Mark as disposed to prevent multiple disposal attempts
                        mode.handler._disposed = true;
                      });
                    }
                    
                    // Set toolbar as inactive
                    if (toolbar.disable && typeof toolbar.disable === 'function') {
                      try {
                        toolbar.disable();
                      } catch (e) {
                        console.warn('Error disabling toolbar:', e);
                      }
                    }
                  });
                }
                
                // Finally remove the control from the map
                mapRef.current.removeControl(controlRef.current);
              } catch (err) {
                console.warn('Error removing control:', err);
              }
            }
            
            // Clear references
            controlRef.current = null;
            mapRef.current = null;
            eventHandlersRef.current = {};
            
            // Remove the style element if it was added
            const styleElements = document.querySelectorAll('style');
            styleElements.forEach(el => {
              if (el.innerHTML.includes('leaflet-draw-toolbar')) {
                el.remove();
              }
            });
            
            // Reset initialization flag
            isInitializedRef.current = false;
            
          } catch (error) {
            console.warn('Error during EditControl cleanup:', error);
          }
        };
      } catch (error) {
        console.error('Error initializing EditControl:', error);
        return () => {};
      }
    }, []);

    return null;
  }
);

EditControl.displayName = 'EditControl';
