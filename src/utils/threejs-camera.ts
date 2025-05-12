
import * as THREE from 'three';

/**
 * Zoom camera in
 */
export function zoomIn(viewer: any) {
  if (viewer && viewer.controls) {
    const currentDistance = viewer.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    const newDistance = Math.max(currentDistance * 0.8, 6); // Don't get too close
    
    // Create a vector pointing from the origin to the camera
    const direction = viewer.camera.position.clone().normalize();
    
    // Set new position
    viewer.camera.position.copy(direction.multiplyScalar(newDistance));
    
    // Update controls
    viewer.controls.update();
  }
}

/**
 * Zoom camera out
 */
export function zoomOut(viewer: any) {
  if (viewer && viewer.controls) {
    const currentDistance = viewer.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    const newDistance = Math.min(currentDistance * 1.2, 30); // Don't go too far
    
    // Create a vector pointing from the origin to the camera
    const direction = viewer.camera.position.clone().normalize();
    
    // Set new position
    viewer.camera.position.copy(direction.multiplyScalar(newDistance));
    
    // Update controls
    viewer.controls.update();
  }
}

/**
 * Reset camera to default position
 */
export function resetCamera(viewer: any) {
  if (viewer && viewer.camera && viewer.controls) {
    // Reset to default position
    viewer.camera.position.set(0, 0, 20);
    viewer.camera.lookAt(0, 0, 0);
    viewer.controls.update();
  }
}
