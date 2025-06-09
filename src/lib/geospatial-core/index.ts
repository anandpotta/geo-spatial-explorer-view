
export * from './types';
export * from './globe/index';
export * from './map/index';
export * from './utils';

export class ThreeGlobeCore {
  private options: any;
  
  constructor(options?: any) {
    this.options = options;
  }
  
  init(context: any, handlers?: any) {
    // Initialize the globe
    console.log('ThreeGlobeCore initialized');
  }
  
  setLocation(location: any) {
    // Set location on globe
    console.log('Setting location:', location);
  }
  
  dispose() {
    // Clean up resources
    console.log('ThreeGlobeCore disposed');
  }
}
