
/**
 * Main marker type used throughout the application
 */
export interface LocationMarker {
  id: string;
  name: string;
  position: [number, number];
  type: 'pin' | 'area' | 'building';
  description?: string;
  createdAt: Date;
  isPinned?: boolean;
  associatedDrawing?: string;
}
