
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
  
  // Create a multi-step flight animation to simulate real navigation from space
  // Step 1: First ensure we're viewing from far space
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(0, 0, 30000000.0), // Very high altitude
    duration: 1.0,
    complete: function() {
      console.log('Starting from space view');
      
      // Step 2: Fly to position above target location but still high up
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          selectedLocation.x,
          selectedLocation.y,
          5000000.0 // High altitude above location
        ),
        duration: 3.0,
        complete: function() {
          console.log('Approaching target from high altitude');
          
          // Step 3: Zoom in closer to the target location
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              selectedLocation.x,
              selectedLocation.y,
              100000.0 // Closer view
            ),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-45), // Angled view
              roll: 0
            },
            duration: 2.0,
            complete: function() {
              console.log('Getting closer to target');
              
              // Step 4: Final approach - close aerial view
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                  selectedLocation.x,
                  selectedLocation.y,
                  1000 // Final close aerial view
                ),
                orientation: {
                  heading: Cesium.Math.toRadians(0),
                  pitch: Cesium.Math.toRadians(-50), // More steep angle for building view
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
        }
      });
    }
  });
};
