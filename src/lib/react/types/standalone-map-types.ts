
export interface StandaloneMapRef {
  saveToAzure: () => Promise<boolean>;
  loadFromAzure: () => Promise<boolean>;
  getCurrentUser: () => { userId: string; username?: string } | null;
  clearAll: () => void;
}

export interface StandaloneMapProps {
  // Map configuration
  initialCenter?: [number, number];
  initialZoom?: number;
  
  // External location control
  externalLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
  };
  
  // UI options
  showInternalSearch?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  
  // RBAC configuration
  userSession?: {
    userId: string;
    username?: string;
    connectionString: string;
    autoSync?: boolean;
  };
  
  // Event handlers
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
    searchString?: string;
  }) => void;
  onAnnotationsChange?: (annotations: any[]) => void;
  onDataSync?: (success: boolean, operation: 'load' | 'save') => void;
  
  // Map interaction handlers
  onMapReady?: (map: any) => void;
  onMarkerClick?: (marker: any) => void;
  onDrawingClick?: (drawing: any) => void;
}
