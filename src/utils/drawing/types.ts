
export interface DrawingData {
  id: string;
  type: 'polygon' | 'circle' | 'rectangle' | 'marker';
  coordinates: Array<[number, number]>;
  geoJSON?: any;
  options?: any;
  properties: {
    name?: string;
    description?: string;
    color?: string;
    createdAt: Date;
    associatedMarkerId?: string;
  };
}
