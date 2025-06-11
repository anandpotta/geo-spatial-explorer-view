
import { v4 as uuidv4 } from 'uuid';

export interface DrawingData {
  id: string;
  type: 'polygon' | 'circle' | 'rectangle' | 'marker';
  coordinates: Array<[number, number]>;
  geoJSON?: any;
  options?: any;
  svgPath?: string; // SVG path data for the drawing
  uniqueId?: string; // Primary unique identifier
  svgUid?: string; // SVG-specific UID
  layerUid?: string; // Layer-specific UID
  pathUid?: string; // Path-specific UID
  uids?: {
    shape?: string;
    svg?: string;
    layer?: string;
    path?: string;
    marker?: string;
  };
  properties: {
    name?: string;
    description?: string;
    color?: string;
    createdAt: Date;
    associatedMarkerId?: string;
  };
  userId: string; // Add userId to associate drawings with specific users
}
