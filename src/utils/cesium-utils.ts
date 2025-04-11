
import * as Cesium from 'cesium';
import { Location } from './geo-utils';
import { createLocationEntity, removeEntity } from './cesium-entity-utils';
import { flyToLocation as flyCameraToLocation, CameraFlightOptions } from './cesium-camera';

export interface FlightOptions extends CameraFlightOptions {
  onComplete?: () => void;
}

// Enhanced flyToLocation that manages both entity creation and camera movement
export const flyToLocation = (
  viewer: Cesium.Viewer | null | undefined, 
  selectedLocation: Location,
  entityRef: React.MutableRefObject<Cesium.Entity | null>,
  options: FlightOptions = {}
): void => {
  console.log('Flying to location in Cesium:', selectedLocation);
  
  // If viewer is undefined, call the completion callback immediately and return
  if (!viewer) {
    console.error('Cannot fly to location: Viewer is undefined or destroyed');
    if (options.onComplete) {
      setTimeout(options.onComplete, 0);
    }
    return;
  }
  
  try {
    if (viewer.isDestroyed()) {
      console.error('Cannot fly to location: Viewer is destroyed');
      if (options.onComplete) {
        setTimeout(options.onComplete, 0);
      }
      return;
    }

    // Remove old entity if it exists
    removeEntity(viewer, entityRef);
    
    // Create a new entity at the target location
    const entity = createLocationEntity(viewer, selectedLocation);
    if (entity) {
      entityRef.current = entity;
    }
    
    // Fly camera to the location
    flyCameraToLocation(viewer, selectedLocation, {
      cinematic: options.cinematic,
      duration: options.duration,
      height: options.height,
    }).then(() => {
      if (options.onComplete) {
        options.onComplete();
      }
    }).catch(err => {
      console.error('Camera flight error:', err);
      if (options.onComplete) {
        setTimeout(options.onComplete, 0);
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
