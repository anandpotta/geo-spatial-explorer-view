
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  
  // Use the useTexture hook to properly load textures
  const textures = useTexture({
    map: '/earth-texture.jpg',
    bumpMap: '/earth-bump.jpg',
    specularMap: '/earth-specular.jpg'
  });
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Sphere ref={earthRef} args={[1, 64, 64]}>
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
