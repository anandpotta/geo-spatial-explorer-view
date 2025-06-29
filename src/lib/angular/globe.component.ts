
import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { GeoLocation, GlobeOptions } from '../geospatial-core/types';

@Component({
  selector: 'geo-globe',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="geo-globe-container" 
         #globeContainer>
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
      width: 100%;
      height: 600px;
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
export class AngularGlobeComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @ViewChild('globeContainer', { static: true }) globeContainer!: ElementRef;
  
  @Input() options?: Partial<GlobeOptions>;
  @Input() selectedLocation?: GeoLocation | null;
  @Input() width?: string;
  @Input() height?: string;
  
  @Output() ready = new EventEmitter<any>();
  @Output() flyComplete = new EventEmitter<void>();
  @Output() error = new EventEmitter<Error>();
  @Output() locationSelect = new EventEmitter<GeoLocation>();
  
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
  
  ngOnChanges(changes: SimpleChanges) {
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
