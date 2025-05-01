
import L from 'leaflet';

declare module 'leaflet' {
  namespace Edit {
    interface IEditTool {
      enable(): void;
      disable(): void;
      enabled?(): boolean;
    }
    
    interface EditHandlerTypes {
      Poly: new (poly: L.Polyline | L.Polygon) => IEditTool;
      Rectangle: new (rectangle: L.Rectangle) => IEditTool;
      Circle: new (circle: L.Circle) => IEditTool;
      SimpleShape: new (shape: any) => IEditTool;
    }
    
    const Poly: EditHandlerTypes['Poly'];
    const Rectangle: EditHandlerTypes['Rectangle'];
    const Circle: EditHandlerTypes['Circle'];
    const SimpleShape: EditHandlerTypes['SimpleShape'];
  }
  
  namespace EditToolbar {
    interface Edit extends L.Handler {
      _featureGroup: L.FeatureGroup;
      _layers: Map<number, L.Layer>;
      _enableLayerEdit(e: {layer: L.Layer}): void;
    }
  }
  
  interface Polygon extends L.Path {
    getLatLngs(): L.LatLng[] | L.LatLng[][] | L.LatLng[][][];
  }
  
  interface Rectangle extends L.Polygon {
    getBounds(): L.LatLngBounds;
  }
  
  interface Circle extends L.Path {
    getLatLng(): L.LatLng;
    getRadius(): number;
  }
}
