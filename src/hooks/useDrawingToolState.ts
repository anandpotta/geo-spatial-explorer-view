
import { useState, useEffect } from 'react';
import L from 'leaflet';
import { ExtendedLayer, LeafletMapInternal } from '@/utils/leaflet-type-utils';

/**
 * Custom hook to manage drawing tool state
 */
export function useDrawingToolState() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  // Dispatch drawing/marking events
  useEffect(() => {
    if (activeTool) {
      console.log("Drawing tool activated:", activeTool);
      window.dispatchEvent(new CustomEvent('drawingStart'));
    } else {
      window.dispatchEvent(new CustomEvent('drawingEnd'));
    }
  }, [activeTool]);
  
  const handleToolSelect = (tool: string) => {
    console.log(`Tool selected: ${tool}`);
    
    // Dispatch appropriate events based on tool selection
    if (tool && tool !== activeTool) {
      window.dispatchEvent(new CustomEvent('drawingStart'));
    } else if (!tool && activeTool) {
      window.dispatchEvent(new CustomEvent('drawingEnd'));
    }
    
    setActiveTool(tool === activeTool ? null : tool);
  };
  
  const handleClearAll = (leafletMapRef: React.MutableRefObject<LeafletMapInternal>) => {
    if (leafletMapRef.current) {
      try {
        const layers = leafletMapRef.current._layers;
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
        }
      } catch (err) {
        console.error('Error during clear all operation:', err);
      }
    }
  };
  
  return {
    activeTool,
    setActiveTool,
    handleToolSelect,
    handleClearAll
  };
}
