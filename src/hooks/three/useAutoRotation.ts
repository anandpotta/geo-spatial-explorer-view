
import { useCallback, useRef } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Hook for managing auto-rotation of the globe
 */
export function useAutoRotation(controlsRef: React.MutableRefObject<OrbitControls | null>) {
  const autoRotationEnabledRef = useRef<boolean>(true);
  const rotationSpeedRef = useRef<number>(0.3);
  
  // Enable/disable auto-rotation with smoother transitions
  const setAutoRotation = useCallback((enabled: boolean) => {
    if (controlsRef.current) {
      if (enabled && !controlsRef.current.autoRotate) {
        // When enabling, start with a slower speed and gradually increase
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 0.1;
        
        // Gradually increase rotation speed for a smoother transition
        const increaseSpeed = () => {
          if (controlsRef.current && controlsRef.current.autoRotateSpeed < rotationSpeedRef.current) {
            controlsRef.current.autoRotateSpeed += 0.05;
            setTimeout(increaseSpeed, 100);
          }
        };
        setTimeout(increaseSpeed, 100);
      } else if (!enabled && controlsRef.current.autoRotate) {
        // When disabling, gradually decrease speed for a smoother stop
        const decreaseSpeed = () => {
          if (controlsRef.current && controlsRef.current.autoRotateSpeed > 0.1) {
            controlsRef.current.autoRotateSpeed -= 0.05;
            setTimeout(decreaseSpeed, 100);
          } else if (controlsRef.current) {
            controlsRef.current.autoRotate = false;
          }
        };
        decreaseSpeed();
      } else {
        // Direct setting if no transition needed
        controlsRef.current.autoRotate = enabled;
      }
      autoRotationEnabledRef.current = enabled;
    }
  }, [controlsRef]);
  
  // Allow changing rotation speed
  const setRotationSpeed = useCallback((speed: number) => {
    rotationSpeedRef.current = speed;
    if (controlsRef.current && controlsRef.current.autoRotate) {
      controlsRef.current.autoRotateSpeed = speed;
    }
  }, [controlsRef]);
  
  return {
    setAutoRotation,
    setRotationSpeed,
    autoRotationEnabledRef
  };
}
