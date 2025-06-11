
/**
 * Globe implementation for GeoSpatial core library
 */
import { GlobeOptions, GeoLocation, RendererContext } from '../types';

export class ThreeGlobeCore {
  private container: HTMLElement | null = null;
  private options: GlobeOptions;
  private isInitialized = false;
  private locationSelectCallbacks: ((location: GeoLocation) => void)[] = [];

  constructor(container?: HTMLElement, options?: Partial<GlobeOptions>) {
    this.container = container || null;
    this.options = {
      earthRadius: 5,
      backgroundColor: '#000000',
      autoRotate: true,
      rotationSpeed: 0.5,
      enableAtmosphere: true,
      ...(options || {})
    };
  }

  /**
   * Initialize the globe with renderer context
   */
  public init(context: RendererContext, eventHandlers?: any): void {
    this.container = context.getElement();
    console.log('Initializing ThreeGlobe with context and handlers');
    
    // Simulate initialization process
    setTimeout(() => {
      this.isInitialized = true;
      console.log('ThreeGlobe initialized successfully');
      if (eventHandlers?.onReady) {
        eventHandlers.onReady(this);
      }
    }, 1000);
  }

  /**
   * Initialize the globe (legacy method for Angular compatibility)
   */
  public async initialize(): Promise<void> {
    console.log('Initializing ThreeGlobe with options:', this.options);
    
    // Simulate initialization process
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isInitialized = true;
        console.log('ThreeGlobe initialized successfully');
        resolve();
      }, 1000);
    });
  }

  /**
   * Register a callback for location selection events
   */
  public onLocationSelect(callback: (location: GeoLocation) => void): void {
    this.locationSelectCallbacks.push(callback);
  }

  /**
   * Fly to a specific location on the globe
   */
  public flyTo(latitude: number, longitude: number, onComplete?: () => void): void {
    console.log(`Flying to: ${latitude}, ${longitude}`);
    
    // Simulate fly animation
    setTimeout(() => {
      console.log('Fly animation completed');
      if (onComplete) onComplete();
    }, 1500);
  }

  /**
   * Set current location
   */
  public setLocation(location: GeoLocation): void {
    console.log(`Setting location: ${location.label} at ${location.latitude}, ${location.longitude}`);
    this.flyTo(location.latitude, location.longitude);
  }

  /**
   * Trigger location selection event
   */
  private triggerLocationSelect(location: GeoLocation): void {
    this.locationSelectCallbacks.forEach(callback => callback(location));
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.isInitialized = false;
    this.locationSelectCallbacks = [];
    console.log('ThreeGlobe destroyed');
  }

  /**
   * Clean up resources (alternative method name)
   */
  public dispose(): void {
    this.destroy();
  }

  /**
   * Check if globe is initialized
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }
}
