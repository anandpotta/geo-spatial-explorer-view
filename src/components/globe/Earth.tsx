
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const [textureError, setTextureError] = useState(false);
  const [textures, setTextures] = useState<{
    map?: THREE.Texture;
    bumpMap?: THREE.Texture;
    specularMap?: THREE.Texture;
  } | null>(null);
  
  // Create fallback material outside of render
  const fallbackMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x2233ff),
    emissive: new THREE.Color(0x112244),
    specular: new THREE.Color(0xffffff),
    shininess: 10
  });
  
  // Move texture loading to useEffect to prevent render loop
  useEffect(() => {
    try {
      // Load textures using Three.js TextureLoader instead of useTexture hook
      const textureLoader = new THREE.TextureLoader();
      const loadedTextures = {
        map: textureLoader.load('/earth-texture.jpg', undefined, undefined, () => setTextureError(true)),
        bumpMap: textureLoader.load('/earth-bump.jpg', undefined, undefined, () => setTextureError(true)),
        specularMap: textureLoader.load('/earth-specular.jpg', undefined, undefined, () => setTextureError(true))
      };
      
      setTextures(loadedTextures);
    } catch (error) {
      console.error('Error loading textures:', error);
      setTextureError(true);
    }
    
    // Cleanup function
    return () => {
      // Dispose textures when component unmounts
      if (textures) {
        if (textures.map) textures.map.dispose();
        if (textures.bumpMap) textures.bumpMap.dispose();
        if (textures.specularMap) textures.specularMap.dispose();
      }
    };
  }, []);
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Sphere ref={earthRef} args={[1, 64, 64]}>
      {!textureError && textures ? (
        <meshPhongMaterial
          map={textures.map}
          bumpMap={textures.bumpMap}
          bumpScale={0.15}
          specularMap={textures.specularMap}
          specular={new THREE.Color('grey')}
          shininess={10}
        />
      ) : (
        <primitive object={fallbackMaterial} />
      )}
    </Sphere>
  );
}
