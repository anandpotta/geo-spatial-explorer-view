
/**
 * Three.js Globe implementation core
 */
import type { GeoLocation, GlobeOptions, RendererContext, GlobeEventHandlers } from '../types';

export class ThreeGlobeCore {
  private context: RendererContext | null = null;
  private options: GlobeOptions;
  private isInitialized = false;
  private currentLocation: GeoLocation | null = null;
  private eventHandlers: GlobeEventHandlers = {};
  private animationId: number | null = null;

  constructor(options?: Partial<GlobeOptions>) {
    this.options = {
      earthRadius: 5,
      backgroundColor: '#000011',
      autoRotate: true,
      rotationSpeed: 0.005,
      texturePath: '',
      bumpMapPath: '',
      specularMapPath: '',
      ...(options || {})
    };
  }

  /**
   * Initialize the globe in the provided rendering context
   */
  public init(context: RendererContext, eventHandlers?: GlobeEventHandlers): void {
    this.context = context;
    this.eventHandlers = eventHandlers || {};
    
    // Simulate initialization process
    setTimeout(() => {
      this.isInitialized = true;
      console.log('ThreeGlobe initialized with options:', this.options);
      
      if (this.eventHandlers.onReady) {
        this.eventHandlers.onReady(this);
      }
      
      this.startAnimation();
    }, 1000);
  }

  /**
   * Set the current location and fly to it
   */
  public setLocation(location: GeoLocation): void {
    this.currentLocation = location;
    this.flyToLocation(location.x, location.y);
  }

  /**
   * Fly to specific coordinates
   */
  public flyToLocation(longitude: number, latitude: number, callback?: () => void): void {
    console.log(`Flying to coordinates: ${latitude}, ${longitude}`);
    
    // Simulate flight animation
    setTimeout(() => {
      if (this.eventHandlers.onFlyComplete) {
        this.eventHandlers.onFlyComplete();
      }
      if (callback) callback();
    }, 2000);
  }

  /**
   * Get current location
   */
  public getLocation(): GeoLocation | null {
    return this.currentLocation;
  }

  /**
   * Start animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      if (this.isInitialized && this.options.autoRotate) {
        // Simulate globe rotation
        this.animationId = requestAnimationFrame(animate);
      }
    };
    animate();
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.context = null;
    this.isInitialized = false;
    this.currentLocation = null;
    this.eventHandlers = {};
    console.log('ThreeGlobe disposed');
  }
}

// Export additional globe utilities
export const createGlobeOptions = (overrides?: Partial<GlobeOptions>): GlobeOptions => ({
  earthRadius: 5,
  backgroundColor: '#000011',
  autoRotate: true,
  rotationSpeed: 0.005,
  texturePath: '',
  bumpMapPath: '',
  specularMapPath: '',
  ...overrides
});
