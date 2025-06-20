
// Angular map component - only available when Angular is installed
let Component: any, ElementRef: any, ViewChild: any, Input: any, Output: any, EventEmitter: any;
let OnInit: any, OnDestroy: any, AfterViewInit: any, OnChanges: any, SimpleChanges: any;

// Type interfaces for when Angular is not available
interface AngularLifecycleStub {
  ngOnInit?(): void;
  ngAfterViewInit?(): void;
  ngOnDestroy?(): void;
  ngOnChanges?(changes: any): void;
}

interface ElementRefStub {
  nativeElement?: HTMLElement;
}

interface EventEmitterStub<T = any> {
  emit(value?: T): void;
}

// Conditional Angular imports with proper fallback types
let hasAngular = false;
try {
  const angularCore = require('@angular/core');
  Component = angularCore.Component;
  ElementRef = angularCore.ElementRef;
  ViewChild = angularCore.ViewChild;
  Input = angularCore.Input;
  Output = angularCore.Output;
  EventEmitter = angularCore.EventEmitter;
  OnInit = angularCore.OnInit;
  OnDestroy = angularCore.OnDestroy;
  AfterViewInit = angularCore.AfterViewInit;
  OnChanges = angularCore.OnChanges;
  SimpleChanges = angularCore.SimpleChanges;
  hasAngular = true;
} catch (error) {
  // Angular not available - create stub decorators and classes
  Component = () => (target: any) => target;
  ElementRef = class implements ElementRefStub { nativeElement?: HTMLElement; };
  ViewChild = () => () => {};
  Input = () => () => {};
  Output = () => () => {};
  EventEmitter = class implements EventEmitterStub { emit() {} };
  OnInit = class {};
  OnDestroy = class {};
  AfterViewInit = class {};
  OnChanges = class {};
  SimpleChanges = class {};
}

import type { GeoLocation, MapViewOptions } from '../geospatial-core/types';
import type { DrawingData } from '../../utils/drawing-utils';

@Component({
  selector: 'geo-map',
  template: `
    <div class="geo-map-container" 
         #mapContainer 
         [style.width]="width || '100%'" 
         [style.height]="height || '400px'">
      <div *ngIf="!isReady" class="geo-map-loading">
        <div class="geo-map-spinner"></div>
        <h3>Loading Map...</h3>
      </div>
      <div class="geo-map-canvas" 
           [style.display]="isReady ? 'block' : 'none'">
      </div>
    </div>
  `,
  styles: [`
    .geo-map-container {
      position: relative;
      overflow: hidden;
    }
    
    .geo-map-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
      z-index: 1000;
    }
    
    .geo-map-spinner {
      border: 4px solid rgba(0,0,0,0.1);
      border-radius: 50%;
      border-top: 4px solid #3498db;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    .geo-map-canvas {
      width: 100%;
      height: 100%;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class AngularMapComponent implements AngularLifecycleStub {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRefStub;
  
  @Input() options?: Partial<MapViewOptions>;
  @Input() selectedLocation?: GeoLocation | null;
  @Input() width?: string;
  @Input() height?: string;
  @Input() enableDrawing?: boolean = false;
  
  @Output() ready = new EventEmitter<any>();
  @Output() locationSelect = new EventEmitter<GeoLocation>();
  @Output() error = new EventEmitter<Error>();
  @Output() annotationsChange = new EventEmitter<any[]>();
  @Output() drawingCreated = new EventEmitter<DrawingData>();
  @Output() regionClick = new EventEmitter<DrawingData>();
  
  isReady = false;
  private mapInstance: any = null;
  private resizeObserver?: ResizeObserver;
  
  ngOnInit() {
    console.log('AngularMapComponent: Initializing...');
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }
  
  ngOnChanges(changes: any) {
    if (this.isReady && this.mapInstance) {
      if (changes['selectedLocation'] && this.selectedLocation) {
        this.centerMap(this.selectedLocation.y, this.selectedLocation.x);
      }
    }
  }
  
  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.mapInstance) {
      this.mapInstance = null;
    }
  }
  
  private initMap() {
    try {
      console.log('AngularMapComponent: Initializing map instance');
      
      setTimeout(() => {
        this.isReady = true;
        this.mapInstance = {
          center: this.selectedLocation ? [this.selectedLocation.y, this.selectedLocation.x] : [0, 0],
          zoom: this.options?.initialZoom || 10
        };
        
        this.ready.emit(this.mapInstance);
        console.log('AngularMapComponent: Map ready');
      }, 1000);
      
      this.setupResizeObserver();
      
    } catch (error) {
      console.error('AngularMapComponent: Failed to initialize map', error);
      this.error.emit(error as Error);
    }
  }
  
  private setupResizeObserver() {
    if (this.mapContainer?.nativeElement && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.mapInstance) {
          console.log('AngularMapComponent: Map container resized');
        }
      });
      this.resizeObserver.observe(this.mapContainer.nativeElement);
    }
  }
  
  centerMap(lat: number, lng: number) {
    if (this.mapInstance) {
      console.log(`AngularMapComponent: Centering map to ${lat}, ${lng}`);
      this.mapInstance.center = [lat, lng];
    }
  }
  
  addMarker(location: GeoLocation) {
    if (this.mapInstance) {
      console.log('AngularMapComponent: Adding marker', location);
    }
  }
  
  onLocationClick(location: GeoLocation) {
    this.locationSelect.emit(location);
  }
  
  onDrawingCreate(drawing: DrawingData) {
    this.drawingCreated.emit(drawing);
  }
  
  onRegionClick(drawing: DrawingData) {
    this.regionClick.emit(drawing);
  }
}
