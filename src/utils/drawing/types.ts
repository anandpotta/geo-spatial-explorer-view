
export interface DrawingData {
  id: string;
  type: 'polygon' | 'circle' | 'freehand';
  coordinates: Array<[number, number]>;
  properties: {
    name?: string;
    description?: string;
    createdAt: Date;
  };
}
