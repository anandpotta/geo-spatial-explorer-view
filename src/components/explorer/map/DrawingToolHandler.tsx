
import React, { useState } from 'react';
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
