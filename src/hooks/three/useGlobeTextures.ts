
import { useState, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { loadEarthTextures } from '@/utils/three/texture-loader';

export function useGlobeTextures(
  earthMesh: THREE.Mesh | null,
  onTexturesLoaded?: () => void
) {
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const texturesLoadedRef = useRef<boolean>(false);
  const textureRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  
  // Function to handle texture loading with retries
  const handleTextureLoading = useCallback(() => {
    if (!earthMesh) return;
    
    console.log("Starting texture loading for Earth");
    
    // Cast to proper material type
    const material = earthMesh.material as THREE.MeshPhongMaterial;
    
    // Load the textures
    loadEarthTextures(material, (earthLoaded, bumpLoaded) => {
      const allLoaded = earthLoaded && bumpLoaded;
      
      console.log(`Textures loaded - Earth: ${earthLoaded}, Bump: ${bumpLoaded}, All: ${allLoaded}`);
      
      if (allLoaded && !texturesLoadedRef.current) {
        console.log("All textures loaded successfully");
        setTexturesLoaded(true);
        texturesLoadedRef.current = true;
        
        if (onTexturesLoaded) {
          console.log("Calling textures loaded callback");
          onTexturesLoaded();
        }
      } else if (!allLoaded && retryCountRef.current < MAX_RETRIES) {
        // Retry texture loading after a delay
        if (textureRetryTimerRef.current) {
          clearTimeout(textureRetryTimerRef.current);
        }
        
        retryCountRef.current++;
        console.log(`Retrying texture load, attempt ${retryCountRef.current}/${MAX_RETRIES}`);
        
        textureRetryTimerRef.current = setTimeout(() => {
          handleTextureLoading();
        }, 1000); // 1 second between retries
      } else if (retryCountRef.current >= MAX_RETRIES) {
        // After max retries, continue anyway
        console.log("Max texture load retries reached, continuing with partial textures");
        setTexturesLoaded(true);
        texturesLoadedRef.current = true;
        
        if (onTexturesLoaded) {
          console.log("Calling textures loaded callback after max retries");
          onTexturesLoaded();
        }
      }
    });
  }, [earthMesh, onTexturesLoaded]);
  
  // Initialize texture loading when mesh is available
  useEffect(() => {
    if (!earthMesh || texturesLoaded) return;
    
    handleTextureLoading();
    
    return () => {
      // Cleanup
      if (textureRetryTimerRef.current) {
        clearTimeout(textureRetryTimerRef.current);
        textureRetryTimerRef.current = null;
      }
    };
  }, [earthMesh, texturesLoaded, handleTextureLoading]);
  
  return {
    texturesLoaded,
    handleTextureLoading
  };
}
