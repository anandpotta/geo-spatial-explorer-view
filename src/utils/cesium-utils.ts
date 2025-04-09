
import * as Cesium from 'cesium';
import { Location } from './geo-utils';

export interface FlightOptions {
  onComplete?: () => void;
}

// Create a very basic flight animation without any network requests
export const flyToLocation = (
  viewer: Cesium.Viewer, 
  selectedLocation: Location,
  entityRef: React.MutableRefObject<Cesium.Entity | null>,
  options: FlightOptions = {}
): void => {
  console.log('Flying to location in Cesium:', selectedLocation);
  
  try {
    // Remove old entity if it exists
    if (entityRef.current) {
      viewer.entities.remove(entityRef.current);
      entityRef.current = null;
    }
    
    // Create a simple entity at the target location
    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.x, selectedLocation.y),
      point: {
        pixelSize: 15,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3
      }
    });
    
    entityRef.current = entity;
    
    // Very simple camera movement with minimal options
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        selectedLocation.x,
        selectedLocation.y,
        500000.0
      ),
      duration: 2.0,
      complete: function() {
        console.log('Fly complete in Cesium, triggering callback');
        if (options.onComplete) {
          setTimeout(options.onComplete, 500);
        }
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
