
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
  const loadStartedRef = useRef(false);
  
  // Function to handle texture loading with retries
  const handleTextureLoading = useCallback(() => {
    if (!earthMesh) return;
    
    // Avoid starting multiple loads
    if (loadStartedRef.current) {
      console.log("Texture loading already in progress");
      return;
    }
    
    loadStartedRef.current = true;
    console.log("Starting texture loading for Earth");
    
    // Cast to proper material type
    const material = earthMesh.material as THREE.MeshPhongMaterial;
    
    // Set a base color immediately for visual feedback
    material.color = new THREE.Color(0x1a5276);
    material.needsUpdate = true;
    
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
          loadStartedRef.current = false; // Allow new load attempt
          handleTextureLoading();
        }, 1000); // 1 second between retries
      } else if (retryCountRef.current >= MAX_RETRIES) {
        // After max retries, continue anyway with fallback appearance
        console.log("Max texture load retries reached, continuing with basic appearance");
        material.color = new THREE.Color(0x2980b9); // Slightly brighter blue as fallback
        material.needsUpdate = true;
        
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
    
    // Short delay before starting texture load to ensure mesh is fully setup
    const startLoadTimer = setTimeout(() => {
      handleTextureLoading();
    }, 100);
    
    return () => {
      // Cleanup
      clearTimeout(startLoadTimer);
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
