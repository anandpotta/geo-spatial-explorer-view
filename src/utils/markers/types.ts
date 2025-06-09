
export interface MarkerData {
  id: string;
  position: [number, number];
  name: string;
  description?: string;
  createdAt: Date;
  userId?: string;
}

export interface LocationMarker {
  id: string;
  position: [number, number];
  name: string;
  description?: string;
  createdAt: Date;
  userId?: string;
  type?: 'pin' | 'area' | 'building';
  isPinned?: boolean;
  associatedDrawing?: string;
}

export interface MarkerProps {
  marker: MarkerData;
  onEdit?: (marker: MarkerData) => void;
  onDelete?: (id: string) => void;
}
