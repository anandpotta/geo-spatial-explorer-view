export interface Location {
  x: number;
  y: number;
  label: string;
}

export interface LocationMarker {
  id: string;
  uniqueId?: string; // Add unique identifier field
  name: string;
  position: [number, number];
  type: 'pin' | 'area' | 'building';
  description?: string;
  createdAt: Date;
  isPinned?: boolean;
  associatedDrawing?: string;
  userId?: string;
}

export interface DrawingData {
  id: string;
  type: string;
  coordinates: number[][];
  geoJSON?: any;
  options?: any;
  svgPath?: string;
  properties?: {
    name: string;
    description?: string;
    color: string;
    createdAt: Date;
    associatedMarkerId?: string;
  };
  userId?: string;
}
