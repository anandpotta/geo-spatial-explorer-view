
import L from 'leaflet';

export interface Shape {
  type: string;
  layer: L.Layer;
  svgPath?: string;
  position?: [number, number];
  geoJSON?: any;
  coordinates?: [number, number][];
  radius?: number;
}
