
import { useRef, useEffect } from 'react';
import L from 'leaflet';

export function useLayerReferences() {
  const isMountedRef = useRef(true);
  const removeButtonRoots = useRef<Map<string, any>>(new Map());
  const uploadButtonRoots = useRef<Map<string, any>>(new Map());
  const imageControlsRoots = useRef<Map<string, any>>(new Map());
  const layersRef = useRef<Map<string, L.Layer>>(new Map());

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Safely unmount React roots with proper error handling
      const safelyUnmountRoot = (root: any) => {
        if (!root) return;
        
        try {
          // Check if root has unmount method before calling
          if (root.unmount && typeof root.unmount === 'function') {
            // Use a try-catch to prevent errors during unmounting
            try {
              root.unmount();
            } catch (err) {
              console.error('Error unmounting React root:', err);
            }
          }
        } catch (err) {
          console.error('Error accessing React root:', err);
        }
      };
      
      // Safely clean up all React roots
      try {
        removeButtonRoots.current.forEach(root => {
          safelyUnmountRoot(root);
        });
      } catch (err) {
        console.error('Error cleaning up remove button roots:', err);
      }
      
      removeButtonRoots.current.clear();
      
      try {
        uploadButtonRoots.current.forEach(root => {
          safelyUnmountRoot(root);
        });
      } catch (err) {
        console.error('Error cleaning up upload button roots:', err);
      }
      
      uploadButtonRoots.current.clear();
      
      try {
        imageControlsRoots.current.forEach(root => {
          safelyUnmountRoot(root);
        });
      } catch (err) {
        console.error('Error cleaning up image controls roots:', err);
      }
      
      imageControlsRoots.current.clear();
      layersRef.current.clear();
    };
  }, []);

  return {
    isMountedRef,
    removeButtonRoots,
    uploadButtonRoots,
    imageControlsRoots,
    layersRef
  };
}
