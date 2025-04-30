
import { v4 as uuidv4 } from 'uuid';

export interface DrawingData {
  id: string;
  type: 'polygon' | 'circle' | 'rectangle' | 'marker';
  coordinates: Array<[number, number]>;
  geoJSON?: any;
  options?: any;
  svgPath?: string; // SVG path data for the drawing
  maskedImage?: {
    src: string;
    rotation: number;
    originalFile?: string;
  };
  properties: {
    name?: string;
    description?: string;
    color?: string;
    createdAt: Date;
    associatedMarkerId?: string;
  };
}
