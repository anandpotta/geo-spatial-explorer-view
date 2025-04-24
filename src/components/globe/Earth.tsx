
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const [rotationSpeed] = useState(0.001);
  
  // Use drei's useTexture hook for better texture loading
  const textures = useTexture({
    map: '/earth-texture.jpg',
    bumpMap: '/earth-bump.jpg',
    specularMap: '/earth-specular.jpg',
  }, (loaded) => {
    console.log('Earth textures loaded successfully:', loaded);
  });
  
  // Apply a small bump scale
  if (textures.bumpMap) {
    textures.bumpMap.wrapS = textures.bumpMap.wrapT = THREE.RepeatWrapping;
  }
  
  // Rotate the earth on each frame
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <Sphere ref={earthRef} args={[1, 64, 64]} position={[0, 0, 0]}>
      <meshPhongMaterial
        map={textures.map}
        bumpMap={textures.bumpMap}
        bumpScale={0.15}
        specularMap={textures.specularMap}
        specular={new THREE.Color('grey')}
        shininess={10}
      />
    </Sphere>
  );
}
