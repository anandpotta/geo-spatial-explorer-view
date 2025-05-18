
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
  const MAX_RETRIES = 2;
  const loadStartedRef = useRef(false);
  const backupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    if (textureRetryTimerRef.current) {
      clearTimeout(textureRetryTimerRef.current);
      textureRetryTimerRef.current = null;
    }
    
    if (backupTimerRef.current) {
      clearTimeout(backupTimerRef.current);
      backupTimerRef.current = null;
    }
  }, []);
  
  // Function to handle texture loading with retries
  const handleTextureLoading = useCallback(() => {
    if (!earthMesh || !mountedRef.current) return;
    
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
    
    // Set a backup timer to ensure we don't get stuck waiting for textures
    cleanup(); // Clear any existing timers
    
    backupTimerRef.current = setTimeout(() => {
      if (!texturesLoadedRef.current && mountedRef.current) {
        console.log("Backup timer triggered for texture loading");
        setTexturesLoaded(true);
        texturesLoadedRef.current = true;
        
        if (onTexturesLoaded && mountedRef.current) {
          console.log("Calling textures loaded callback from backup timer");
          onTexturesLoaded();
        }
      }
    }, 3000);
    
    // Load the textures
    loadEarthTextures(material, (earthLoaded, bumpLoaded) => {
      // Check if component is still mounted
      if (!mountedRef.current) return;
      
      const allLoaded = earthLoaded && bumpLoaded;
      
      console.log(`Textures loaded - Earth: ${earthLoaded}, Bump: ${bumpLoaded}, All: ${allLoaded}`);
      
      if (allLoaded && !texturesLoadedRef.current && mountedRef.current) {
        // Clear backup timer if textures loaded successfully
        if (backupTimerRef.current) {
          clearTimeout(backupTimerRef.current);
          backupTimerRef.current = null;
        }
        
        console.log("All textures loaded successfully");
        setTexturesLoaded(true);
        texturesLoadedRef.current = true;
        
        if (onTexturesLoaded && mountedRef.current) {
          console.log("Calling textures loaded callback");
          onTexturesLoaded();
        }
      } else if (!allLoaded && retryCountRef.current < MAX_RETRIES && mountedRef.current) {
        // Retry texture loading after a delay
        if (textureRetryTimerRef.current) {
          clearTimeout(textureRetryTimerRef.current);
        }
        
        retryCountRef.current++;
        console.log(`Retrying texture load, attempt ${retryCountRef.current}/${MAX_RETRIES}`);
        
        textureRetryTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            loadStartedRef.current = false; // Allow new load attempt
            handleTextureLoading();
          }
        }, 800); // Slightly reduced time between retries
      } else if ((retryCountRef.current >= MAX_RETRIES || !allLoaded) && mountedRef.current) {
        // After max retries, continue anyway with fallback appearance
        console.log("Max texture load retries reached, continuing with basic appearance");
        material.color = new THREE.Color(0x2980b9); // Slightly brighter blue as fallback
        material.needsUpdate = true;
        
        setTexturesLoaded(true);
        texturesLoadedRef.current = true;
        
        if (onTexturesLoaded && mountedRef.current) {
          console.log("Calling textures loaded callback after max retries");
          onTexturesLoaded();
        }
      }
    });
  }, [earthMesh, onTexturesLoaded, cleanup]);
  
  // Initialize texture loading when mesh is available
  useEffect(() => {
    if (!earthMesh || texturesLoaded || !mountedRef.current) return;
    
    // Short delay before starting texture load to ensure mesh is fully setup
    const startLoadTimer = setTimeout(() => {
      if (mountedRef.current) {
        handleTextureLoading();
      }
    }, 100);
    
    return () => {
      clearTimeout(startLoadTimer);
      cleanup();
    };
  }, [earthMesh, texturesLoaded, handleTextureLoading, cleanup]);
  
  // Unmount cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);
  
  return {
    texturesLoaded,
    handleTextureLoading,
    cleanup
  };
}
