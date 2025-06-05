
import { Component, OnInit } from '@angular/core';

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

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Map configuration
  mapOptions: MapOptions = {
    zoom: 10,
    center: { lat: 40.7128, lng: -74.0060 }, // New York City
    showControls: true,
    tileProvider: 'openstreetmap'
  };

  // Selected location for the map
  selectedLocation: GeoLocation | null = {
    x: -74.0060, // longitude
    y: 40.7128,  // latitude
    label: 'New York City'
  };

  // Dashboard data
  isMapReady = false;
  isLoading = true;
  dashboardStats = {
    totalLocations: 0,
    activeRegions: 0,
    coverage: '0%'
  };

  ngOnInit() {
    this.loadDashboardData();
  }

  onMapReady(mapInstance: any) {
    console.log('Map is ready:', mapInstance);
    this.isMapReady = true;
    this.isLoading = false;
  }

  onLocationSelect(location: GeoLocation) {
    console.log('Location selected:', location);
    this.selectedLocation = location;
    this.updateLocationStats(location);
  }

  onMapError(error: Error) {
    console.error('Map error:', error);
    this.isLoading = false;
  }

  private loadDashboardData() {
    // Simulate loading dashboard data
    setTimeout(() => {
      this.dashboardStats = {
        totalLocations: 150,
        activeRegions: 12,
        coverage: '85%'
      };
    }, 1000);
  }

  private updateLocationStats(location: GeoLocation) {
    // Update stats based on selected location
    console.log('Updating stats for:', location.label);
  }

  // Method to programmatically set location
  setLocation(lat: number, lng: number, label?: string) {
    this.selectedLocation = {
      x: lng,
      y: lat,
      label: label || 'Selected Location'
    };
  }

  // Method to clear selection
  clearSelection() {
    this.selectedLocation = null;
  }
}
