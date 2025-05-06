
import * as THREE from 'three';
import { MIN_DISTANCE, OUTER_SPACE_DISTANCE } from './types';

/**
 * Set up basic controls for the globe
 */
export function setupControls(
  container: HTMLDivElement,
  globeRef: React.MutableRefObject<THREE.Mesh | null>,
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>,
  flyingStateRef: React.MutableRefObject<{ isFlying: boolean; }>
): void {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  
  // Clean up any existing event listeners
  const cleanupOldListeners = () => {
    const clone = container.cloneNode(false);
    if (container.parentNode) {
      container.parentNode.replaceChild(clone, container);
      return clone as HTMLDivElement;
    }
    return container;
  };
  
  // Setup mouse event listeners
  const onMouseDown = (event: MouseEvent) => {
    isDragging = true;
    previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
    event.preventDefault();
  };
  
  const onMouseMove = (event: MouseEvent) => {
    if (!isDragging || !globeRef.current || flyingStateRef.current.isFlying) return;
    
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y
    };
    
    // Rotate the globe based on mouse movement
    globeRef.current.rotation.y += deltaMove.x * 0.005;
    globeRef.current.rotation.x += deltaMove.y * 0.005;
    
    previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  };
  
  const onMouseUp = () => {
    isDragging = false;
  };
  
  const onMouseLeave = () => {
    isDragging = false;
  };
  
  // Setup touch event listeners
  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 1) {
      isDragging = true;
      previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
      event.preventDefault();
    }
  };
  
  const onTouchMove = (event: TouchEvent) => {
    if (isDragging && event.touches.length === 1 && globeRef.current && !flyingStateRef.current.isFlying) {
      const deltaMove = {
        x: event.touches[0].clientX - previousMousePosition.x,
        y: event.touches[0].clientY - previousMousePosition.y
      };
      
      globeRef.current.rotation.y += deltaMove.x * 0.005;
      globeRef.current.rotation.x += deltaMove.y * 0.005;
      
      previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
      
      event.preventDefault();
    }
  };
  
  const onTouchEnd = () => {
    isDragging = false;
  };
  
  // Setup wheel event listener
  const onWheel = (event: WheelEvent) => {
    if (!cameraRef.current || flyingStateRef.current.isFlying) return;
    
    const zoomSpeed = 0.1;
    const direction = event.deltaY > 0 ? 1 : -1;
    
    // Calculate new distance keeping it within bounds
    const currentDistance = cameraRef.current.position.length();
    const newDistance = Math.max(
      MIN_DISTANCE,
      Math.min(OUTER_SPACE_DISTANCE, currentDistance * (1 + direction * zoomSpeed))
    );
    
    // Update the camera position while keeping the same direction
    cameraRef.current.position.normalize();
    cameraRef.current.position.multiplyScalar(newDistance);
    
    event.preventDefault();
  };
  
  // Add event listeners
  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mouseup', onMouseUp);
  container.addEventListener('mouseleave', onMouseLeave);
  container.addEventListener('touchstart', onTouchStart);
  container.addEventListener('touchmove', onTouchMove);
  container.addEventListener('touchend', onTouchEnd);
  container.addEventListener('wheel', onWheel);
}
