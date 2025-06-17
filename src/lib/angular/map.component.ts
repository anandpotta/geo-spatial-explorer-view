
/**
 * Angular Map Component for Geospatial Explorer
 */

// Define the Angular component structure for TypeScript compatibility
export interface AngularMapComponent {
  selector: string;
  template: string;
  styleUrls?: string[];
  inputs: string[];
  outputs: string[];
}

export const MapComponentAngular: AngularMapComponent = {
  selector: 'geo-map',
  template: `
    <div class="geo-map-container" #mapContainer [style.width]="width || '100%'" [style.height]="height || '400px'">
      <div *ngIf="!isReady" class="geo-map-loading">
        <div class="geo-map-spinner"></div>
        <h3>Loading Map</h3>
      </div>
      <div class="geo-map-canvas" [style.display]="isReady ? 'block' : 'none'"></div>
    </div>
  `,
  styleUrls: ['./map.component.css'],
  inputs: ['options', 'selectedLocation', 'width', 'height'],
  outputs: ['ready', 'locationSelect', 'error', 'annotationsChange']
};

// TypeScript interface for the component class
export interface MapComponentClass {
  // Inputs
  options?: any;
  selectedLocation?: any;
  width?: string;
  height?: string;
  
  // Outputs (EventEmitter equivalents)
  ready: any;
  locationSelect: any;
  error: any;
  annotationsChange: any;
  
  // Properties
  isReady: boolean;
  mapInstance: any;
  
  // Lifecycle methods
  ngOnInit(): void;
  ngAfterViewInit(): void;
  ngOnChanges(changes: any): void;
  ngOnDestroy(): void;
  
  // Methods
  initMap(): void;
  centerMap(lat: number, lng: number): void;
  addMarker(location: any): void;
}

// Example implementation guide for Angular developers
export const ANGULAR_IMPLEMENTATION_GUIDE = `
To use this component in your Angular application:

1. Install the package:
   npm install geospatial-explorer-lib

2. Import in your module:
   import { MapComponentAngular } from 'geospatial-explorer-lib/angular';

3. Create your component:
   @Component({
     selector: 'app-map',
     template: MapComponentAngular.template,
     styleUrls: MapComponentAngular.styleUrls
   })
   export class MapComponent implements OnInit, OnDestroy {
     // Implementation based on MapComponentClass interface
   }

4. Use in template:
   <geo-map 
     [selectedLocation]="location" 
     [options]="mapOptions"
     (ready)="onMapReady($event)"
     (locationSelect)="onLocationSelect($event)">
   </geo-map>
`;
