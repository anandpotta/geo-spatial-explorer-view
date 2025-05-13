
/**
 * Angular component for the globe
 */

export class GlobeComponent {
  // This class is fully implemented in the component code below
  // and would be used in an Angular project
}

/**
 * This is the actual Angular component code that would be used
 * in a separate Angular project's source files.
 * 
 * Angular implementation sample:
 * 
 * ```typescript
 * import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
 * import { ThreeGlobeCore } from '../geospatial-core';
 * import { GlobeOptions, GeoLocation } from '../geospatial-core/types';
 * 
 * @Component({
 *   selector: 'app-globe',
 *   template: `
 *     <div #container 
 *          class="globe-container"
 *          [ngStyle]="{
 *            'width': '100%',
 *            'height': '100%',
 *            'position': 'relative',
 *            'background-color': 'black'
 *          }">
 *       <div *ngIf="!isReady" 
 *            class="loading-overlay"
 *            style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background-color: rgba(0,0,0,0.8);">
 *         <div class="loading-content" style="text-align: center; color: white;">
 *           <div class="spinner"></div>
 *           <h3>Loading Globe</h3>
 *         </div>
 *       </div>
 *     </div>
 *   `,
 *   styles: [`
 *     .globe-container {
 *       overflow: hidden;
 *     }
 *     
 *     .spinner {
 *       border: 4px solid rgba(255,255,255,0.3);
 *       border-radius: 50%;
 *       border-top: 4px solid #3498db;
 *       width: 40px;
 *       height: 40px;
 *       animation: spin 1s linear infinite;
 *       margin: 0 auto 15px;
 *     }
 *     
 *     @keyframes spin {
 *       0% { transform: rotate(0deg); }
 *       100% { transform: rotate(360deg); }
 *     }
 *   `]
 * })
 * export class GlobeComponent implements OnInit, OnDestroy {
 *   @ViewChild('container', { static: true }) containerRef: ElementRef;
 *   
 *   @Input() options: Partial<GlobeOptions> = {};
 *   @Input() selectedLocation: GeoLocation | null = null;
 *   
 *   @Output() ready = new EventEmitter<any>();
 *   @Output() flyComplete = new EventEmitter<void>();
 *   @Output() error = new EventEmitter<Error>();
 *   
 *   private globe: ThreeGlobeCore | null = null;
 *   isReady = false;
 *   
 *   ngOnInit() {
 *     this.initGlobe();
 *   }
 *   
 *   ngOnDestroy() {
 *     if (this.globe) {
 *       this.globe.dispose();
 *       this.globe = null;
 *     }
 *   }
 *   
 *   private initGlobe() {
 *     try {
 *       this.globe = new ThreeGlobeCore(this.options);
 *       
 *       this.globe.init({
 *         getElement: () => this.containerRef.nativeElement,
 *         getDimensions: () => ({
 *           width: this.containerRef.nativeElement.clientWidth,
 *           height: this.containerRef.nativeElement.clientHeight
 *         }),
 *         onResize: (callback) => {
 *           const resizeObserver = new ResizeObserver(() => callback());
 *           resizeObserver.observe(this.containerRef.nativeElement);
 *           return () => resizeObserver.disconnect();
 *         },
 *         onCleanup: (callback) => {}
 *       }, {
 *         onReady: (api) => {
 *           this.isReady = true;
 *           this.ready.emit(api);
 *         },
 *         onFlyComplete: () => {
 *           this.flyComplete.emit();
 *         },
 *         onError: (error) => {
 *           this.error.emit(error);
 *         }
 *       });
 *       
 *     } catch (error) {
 *       console.error('Failed to initialize globe:', error);
 *       this.error.emit(error as Error);
 *     }
 *   }
 *   
 *   ngOnChanges() {
 *     if (this.globe && this.isReady && this.selectedLocation) {
 *       this.globe.setLocation(this.selectedLocation);
 *     }
 *   }
 * }
 * ```
 */
