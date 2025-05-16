
declare global {
  interface Window {
    featureGroup?: L.FeatureGroup;
    tempMarkerPositionUpdate?: (pos: [number, number]) => void;
  }
  
  // Extend Leaflet Map type to include internal properties we access
  namespace L {
    interface Map {
      _isDestroyed?: boolean;
      _panes?: {
        mapPane?: {
          _leaflet_pos?: any;
        };
      };
      _leaflet_id?: number;
      _mapPane?: any;
      _layers?: {[key: string]: L.Layer};
      getContainer(): HTMLElement | null;
      invalidateSize(animate?: boolean): this;
      setView(center: L.LatLngExpression, zoom?: number, options?: L.ZoomPanOptions): this;
      panTo(latlng: L.LatLngExpression, options?: L.PanOptions): this;
      flyTo(latlng: L.LatLngExpression, zoom?: number, options?: L.ZoomPanOptions): this;
      getZoom(): number;
      getCenter(): L.LatLng;
      addLayer(layer: L.Layer): this;
      removeLayer(layer: L.Layer): this;
      eachLayer(fn: (layer: L.Layer) => void, context?: any): this;
      fire(type: string, data?: any): this;
    }
    
    // Extend LayerOptions to include our custom properties
    interface LayerOptions {
      isDrawn?: boolean;
      id?: string;
    }

    // Extend Layer to ensure options property is available
    interface Layer {
      options?: LayerOptions;
    }
    
    // Extend TileLayer to include event handling
    interface TileLayer {
      on(type: 'load' | 'loading' | 'tileload' | 'tileerror' | string, fn: L.LeafletEventHandlerFn): this;
      setOpacity(opacity: number): this;
    }
  }

  // Add _leaflet_id to HTMLElement for Leaflet
  interface HTMLElement {
    _leaflet_id?: number;
  }
}

export {};
