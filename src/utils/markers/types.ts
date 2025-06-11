
import { DrawingData } from '../drawing-utils';

export interface LocationMarker {
  id: string;
  name: string;
  position: [number, number];
  type: 'pin' | 'area' | 'building';
  description?: string;
  createdAt: Date;
  isPinned?: boolean;
  associatedDrawing?: string;
  userId: string;
  _uid?: string; // Add optional UID for tracking
}
