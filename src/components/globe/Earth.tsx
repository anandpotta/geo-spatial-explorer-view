
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const [textureError, setTextureError] = useState(false);
  
  // Create a memoized material instance that won't change on every render
  const [earthMaterial] = useState(() => {
    // Create a simple material to start with
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x2233ff),
      emissive: new THREE.Color(0x112244),
      specular: new THREE.Color(0xffffff),
      shininess: 10
    });
  });
  
  // Load textures in useEffect
  useEffect(() => {
    try {
      const textureLoader = new THREE.TextureLoader();
      
      // Load map texture
      textureLoader.load(
        '/earth-texture.jpg',
        (mapTexture) => {
          earthMaterial.map = mapTexture;
          earthMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          console.warn('Failed to load earth texture map');
          setTextureError(true);
        }
      );
      
      // Load bump map
      textureLoader.load(
        '/earth-bump.jpg',
        (bumpTexture) => {
          earthMaterial.bumpMap = bumpTexture;
          earthMaterial.bumpScale = 0.15;
          earthMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          console.warn('Failed to load earth bump map');
          setTextureError(true);
        }
      );
      
      // Load specular map
      textureLoader.load(
        '/earth-specular.jpg',
        (specularTexture) => {
          earthMaterial.specularMap = specularTexture;
          earthMaterial.specular = new THREE.Color('grey');
          earthMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          console.warn('Failed to load earth specular map');
          setTextureError(true);
        }
      );
      
    } catch (error) {
      console.error('Error loading textures:', error);
      setTextureError(true);
    }
    
    // Cleanup function
    return () => {
      if (earthMaterial.map) earthMaterial.map.dispose();
      if (earthMaterial.bumpMap) earthMaterial.bumpMap.dispose();
      if (earthMaterial.specularMap) earthMaterial.specularMap.dispose();
    };
  }, [earthMaterial]);
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Sphere ref={earthRef} args={[1, 64, 64]}>
      <meshPhongMaterial ref={(material) => {
        if (material) {
          // Copy properties from our prepared material to the actual mesh material
          Object.assign(material, {
            color: earthMaterial.color,
            emissive: earthMaterial.emissive,
            specular: earthMaterial.specular,
            shininess: earthMaterial.shininess,
            map: earthMaterial.map,
            bumpMap: earthMaterial.bumpMap,
            bumpScale: earthMaterial.bumpScale,
            specularMap: earthMaterial.specularMap
          });
        }
      }} />
    </Sphere>
  );
}
