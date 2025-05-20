
import React, { useEffect, useRef } from 'react';
import { useLeafletContext } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet-draw';

// Ensure we have the default marker icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface EditControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  onCreated?: (e: any) => void;
  onEdited?: (e: any) => void;
  onDeleted?: (e: any) => void;
  draw?: any;
  edit?: any;
  featureGroup: L.FeatureGroup;
}

export const EditControl = React.forwardRef<any, EditControlProps>((props, ref) => {
  const context = useLeafletContext();
  const controlRef = useRef<L.Control.Draw | null>(null);
  const editToolsInitializedRef = useRef(false);

  useEffect(() => {
    const map = context.map;
    const container = context.layerContainer || map;
    
    // Ensure the feature group is added to the map
    if (props.featureGroup && !map.hasLayer(props.featureGroup)) {
      props.featureGroup.addTo(map);
    }

    // Create draw control if it doesn't exist
    if (!controlRef.current) {
      controlRef.current = new L.Control.Draw({
        position: props.position || 'topright',
        draw: props.draw,
        edit: {
          ...props.edit,
          featureGroup: props.featureGroup
        }
      });

      // Add the control to the map
      map.addControl(controlRef.current);
      console.log("Draw control added to map");
      
      // Set editToolsInitialized
      editToolsInitializedRef.current = true;
      
      // Set up event listeners
      map.on(L.Draw.Event.CREATED, (e) => {
        const layer = e.layer;
        props.featureGroup.addLayer(layer);
        
        if (props.onCreated) {
          props.onCreated(e);
        }
        
        // Dispatch custom event
        document.dispatchEvent(new Event('leaflet:drawn'));
      });
      
      if (props.onEdited) {
        map.on(L.Draw.Event.EDITED, props.onEdited);
      }
      
      if (props.onDeleted) {
        map.on(L.Draw.Event.DELETED, props.onDeleted);
      }
      
      // Handle ref
      if (ref) {
        if (typeof ref === 'function') {
          ref(controlRef.current);
        } else {
          (ref as React.MutableRefObject<any>).current = controlRef.current;
        }
      }
    }
    
    // Force control to be visible after a short delay
    const timer = setTimeout(() => {
      if (editToolsInitializedRef.current) {
        const editControl = document.querySelector('.leaflet-draw.leaflet-control');
        if (editControl) {
          (editControl as HTMLElement).style.display = 'block';
          (editControl as HTMLElement).style.visibility = 'visible';
          console.log("Edit control visibility enforced");
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (controlRef.current) {
        map.off(L.Draw.Event.CREATED);
        if (props.onEdited) map.off(L.Draw.Event.EDITED);
        if (props.onDeleted) map.off(L.Draw.Event.DELETED);
        map.removeControl(controlRef.current);
        controlRef.current = null;
        editToolsInitializedRef.current = false;
      }
    };
  }, [context, props.position, props.draw, props.edit, props.onCreated, props.onEdited, props.onDeleted]);

  return null;
});

EditControl.displayName = 'EditControl';
