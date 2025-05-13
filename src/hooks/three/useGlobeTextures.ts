
import { useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { loadEarthTextures } from '@/utils/three/texture-loader';

export function useGlobeTextures(
  earthMesh: THREE.Mesh | null,
  onTexturesLoaded?: () => void
) {
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const texturesLoadedRef = useState<boolean>(false);
  
  // Function to handle texture loading
  const handleTextureLoading = useCallback(() => {
    if (!earthMesh) return;
    
    console.log("Starting texture loading for Earth");
    
    // Cast to proper material type
    const material = earthMesh.material as THREE.MeshPhongMaterial;
    
    // Load the textures
    loadEarthTextures(material, (earthLoaded, bumpLoaded) => {
      const allLoaded = earthLoaded && bumpLoaded;
      
      console.log(`Textures loaded - Earth: ${earthLoaded}, Bump: ${bumpLoaded}, All: ${allLoaded}`);
      
      if (allLoaded && !texturesLoadedRef[0]) {
        console.log("All textures loaded successfully");
        setTexturesLoaded(true);
        texturesLoadedRef[0] = true;
        
        if (onTexturesLoaded) {
          console.log("Calling textures loaded callback");
          onTexturesLoaded();
        }
      }
    });
  }, [earthMesh, onTexturesLoaded, texturesLoadedRef]);
  
  // Initialize texture loading when mesh is available
  useEffect(() => {
    if (!earthMesh || texturesLoaded) return;
    
    handleTextureLoading();
    
    return () => {
      // Cleanup if needed
    };
  }, [earthMesh, texturesLoaded, handleTextureLoading]);
  
  return {
    texturesLoaded,
    handleTextureLoading
  };
}
