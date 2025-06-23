
// Angular globe component - only available when Angular is installed
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
  Component = (config: any) => (target: any) => {
    target.ɵcmp = config;
    target.ɵfac = () => new target();
    return target;
  };
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

import type { GeoLocation, GlobeOptions } from '../geospatial-core/types';

@Component({
  selector: 'geo-globe',
  standalone: false,
  template: `
    <div class="geo-globe-container" 
         #globeContainer 
         [style.width]="width || '100%'" 
         [style.height]="height || '600px'">
      <div *ngIf="!isReady" class="geo-globe-loading">
        <div class="geo-globe-spinner"></div>
        <h3>Loading Globe...</h3>
      </div>
      <div class="geo-globe-canvas" 
           [style.display]="isReady ? 'block' : 'none'">
      </div>
    </div>
  `,
  styles: [`
    .geo-globe-container {
      position: relative;
      overflow: hidden;
      background-color: #000;
    }
    
    .geo-globe-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: rgba(0,0,0,0.8);
      color: white;
      z-index: 1000;
    }
    
    .geo-globe-spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 4px solid #3498db;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    .geo-globe-canvas {
      width: 100%;
      height: 100%;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class AngularGlobeComponent implements AngularLifecycleStub {
  @ViewChild('globeContainer', { static: true }) globeContainer!: ElementRefStub;
  
  @Input() options?: Partial<GlobeOptions>;
  @Input() selectedLocation?: GeoLocation | null;
  @Input() width?: string;
  @Input() height?: string;
  
  @Output() ready = new EventEmitter();
  @Output() flyComplete = new EventEmitter();
  @Output() error = new EventEmitter();
  @Output() locationSelect = new EventEmitter();
  
  isReady = false;
  private globeInstance: any = null;
  private resizeObserver?: ResizeObserver;
  
  ngOnInit() {
    console.log('AngularGlobeComponent: Initializing...');
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.initGlobe();
    }, 100);
  }
  
  ngOnChanges(changes: any) {
    if (this.isReady && this.globeInstance) {
      if (changes['selectedLocation'] && this.selectedLocation) {
        this.flyToLocation(this.selectedLocation);
      }
    }
  }
  
  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.globeInstance) {
      this.globeInstance = null;
    }
  }
  
  private initGlobe() {
    try {
      console.log('AngularGlobeComponent: Initializing globe instance');
      
      setTimeout(() => {
        this.isReady = true;
        this.globeInstance = {
          location: this.selectedLocation,
          options: this.options || {}
        };
        
        this.ready.emit(this.globeInstance);
        console.log('AngularGlobeComponent: Globe ready');
      }, 1500);
      
      this.setupResizeObserver();
      
    } catch (error) {
      console.error('AngularGlobeComponent: Failed to initialize globe', error);
      this.error.emit(error as Error);
    }
  }
  
  private setupResizeObserver() {
    if (this.globeContainer?.nativeElement && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.globeInstance) {
          console.log('AngularGlobeComponent: Globe container resized');
        }
      });
      this.resizeObserver.observe(this.globeContainer.nativeElement);
    }
  }
  
  flyToLocation(location: GeoLocation) {
    if (this.globeInstance) {
      console.log(`AngularGlobeComponent: Flying to ${location.label}`);
      this.globeInstance.location = location;
      
      setTimeout(() => {
        this.flyComplete.emit();
      }, 2000);
    }
  }
  
  onLocationClick(location: GeoLocation) {
    this.locationSelect.emit(location);
  }
}

// Make sure component is exported with proper Angular metadata
if (hasAngular) {
  // Ensure the component has Angular compilation metadata
  (AngularGlobeComponent as any).ɵcmp = (AngularGlobeComponent as any).ɵcmp || {};
  (AngularGlobeComponent as any).ɵfac = (AngularGlobeComponent as any).ɵfac || (() => new AngularGlobeComponent());
}
