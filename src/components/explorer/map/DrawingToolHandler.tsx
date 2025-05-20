
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { isMapValid } from '@/utils/leaflet-type-utils';
import L from 'leaflet';

interface DrawingToolHandlerProps {
  currentView: 'cesium' | 'leaflet';
  leafletMapRef: React.MutableRefObject<any>;
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  onToolSelect: (tool: string) => void;
}

// Define interface for internal map properties not exposed in TypeScript definitions
interface LeafletMapInternal extends L.Map {
  _layers?: Record<string, L.Layer>;
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
  }, [activeTool, currentView]);

  // Enable edit mode on all drawable layers
  const enableEditMode = () => {
    if (!leafletMapRef.current || !isMapValid(leafletMapRef.current)) return;
    
    try {
      const map = leafletMapRef.current as LeafletMapInternal;
      const layers = map._layers;
      
      if (!layers) return;
      
      // Make all layers editable
      Object.keys(layers).forEach(layerId => {
        const layer = layers[layerId];
        
        // Check if this is a drawable layer
        if (layer && 
            (layer instanceof L.Path || 
             layer instanceof L.Polyline || 
             layer instanceof L.Polygon ||
             layer instanceof L.Rectangle ||
             layer instanceof L.Circle)) {
          
          // Use type assertion to access editing property
          const editableLayer = layer as any;
          
          // Ensure edit handlers are added to the layer
          if (!editableLayer.editing) {
            // Create editing capability if it doesn't exist
            if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
              editableLayer.editing = new (L.Edit as any).Poly(layer);
            } else if (layer instanceof L.Rectangle) {
              editableLayer.editing = new (L.Edit as any).Rectangle(layer);
            } else if (layer instanceof L.Circle) {
              editableLayer.editing = new (L.Edit as any).Circle(layer);
            }
          }
          
          // Only enable if it has an editing capability
          if (editableLayer.editing && typeof editableLayer.editing.enable === 'function') {
            editableLayer.editing.enable();
          }
        }
      });
      
      toast.info('Edit mode enabled. Click any shape to modify it.');
    } catch (err) {
      console.error('Error enabling edit mode:', err);
      toast.error('Failed to enable edit mode');
    }
  };

  // Disable edit mode on all layers
  const disableEditMode = () => {
    if (!leafletMapRef.current || !isMapValid(leafletMapRef.current)) return;
    
    try {
      const map = leafletMapRef.current as LeafletMapInternal;
      const layers = map._layers;
      
      if (!layers) return;
      
      // Disable editing on all layers
      Object.keys(layers).forEach(layerId => {
        const layer = layers[layerId];
        const editableLayer = layer as any;
        if (editableLayer && editableLayer.editing && typeof editableLayer.editing.disable === 'function') {
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
            const internalMap = leafletMapRef.current as LeafletMapInternal;
            const layers = internalMap._layers;
            if (layers) {
              Object.keys(layers).forEach(layerId => {
                const layer = layers[layerId];
                if (layer && (layer as any).options && ((layer as any).options.isDrawn || (layer as any).options.id)) {
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
