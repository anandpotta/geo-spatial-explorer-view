
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { isMapValid } from '@/utils/leaflet-type-utils';

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
  const [editEnabled, setEditEnabled] = useState(false);

  // Reset edit mode when the tool changes
  useEffect(() => {
    if (activeTool !== 'edit') {
      setEditEnabled(false);
    }
  }, [activeTool]);

  const handleToolSelect = (tool: string) => {
    console.log(`Tool selected: ${tool}`);
    setActiveTool(tool === activeTool ? null : tool);
    onToolSelect(tool);
    
    if (currentView === 'cesium') {
      if (tool === 'clear') {
        toast.info('Clearing all shapes');
      }
    } else if (currentView === 'leaflet') {
      // Handle special tools for leaflet map
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
      } else if (tool === 'edit' && leafletMapRef.current) {
        try {
          // Enable or disable edit mode
          if (!editEnabled) {
            // Access the global featureGroup
            if (window.featureGroup) {
              const featureGroup = window.featureGroup;
              const map = leafletMapRef.current;
              
              // Find the edit button in the Leaflet draw control and click it
              const container = map.getContainer();
              if (container) {
                const editButton = container.querySelector('.leaflet-draw-edit-edit');
                if (editButton) {
                  (editButton as HTMLElement).click();
                  setEditEnabled(true);
                  toast.info('Edit mode enabled. Drag the white squares to reshape your paths.');
                } else {
                  toast.info('Draw a shape first before editing');
                }
              }
            } else {
              toast.info('No drawings available to edit');
            }
          }
        } catch (err) {
          console.error('Error enabling edit mode:', err);
          toast.error('Failed to enable editing. Please try again.');
        }
      }
    }
  };

  return null; // This is a logic component with no UI
};

export default DrawingToolHandler;
