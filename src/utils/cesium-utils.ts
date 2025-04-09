
import * as Cesium from 'cesium';
import { Location } from './geo-utils';

export interface FlightOptions {
  onComplete?: () => void;
}

// Create a multi-step flight animation to simulate real navigation from space
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
    
    // Create a new entity at the selected location
    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.x, selectedLocation.y),
      point: {
        pixelSize: 10,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: selectedLocation.label,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10)
      }
    });
    
    entityRef.current = entity;
    
    // Simplify the flight animation to be more reliable
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        selectedLocation.x,
        selectedLocation.y,
        1000000.0 // Higher altitude first
      ),
      duration: 4.0,
      complete: function() {
        // Once at high altitude, descend to the final position
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            selectedLocation.x,
            selectedLocation.y,
            10000.0 // Final closer view
          ),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45), // Angled view
            roll: 0
          },
          duration: 2.0,
          complete: function() {
            console.log('Fly complete in Cesium, triggering callback');
            if (options.onComplete) {
              options.onComplete();
            }
          }
        });
      }
    });
  } catch (error) {
    console.error('Error during flight animation:', error);
    // Still trigger the completion callback even if there's an error
    if (options.onComplete) {
      options.onComplete();
    }
  }
};
