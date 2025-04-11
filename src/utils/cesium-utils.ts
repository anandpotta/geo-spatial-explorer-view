
import * as Cesium from 'cesium';
import { Location } from './geo-utils';

export interface FlightOptions {
  onComplete?: () => void;
  cinematic?: boolean;
}

// Create a multi-stage cinematic flight animation
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
      },
      label: {
        text: selectedLocation.label.split(',')[0], // First part of the address
        font: '14pt sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    
    entityRef.current = entity;
    
    if (options.cinematic) {
      // Multi-stage cinematic flight - simplified to reduce resource usage
      const currentHeight = viewer.camera.positionCartographic.height;
      
      // Simplified animation to reduce resource usage and network requests
      let animationStages = [];
      
      if (currentHeight < 15000000) {
        // First stage - zoom out to high altitude
        animationStages.push({
          destination: Cesium.Cartesian3.fromDegrees(
            selectedLocation.x,
            selectedLocation.y,
            20000000.0
          ),
          duration: 2.0
        });
      }
      
      // Second stage - zoom in to the location
      animationStages.push({
        destination: Cesium.Cartesian3.fromDegrees(
          selectedLocation.x,
          selectedLocation.y,
          500000.0
        ),
        duration: 3.0
      });
      
      // Final stage - slight perspective adjustment
      animationStages.push({
        destination: Cesium.Cartesian3.fromDegrees(
          selectedLocation.x + 0.05,
          selectedLocation.y - 0.05,
          100000.0
        ),
        duration: 2.0
      });
      
      // Execute the animation stages in sequence
      let currentStageIndex = 0;
      
      const executeNextStage = () => {
        if (currentStageIndex >= animationStages.length) {
          if (options.onComplete) {
            options.onComplete();
          }
          return;
        }
        
        const stage = animationStages[currentStageIndex];
        currentStageIndex++;
        
        viewer.camera.flyTo({
          destination: stage.destination,
          duration: stage.duration,
          complete: executeNextStage
        });
      };
      
      // Start the animation sequence
      executeNextStage();
    } else {
      // Simple direct flight animation
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          selectedLocation.x,
          selectedLocation.y,
          500000.0
        ),
        duration: 2.0,
        complete: options.onComplete
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
