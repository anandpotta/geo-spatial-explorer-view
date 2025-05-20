
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { isMapValid, LeafletMapInternal, ExtendedLayer } from '@/utils/leaflet-type-utils';
import L from 'leaflet';

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
  
  // Effect to handle tool changes
  useEffect(() => {
    if (currentView === 'leaflet' && leafletMapRef.current) {
      if (activeTool === 'edit') {
        enableEditMode();
      } else if (previousTool === 'edit' && activeTool !== 'edit') {
        disableEditMode();
      }
      
      // When marker tool is selected, ensure leaflet-draw markers will be draggable
      if (activeTool === 'marker') {
        configureMarkerTool();
      }
      
      setPreviousTool(activeTool);
    }
  }, [activeTool, currentView]);

  // Configure the marker tool to create draggable markers
  const configureMarkerTool = () => {
    try {
      // Override leaflet-draw marker creation to ensure draggable
      if (L.Draw && L.Draw.Marker) {
        const originalMarkerCreate = L.Draw.Marker.prototype.addHooks;
        L.Draw.Marker.prototype.addHooks = function() {
          // Call the original method
          originalMarkerCreate.call(this);
          
          // Override options to ensure draggable
          if (this.options) {
            this.options.icon = L.icon({
              iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAGmklEQVRYw7VXeUyTZxjvNnfELFuyIzOabermMZEeQC/OclkO49CpOHXOLJl/CAURuYbQi3KLgEhbrhZ1aDwmaoGqKII6odATmH/scDFbdC7LvFqOCc+e95s2VG50X/LLm/f4/Z7neV/zCGcZcv6wLcePHj82DmMGw8CcZzBsYBjd8BTUVtligVW3x+Yy8WRzvq6aX+qgKbraJFXQicLnkHPOcaXVMo5NRSR0XbFJz5rv0SYKFFbUotVOgRTIuWcY1pPDarXVe40jeJA9iJKS1nRDk7fDdLhZuqpfzS0o5QOCJT5SMpYbqNTd7jew5isnSNEyX02f1pvYCx2Mh34MGMwWaftILH5TQHBtGdadaRUvQnP3K/WzCkLMAR7EandxiCd0AsHTH6ULmw0wHwh7FiFot/EAfOS90ESHMvPsb4no7mWP3dsnUVlQQ3y6ZC6J1AVRAcHkc9roPYC0/vCtgSBxkM+2FahWRW+tGDAtCCuX0wVBWb0Als5QxnZoUhXeUO7mXp9Kx4ISJ0QKN41y9HJXRKfqdSwn4tWMgmx6NjAJx8roRB+BsGSSWWeXHTPAs0MxA5AIfkc6JFSX+XNXtDCVnCYEndxbwknQCEmxiPMIn+DX8FR+SJj8WKrVIgmIH29fMrRgM2aixKQbSBEwGKu+dHEV+WWtgrLfKH0',
              className: 'leaflet-marker-draggable'
            });
            this.options.draggable = true;
          }
        };
      }
      
      // Add a listener to catch markers when they're created
      document.addEventListener('mouseup', checkForNewMarkers);
      
    } catch (err) {
      console.error('Error configuring marker tool:', err);
    }
  };
  
  // Check for newly created markers and make them draggable
  const checkForNewMarkers = () => {
    setTimeout(() => {
      const markerElements = document.querySelectorAll('.leaflet-marker-icon:not(.leaflet-marker-draggable)');
      markerElements.forEach(marker => {
        marker.classList.add('leaflet-marker-draggable');
        
        // Find the marker instance in the map and make it draggable
        if (leafletMapRef.current && isMapValid(leafletMapRef.current)) {
          const map = leafletMapRef.current as LeafletMapInternal;
          const layers = map._layers;
          
          if (!layers) return;
          
          Object.keys(layers).forEach(layerId => {
            const layer = layers[layerId];
            if (layer && layer instanceof L.Marker) {
              // Make the marker draggable
              layer.options.draggable = true;
              if (layer.dragging) {
                layer.dragging.enable();
              }
            }
          });
        }
      });
    }, 100);
  };

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
                const layer = layers[layerId] as L.Layer;
                // Type check before using extended properties
                if (layer && 'options' in layer) {
                  const extLayer = layer as unknown as ExtendedLayer;
                  if (extLayer.options && (extLayer.options.isDrawn || extLayer.options.id)) {
                    leafletMapRef.current.removeLayer(layer);
                  }
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
