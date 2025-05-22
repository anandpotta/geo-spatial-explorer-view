
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { isMapValid } from '@/utils/leaflet-type-utils';
import { initializeLeafletDrawComplete } from '@/utils/leaflet-draw-initializer';
import L from 'leaflet';
import 'leaflet-draw';

interface DrawingToolHandlerProps {
  currentView: 'cesium' | 'leaflet';
  leafletMapRef: React.MutableRefObject<any>;
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  onToolSelect: (tool: string) => void;
}

const DrawingToolHandler: React.FC<DrawingToolHandlerProps> = ({
  currentView,
  leafletMapRef,
  activeTool,
  setActiveTool,
  onToolSelect
}) => {
  // Track previous tool to handle deactivation
  const [previousTool, setPreviousTool] = useState<string | null>(null);
  
  // Initialize Leaflet Draw
  useEffect(() => {
    initializeLeafletDrawComplete();
  }, []);
  
  // Effect to handle tool changes
  useEffect(() => {
    if (currentView === 'leaflet' && leafletMapRef.current) {
      if (activeTool === 'edit') {
        enableEditMode();
      } else if (previousTool === 'edit' && activeTool !== 'edit') {
        disableEditMode();
      }
      
      setPreviousTool(activeTool);
    }
  }, [activeTool, currentView, leafletMapRef]);

  // Enable edit mode on all drawable layers
  const enableEditMode = () => {
    if (!leafletMapRef.current || !isMapValid(leafletMapRef.current)) return;
    
    try {
      const map = leafletMapRef.current;
      const layers = map._layers;
      
      if (!layers) return;
      
      // Get the DrawFeatureGroup if it exists in the global window object
      // This helps with accessing the drawing feature group directly
      const featureGroup = (window as any).featureGroup || null;
      let foundDrawableLayers = false;
      
      // Make all layers editable
      Object.keys(layers).forEach(layerId => {
        const layer = layers[layerId];
        
        // Skip non-drawable layers or layers without proper geometry
        if (!layer || !layer.getLatLngs) return;
        
        // Check if this is a drawable layer
        if (layer instanceof L.Path || 
            layer instanceof L.Polyline || 
            layer instanceof L.Polygon ||
            layer instanceof L.Rectangle ||
            layer instanceof L.Circle) {
          
          foundDrawableLayers = true;
          const editableLayer = layer as any;
          
          // Create proper editing handlers based on layer type
          try {
            if (!editableLayer.editing) {
              if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
                // Make sure L.Edit.Poly is available
                if ((L.Edit as any).Poly) {
                  editableLayer.editing = new (L.Edit as any).Poly(layer);
                }
              } else if (layer instanceof L.Rectangle) {
                // Make sure L.Edit.Rectangle is available
                if ((L.Edit as any).Rectangle) {
                  editableLayer.editing = new (L.Edit as any).Rectangle(layer as any);
                }
              } else if (layer instanceof L.Circle) {
                // Make sure L.Edit.Circle is available
                if ((L.Edit as any).Circle) {
                  editableLayer.editing = new (L.Edit as any).Circle(layer as any);
                }
              }
            }
            
            // Enable editing if handler was successfully created
            if (editableLayer.editing && typeof editableLayer.editing.enable === 'function') {
              editableLayer.editing.enable();
            }
          } catch (err) {
            console.error('Error setting up edit handler for layer:', err);
          }
        }
      });
      
      // If we found drawable layers, show success message
      if (foundDrawableLayers) {
        toast.info('Edit mode enabled. Click any shape to modify it.');
      } else {
        toast.info('No editable shapes found. Try drawing something first.');
      }
    } catch (err) {
      console.error('Error enabling edit mode:', err);
      toast.error('Failed to enable edit mode');
    }
  };

  // Disable edit mode on all layers
  const disableEditMode = () => {
    if (!leafletMapRef.current || !isMapValid(leafletMapRef.current)) return;
    
    try {
      const map = leafletMapRef.current;
      const layers = map._layers;
      
      if (!layers) return;
      
      // Disable editing on all layers
      Object.keys(layers).forEach(layerId => {
        const layer = layers[layerId];
        if (!layer) return;
        
        const editableLayer = layer as any;
        if (editableLayer && editableLayer.editing && 
            typeof editableLayer.editing.disable === 'function') {
          editableLayer.editing.disable();
        }
      });
      
      toast.info('Edit mode disabled');
    } catch (err) {
      console.error('Error disabling edit mode:', err);
    }
  };

  const handleToolSelect = (tool: string) => {
    console.log(`Tool selected: ${tool}`);
    setActiveTool(tool === activeTool ? null : tool);
    onToolSelect(tool);
    
    if (currentView === 'cesium') {
      if (tool === 'clear') {
        toast.info('Clearing all shapes');
      }
    } else if (currentView === 'leaflet') {
      if (tool === 'clear' && leafletMapRef.current) {
        try {
          // Validate the map instance before using it
          if (isMapValid(leafletMapRef.current)) {
            const layers = leafletMapRef.current._layers;
            if (layers) {
              Object.keys(layers).forEach(layerId => {
                const layer = layers[layerId];
                if (layer && layer.options && (layer.options.isDrawn || layer.options.id)) {
                  leafletMapRef.current.removeLayer(layer);
                }
              });
              toast.info('All shapes cleared');
            }
          } else {
            console.warn('Leaflet map instance is not valid for clear operation');
            toast.error('Map control error. Please try again.');
          }
        } catch (err) {
          console.error('Error during clear operation:', err);
          toast.error('Failed to clear shapes. Please try again.');
        }
      }
    }
  };

  return null; // This is a logic component with no UI
};

export default DrawingToolHandler;
