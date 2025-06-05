
import { GeoLocation, MapOptions } from './types';

export class GeoSpatialCore {
  private options: MapOptions;
  
  constructor(options: MapOptions = {}) {
    this.options = {
      zoom: 10,
      center: { lat: 0, lng: 0 },
      tileProvider: 'openstreetmap',
      showControls: true,
      ...options
    };
  }

  public createLocation(x: number, y: number, label: string, id?: string): GeoLocation {
    return {
      id: id || Math.random().toString(36).substring(7),
      x,
      y,
      label
    };
  }

  public getMapOptions(): MapOptions {
    return this.options;
  }

  public updateMapOptions(newOptions: Partial<MapOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}
