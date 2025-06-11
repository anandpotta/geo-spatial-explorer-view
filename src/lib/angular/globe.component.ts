
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ThreeGlobeCore } from '../geospatial-core/globe';
import { GeoLocation, GlobeOptions } from '../geospatial-core/types';

@Component({
  selector: 'geo-globe',
  template: `
    <div #globeContainer class="geo-globe-container" [style.width]="'100%'" [style.height]="'100%'">
      <div *ngIf="!isReady" class="geo-globe-loading">
        <div class="geo-globe-spinner"></div>
        <p>Loading Globe...</p>
      </div>
    </div>
  `,
  styles: [`
    .geo-globe-container {
      position: relative;
      width: 100%;
      height: 400px;
      background: #000;
    }
    .geo-globe-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: white;
    }
    .geo-globe-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class GlobeComponentAngular implements OnInit, AfterViewInit, OnDestroy {
  @Input() options: Partial<GlobeOptions> = {};
  @Input() selectedLocation?: GeoLocation;
  
  @Output() ready = new EventEmitter<any>();
  @Output() locationSelect = new EventEmitter<GeoLocation>();
  @Output() error = new EventEmitter<string>();

  @ViewChild('globeContainer', { static: true }) globeContainer!: ElementRef<HTMLDivElement>;

  isReady = false;
  private globeCore?: ThreeGlobeCore;

  ngOnInit() {
    console.log('Angular Globe Component initialized');
  }

  ngAfterViewInit() {
    this.initGlobe();
  }

  private async initGlobe() {
    try {
      if (!this.globeContainer?.nativeElement) {
        throw new Error('Globe container not found');
      }

      this.globeCore = new ThreeGlobeCore(this.globeContainer.nativeElement, this.options);
      await this.globeCore.initialize();
      
      this.isReady = true;
      this.ready.emit(this.globeCore);

      // Set up event listeners
      this.globeCore.onLocationSelect((location: GeoLocation) => {
        this.locationSelect.emit(location);
      });

    } catch (error) {
      console.error('Failed to initialize globe:', error);
      this.error.emit(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  ngOnChanges(changes: any) {
    if (changes.selectedLocation && !changes.selectedLocation.firstChange && this.globeCore) {
      this.flyToLocation(this.selectedLocation);
    }
  }

  private flyToLocation(location?: GeoLocation) {
    if (location && this.globeCore) {
      this.globeCore.flyTo(location.latitude, location.longitude);
    }
  }

  ngOnDestroy() {
    if (this.globeCore) {
      this.globeCore.destroy();
    }
  }
}
