
export interface Location {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
  raw?: any;
}

export interface LocationMarker {
  id: string;
  name: string;
  position: [number, number]; // [lat, lng]
  type: 'pin' | 'area' | 'building';
  description?: string;
  createdAt: Date;
}
