
// This is an example showing how to integrate the geospatial explorer in Angular
// In a real Angular app, you would import from '@angular/core'

interface GeoLocation {
  x: number; // longitude
  y: number; // latitude
  label?: string;
}

interface MapOptions {
  zoom?: number;
  center?: { lat: number; lng: number };
  tileProvider?: string;
  showControls?: boolean;
}

// Example Angular component interface (for reference only)
export interface DashboardComponentExample {
  // Map configuration
  mapOptions: MapOptions;
  selectedLocation: GeoLocation | null;
  
  // Dashboard data
  isMapReady: boolean;
  isLoading: boolean;
  dashboardStats: {
    totalLocations: number;
    activeRegions: number;
    coverage: string;
  };

  // Methods that would be implemented in real Angular component
  ngOnInit(): void;
  onMapReady(mapInstance: any): void;
  onLocationSelect(location: GeoLocation): void;
  onMapError(error: Error): void;
  setLocation(lat: number, lng: number, label?: string): void;
  clearSelection(): void;
}

// Example implementation showing the structure
export const dashboardExample: DashboardComponentExample = {
  mapOptions: {
    zoom: 10,
    center: { lat: 40.7128, lng: -74.0060 },
    showControls: true,
    tileProvider: 'openstreetmap'
  },
  
  selectedLocation: {
    x: -74.0060,
    y: 40.7128,
    label: 'New York City'
  },
  
  isMapReady: false,
  isLoading: true,
  dashboardStats: {
    totalLocations: 0,
    activeRegions: 0,
    coverage: '0%'
  },

  ngOnInit() {
    // Load dashboard data
    setTimeout(() => {
      this.dashboardStats = {
        totalLocations: 150,
        activeRegions: 12,
        coverage: '85%'
      };
    }, 1000);
  },

  onMapReady(mapInstance: any) {
    console.log('Map is ready:', mapInstance);
    this.isMapReady = true;
    this.isLoading = false;
  },

  onLocationSelect(location: GeoLocation) {
    console.log('Location selected:', location);
    this.selectedLocation = location;
  },

  onMapError(error: Error) {
    console.error('Map error:', error);
    this.isLoading = false;
  },

  setLocation(lat: number, lng: number, label?: string) {
    this.selectedLocation = {
      x: lng,
      y: lat,
      label: label || 'Selected Location'
    };
  },

  clearSelection() {
    this.selectedLocation = null;
  }
};
