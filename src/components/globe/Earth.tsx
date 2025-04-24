
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const [textureError, setTextureError] = useState(false);
  const [earthMaterial, setEarthMaterial] = useState<THREE.Material | null>(null);
  
  // Create fallback material outside of render
  const fallbackMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x2233ff),
    emissive: new THREE.Color(0x112244),
    specular: new THREE.Color(0xffffff),
    shininess: 10
  });
  
  // Load textures in useEffect
  useEffect(() => {
    try {
      const textureLoader = new THREE.TextureLoader();
      const mapTexture = textureLoader.load(
        '/earth-texture.jpg',
        undefined,
        undefined,
        () => setTextureError(true)
      );
      
      const bumpTexture = textureLoader.load(
        '/earth-bump.jpg',
        undefined,
        undefined,
        () => setTextureError(true)
      );
      
      const specularTexture = textureLoader.load(
        '/earth-specular.jpg',
        undefined,
        undefined,
        () => setTextureError(true)
      );
      
      // Create the material with loaded textures
      const material = new THREE.MeshPhongMaterial({
        map: mapTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.15,
        specularMap: specularTexture,
        specular: new THREE.Color('grey'),
        shininess: 10
      });
      
      setEarthMaterial(material);
      
    } catch (error) {
      console.error('Error loading textures:', error);
      setTextureError(true);
      setEarthMaterial(fallbackMaterial);
    }
    
    // Cleanup function
    return () => {
      if (earthMaterial && earthMaterial instanceof THREE.MeshPhongMaterial) {
        if (earthMaterial.map) earthMaterial.map.dispose();
        if (earthMaterial.bumpMap) earthMaterial.bumpMap.dispose();
        if (earthMaterial.specularMap) earthMaterial.specularMap.dispose();
        earthMaterial.dispose();
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
      {earthMaterial ? (
        <primitive object={earthMaterial} attach="material" />
      ) : (
        <primitive object={fallbackMaterial} attach="material" />
      )}
    </Sphere>
  );
}
