
import { useEffect, useRef, forwardRef } from 'react';
import { useLeafletContext } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet-draw';

// Configure DrawOptions interface to match what leaflet-draw requires
interface DrawOptions {
  polyline?: any;
  polygon?: any;
  circle?: any;
  rectangle?: any;
  marker?: any;
  circlemarker?: any;
}

// Interface for EditControl component props
interface EditControlProps {
  position?: string;
  draw?: DrawOptions;
  edit?: boolean | any;
  featureGroup: L.FeatureGroup;
  onCreated?: (e: any) => void;
  onEdited?: (e: any) => void;
  onDeleted?: (e: any) => void;
  ref?: any;
}

// Forward ref wrapper for EditControl component
export const EditControl = forwardRef<any, EditControlProps>(
  ({ position, onCreated, draw, edit, featureGroup, onEdited, onDeleted }, ref) => {
    const context = useLeafletContext();
    const controlRef = useRef<any>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
      if (!initializedRef.current) {
        try {
          const map = context.map;
          const container = context.layerContainer || map;

          // Make sure draw control exists
          if (!L.Control.Draw) {
            console.error('Leaflet.Draw not found, drawing features will not be available');
            return;
          }

          // Create DrawControl options
          const drawControlOptions: any = {
            edit: edit === false ? false : {
              featureGroup,
              edit: edit?.edit !== false,
              remove: edit?.remove !== false,
            },
            draw: draw
          };

          // Create DrawControl
          const drawControl = new L.Control.Draw(drawControlOptions);
          
          // Store reference to control
          controlRef.current = drawControl;

          // Add control to map
          map.addControl(drawControl);

          // Add event handlers
          map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            
            // Ensure editing is available for this layer
            if (layer.editing) {
              layer.editing.enable();
            }
            
            container.addLayer(layer);
            
            // Call onCreated if provided
            if (onCreated) {
              onCreated(e);
            }
          });

          // Editing events
          if (onEdited) {
            map.on(L.Draw.Event.EDITED, onEdited);
          }

          // Deleted events
          if (onDeleted) {
            map.on(L.Draw.Event.DELETED, onDeleted);
          }
          
          // Apply custom styles and fixes to make drawing tools more visible
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
            .leaflet-draw-toolbar-top {
              margin-top: 0 !important;
            }
            .leaflet-draw a {
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
            .leaflet-draw-draw-polygon,
            .leaflet-draw-edit-edit,
            .leaflet-draw-edit-remove {
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
          `;
          document.head.appendChild(styleEl);
          
          // Force a reflow to apply styles
          document.body.offsetHeight;
          
          // Set initialization flag
          initializedRef.current = true;
          
          // Expose drawControl through forwarded ref if present
          if (ref) {
            if (typeof ref === 'function') {
              ref(drawControl);
            } else {
              ref.current = drawControl;
            }
          }

          // Cleanup function
          return () => {
            // Remove control from map
            map.removeControl(drawControl);
            
            // Remove event listeners
            map.off(L.Draw.Event.CREATED);
            if (onEdited) map.off(L.Draw.Event.EDITED, onEdited);
            if (onDeleted) map.off(L.Draw.Event.DELETED, onDeleted);
            
            // Remove style element
            if (styleEl.parentNode) {
              styleEl.parentNode.removeChild(styleEl);
            }
            
            // Reset initialization flag
            initializedRef.current = false;
          };
        } catch (error) {
          console.error('Error initializing EditControl:', error);
        }
      }
    }, [context, draw, edit, featureGroup, onCreated, onEdited, onDeleted, ref]);

    return null;
  }
);

EditControl.displayName = 'EditControl';
