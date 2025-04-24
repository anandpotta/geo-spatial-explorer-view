
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const [rotationSpeed] = useState(0.001);
  
  // Use publicly available Earth textures from NASA's Visible Earth project
  const textures = useTexture({
    map: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
    bumpMap: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2074&auto=format&fit=crop',
    specularMap: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?q=80&w=2187&auto=format&fit=crop',
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
