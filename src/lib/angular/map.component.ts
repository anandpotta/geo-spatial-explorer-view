
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MapCore } from '../geospatial-core/map';
import { GeoLocation, MapViewOptions } from '../geospatial-core/types';

@Component({
  selector: 'geo-map',
  template: `
    <div #mapContainer class="geo-map-container" [style.width]="'100%'" [style.height]="'100%'">
      <div *ngIf="!isReady" class="geo-map-loading">
        <div class="geo-map-spinner"></div>
        <p>Loading Map...</p>
      </div>
    </div>
  `,
  styles: [`
    .geo-map-container {
      position: relative;
      width: 100%;
      height: 400px;
      background: #f0f0f0;
    }
    .geo-map-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    .geo-map-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class MapComponentAngular implements OnInit, AfterViewInit, OnDestroy {
  @Input() options: Partial<MapViewOptions> = {};
  @Input() selectedLocation?: GeoLocation;
  
  @Output() ready = new EventEmitter<void>();
  @Output() locationSelect = new EventEmitter<GeoLocation>();
  @Output() error = new EventEmitter<string>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  isReady = false;
  private mapCore?: MapCore;

  ngOnInit() {
    console.log('Angular Map Component initialized');
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private async initMap() {
    try {
      if (!this.mapContainer?.nativeElement) {
        throw new Error('Map container not found');
      }

      this.mapCore = new MapCore(this.mapContainer.nativeElement, this.options);
      await this.mapCore.initialize();
      
      this.isReady = true;
      this.ready.emit();

      // Set up event listeners
      this.mapCore.onLocationSelect((location: GeoLocation) => {
        this.locationSelect.emit(location);
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      this.error.emit(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  ngOnChanges(changes: any) {
    if (changes.selectedLocation && !changes.selectedLocation.firstChange && this.mapCore) {
      this.centerMap(this.selectedLocation);
    }
  }

  private centerMap(location?: GeoLocation) {
    if (location && this.mapCore) {
      this.mapCore.flyTo(location.latitude, location.longitude);
    }
  }

  ngOnDestroy() {
    if (this.mapCore) {
      this.mapCore.destroy();
    }
  }
}
