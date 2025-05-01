
import { useRef, useEffect } from 'react';
import L from 'leaflet';

export function useLayerReferences() {
  const isMountedRef = useRef(true);
  const removeButtonRoots = useRef<Map<string, any>>(new Map());
  const uploadButtonRoots = useRef<Map<string, any>>(new Map());
  const imageControlRoots = useRef<Map<string, any>>(new Map());
  const layersRef = useRef<Map<string, L.Layer>>(new Map());

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Cleanup all React roots
      const cleanup = (rootsMap: Map<string, any>) => {
        rootsMap.forEach(root => {
          try {
            if (typeof root.unmount === 'function') {
              root.unmount();
            }
          } catch (err) {
            console.error('Error unmounting root:', err);
          }
        });
        rootsMap.clear();
      };
      
      cleanup(removeButtonRoots.current);
      cleanup(uploadButtonRoots.current);
      cleanup(imageControlRoots.current);
      
      layersRef.current.clear();
    };
  }, []);

  return {
    isMountedRef,
    removeButtonRoots,
    uploadButtonRoots,
    imageControlRoots,
    layersRef
  };
}
