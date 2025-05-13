
import { useCallback, useRef } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Hook for managing auto-rotation of the globe
 */
export function useAutoRotation(controlsRef: React.MutableRefObject<OrbitControls | null>) {
  const autoRotationEnabledRef = useRef<boolean>(true);
  
  // Enable/disable auto-rotation with smoother transitions
  const setAutoRotation = useCallback((enabled: boolean) => {
    if (controlsRef.current) {
      if (enabled && !controlsRef.current.autoRotate) {
        // When enabling, start with a slower speed and gradually increase
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 0.1;
        
        // Gradually increase rotation speed
        const increaseSpeed = () => {
          if (controlsRef.current && controlsRef.current.autoRotateSpeed < 0.3) {
            controlsRef.current.autoRotateSpeed += 0.05;
            setTimeout(increaseSpeed, 100);
          }
        };
        setTimeout(increaseSpeed, 100);
      } else {
        controlsRef.current.autoRotate = enabled;
      }
      autoRotationEnabledRef.current = enabled;
    }
  }, [controlsRef]);
  
  return {
    setAutoRotation,
    autoRotationEnabledRef
  };
}
