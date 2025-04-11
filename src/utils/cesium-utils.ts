
import * as Cesium from 'cesium';
import { Location } from './geo-utils';
import { createLocationEntity, removeEntity } from './cesium-entity-utils';
import { flyToLocation as flyCameraToLocation, CameraFlightOptions } from './cesium-camera-utils';

export interface FlightOptions extends CameraFlightOptions {
  onComplete?: () => void;
}

// Enhanced flyToLocation that manages both entity creation and camera movement
export const flyToLocation = (
  viewer: Cesium.Viewer, 
  selectedLocation: Location,
  entityRef: React.MutableRefObject<Cesium.Entity | null>,
  options: FlightOptions = {}
): void => {
  console.log('Flying to location in Cesium:', selectedLocation);
  
  try {
    // Remove old entity if it exists
    removeEntity(viewer, entityRef);
    
    // Create a new entity at the target location
    const entity = createLocationEntity(viewer, selectedLocation);
    entityRef.current = entity;
    
    // Fly camera to the location
    flyCameraToLocation(viewer, selectedLocation, {
      cinematic: options.cinematic,
      duration: options.duration,
      height: options.height,
    }).then(() => {
      if (options.onComplete) {
        options.onComplete();
      }
    });
  } catch (error) {
    console.error('Error during flight animation:', error);
    // Still trigger the completion callback even if there's an error
    if (options.onComplete) {
      setTimeout(options.onComplete, 0);
    }
  }
};
