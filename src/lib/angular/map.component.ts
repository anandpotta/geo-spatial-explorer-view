
import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { GeoLocation, MapViewOptions } from '../geospatial-core/types';

@Component({
  selector: 'geo-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="geo-map-container" #mapContainer>
      <div *ngIf="!isReady" class="geo-map-loading">
        <div class="geo-map-spinner"></div>
        <h3>Loading Map...</h3>
      </div>
      <div class="geo-map-canvas" 
           [style.display]="isReady ? 'block' : 'none'"
           (click)="onMapClick($event)">
        <div *ngIf="enableDrawing && isReady" class="geo-map-controls">
          <button (click)="createDrawing()" class="geo-map-draw-btn">
            Add Drawing
          </button>
        </div>
        <div *ngIf="annotations.length > 0" class="geo-map-annotations">
          <h4>Annotations ({{annotations.length}})</h4>
          <div *ngFor="let annotation of annotations" class="annotation-item">
            {{annotation.type}}: {{annotation.id}}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .geo-map-container {
      position: relative;
      width: 100%;
      height: 400px;
      overflow: hidden;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background-color: #eff6ff;
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
      background-color: rgba(243,244,246,0.8);
      color: #374151;
      z-index: 1000;
    }
    
    .geo-map-spinner {
      border: 4px solid rgba(59,130,246,0.3);
      border-radius: 50%;
      border-top: 4px solid #3b82f6;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    .geo-map-canvas {
      width: 100%;
      height: 100%;
      position: relative;
    }
    
    .geo-map-controls {
      position: absolute;
      top: 8px;
      left: 8px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 8px;
      z-index: 10;
    }
    
    .geo-map-draw-btn {
      padding: 6px 12px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    }
    
    .geo-map-draw-btn:hover {
      background-color: #2563eb;
    }
    
    .geo-map-annotations {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 8px;
      max-width: 200px;
      z-index: 10;
    }
    
    .geo-map-annotations h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
    }
    
    .annotation-item {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class AngularMapComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  @Input() options?: Partial<MapViewOptions>;
  @Input() selectedLocation?: GeoLocation | null;
  @Input() width?: string;
  @Input() height?: string;
  @Input() enableDrawing?: boolean = false;
  
  @Output() ready = new EventEmitter<any>();
  @Output() locationSelect = new EventEmitter<GeoLocation>();
  @Output() error = new EventEmitter<Error>();
  @Output() annotationsChange = new EventEmitter<any[]>();
  @Output() drawingCreated = new EventEmitter<any>();
  @Output() regionClick = new EventEmitter<any>();
  
  isReady = false;
  annotations: any[] = [];
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
  
  ngOnChanges(changes: SimpleChanges) {
    if (this.isReady && this.mapInstance) {
      if (changes['selectedLocation'] && this.selectedLocation) {
        this.centerOnLocation(this.selectedLocation);
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
          location: this.selectedLocation,
          options: this.options || {},
          annotations: this.annotations
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
  
  centerOnLocation(location: GeoLocation) {
    if (this.mapInstance) {
      console.log(`AngularMapComponent: Centering on ${location.label}`);
      this.mapInstance.location = location;
    }
  }
  
  onMapClick(event: MouseEvent) {
    if (this.mapContainer?.nativeElement) {
      const rect = this.mapContainer.nativeElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 360 - 180;
      const y = 90 - ((event.clientY - rect.top) / rect.height) * 180;
      
      const location: GeoLocation = {
        id: `location-${Date.now()}`,
        x: x,
        y: y,
        label: `Location at ${y.toFixed(4)}, ${x.toFixed(4)}`
      };
      
      this.locationSelect.emit(location);
    }
  }
  
  createDrawing() {
    const drawing = {
      id: `drawing-${Date.now()}`,
      type: 'polygon',
      data: { coordinates: [[0, 0], [1, 0], [1, 1], [0, 1]] }
    };
    
    this.annotations.push(drawing);
    this.annotationsChange.emit(this.annotations);
    this.drawingCreated.emit(drawing);
  }
}
