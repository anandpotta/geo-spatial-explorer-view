
import { useRef, useEffect } from 'react';
import L from 'leaflet';

export function useLayerReferences() {
  const isMountedRef = useRef(true);
  const removeButtonRoots = useRef<Map<string, any>>(new Map());
  const uploadButtonRoots = useRef<Map<string, any>>(new Map());
  const rotationControlRoots = useRef<Map<string, any>>(new Map());
  const layersRef = useRef<Map<string, L.Layer>>(new Map());

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Cleanup all React roots
      removeButtonRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting root:', err);
        }
      });
      removeButtonRoots.current.clear();
      
      uploadButtonRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting upload button root:', err);
        }
      });
      uploadButtonRoots.current.clear();
      
      rotationControlRoots.current.forEach(root => {
        try {
          root.unmount();
        } catch (err) {
          console.error('Error unmounting rotation control root:', err);
        }
      });
      rotationControlRoots.current.clear();
      
      layersRef.current.clear();
    };
  }, []);

  return {
    isMountedRef,
    removeButtonRoots,
    uploadButtonRoots,
    rotationControlRoots,
    layersRef
  };
}
