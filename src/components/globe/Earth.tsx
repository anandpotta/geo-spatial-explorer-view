
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const [textureError, setTextureError] = useState(false);
  
  // Use a base color for fallback
  const fallbackMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x2233ff),
    emissive: new THREE.Color(0x112244),
    specular: new THREE.Color(0xffffff),
    shininess: 10
  });
  
  // Load textures with error handling
  let textures;
  try {
    textures = useTexture({
      map: '/earth-texture.jpg',
      bumpMap: '/earth-bump.jpg',
      specularMap: '/earth-specular.jpg'
    });
  } catch (error) {
    console.error('Error loading textures:', error);
    setTextureError(true);
  }
  
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
