
/**
 * Map implementation for GeoSpatial core library
 */
import { RendererContext, MapViewOptions, GeoLocation } from '../types';

export class MapCore {
  private context: RendererContext | null = null;
  private options: MapViewOptions;
  private isInitialized = false;
  private locations: GeoLocation[] = [];

  constructor(options?: Partial<MapViewOptions>) {
    this.options = {
      initialCenter: [0, 0],
      initialZoom: 2,
      minZoom: 1,
      maxZoom: 18,
      tileProvider: 'default',
      showControls: true,
      ...(options || {})
    };
  }

  /**
   * Initialize the map in the provided rendering context
   */
  public init(context: RendererContext): void {
    this.context = context;
    this.isInitialized = true;
    console.log('Map initialized with context', context.getDimensions());
  }

  /**
   * Center the map on specific coordinates
   */
  public centerMap(latitude: number, longitude: number, zoom?: number): void {
    console.log(`Centering map at: ${latitude}, ${longitude}, zoom: ${zoom || this.options.initialZoom}`);
    // Implementation would be platform-specific in the adapter
  }

  /**
   * Add a marker for a location
   */
  public addMarker(location: GeoLocation): void {
    this.locations.push(location);
    console.log(`Added marker for location: ${location.label} at ${location.y}, ${location.x}`);
  }

  /**
   * Remove a marker for a location by ID
   */
  public removeMarker(locationId: string): void {
    this.locations = this.locations.filter(loc => loc.id !== locationId);
    console.log(`Removed marker with ID: ${locationId}`);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.context = null;
    this.isInitialized = false;
    this.locations = [];
    console.log('Map disposed');
  }
}

// Explicitly export the MapCore class
export { MapCore };

// Re-export map functionality
export * from './options';
