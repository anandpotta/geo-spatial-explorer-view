
import * as Cesium from 'cesium';
import { Location } from './geo-utils';

export interface FlightOptions {
  onComplete?: () => void;
  cinematic?: boolean;
}

// Create a completely offline flight animation
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
    
    // Create a simple entity at the target location with minimal resources
    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.x, selectedLocation.y),
      point: {
        pixelSize: 15,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3
      },
      label: {
        text: selectedLocation.label.split(',')[0], // First part of the address
        font: '14pt sans-serif',
        style: Cesium.LabelStyle.FILL,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10)
      }
    });
    
    entityRef.current = entity;
    
    // Skip animation for reliable behavior
    if (!options.cinematic) {
      // Directly set the camera position without animation
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          selectedLocation.x,
          selectedLocation.y,
          500000.0
        )
      });
      
      // Force render
      viewer.scene.requestRender();
      
      // Call the completion callback immediately
      if (options.onComplete) {
        setTimeout(options.onComplete, 100);
      }
    } else {
      // Simplified animation with minimal properties
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          selectedLocation.x,
          selectedLocation.y,
          500000.0
        ),
        duration: 2.0,
        complete: options.onComplete,
        easingFunction: Cesium.EasingFunction.LINEAR_NONE // Simplest easing function
      });
    }
  } catch (error) {
    console.error('Error during flight animation:', error);
    // Still trigger the completion callback even if there's an error
    if (options.onComplete) {
      setTimeout(options.onComplete, 0);
    }
  }
};
