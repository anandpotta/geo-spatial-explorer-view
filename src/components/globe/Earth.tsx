
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth({ onLocationSelect }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const [rotationSpeed] = useState(0.001);
  const [textureError, setTextureError] = useState(false);
  
  // Load earth textures with a try-catch approach
  const textureUrls = [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2074&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?q=80&w=2187&auto=format&fit=crop'
  ];
  
  // Use useTexture with proper arguments
  const [map, bumpMap, specularMap] = useTexture(textureUrls, (loadedTextures) => {
    console.log('Earth textures loaded successfully');
    setTextureError(false);
  });
  
  // Handle texture loading errors by checking texture properties
  useEffect(() => {
    // Function to check if textures loaded successfully
    const checkTextureValidity = () => {
      try {
        const allValid = [map, bumpMap, specularMap].every(texture => 
          texture && texture.image && texture.image.complete && texture.image.width > 0
        );
        
        if (!allValid) {
          console.error('One or more earth textures failed to load completely');
          setTextureError(true);
        }
      } catch (err) {
        console.error('Error checking texture validity:', err);
        setTextureError(true);
      }
    };
    
    // Check textures after a short delay to allow loading to complete
    const timerId = setTimeout(checkTextureValidity, 3000);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [map, bumpMap, specularMap]);
  
  // Apply a small bump scale if bumpMap is available
  if (bumpMap) {
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  }
  
  // Rotate the earth on each frame
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += rotationSpeed;
    }
  });

  // Handle click on the globe to select location
  const handleClick = (event) => {
    if (!onLocationSelect) return;
    
    event.stopPropagation();
    
    // Calculate latitude and longitude from the click point
    const { point } = event;
    const vector = new THREE.Vector3(point.x, point.y, point.z).normalize();
    
    // Convert the normalized point to latitude and longitude
    const latitude = (Math.asin(vector.y) * 180) / Math.PI;
    const longitude = (Math.atan2(vector.z, vector.x) * 180) / Math.PI;
    
    console.log(`Globe clicked at lat: ${latitude}, long: ${longitude}`);
    
    onLocationSelect({
      latitude,
      longitude
    });
  };

  return (
    <Sphere 
      ref={earthRef} 
      args={[1, 64, 64]} 
      position={[0, 0, 0]}
      onClick={handleClick}
    >
      {textureError ? (
        // Fallback material if textures fail to load
        <meshStandardMaterial
          color="#1e3a8a"
          metalness={0.2}
          roughness={0.8}
          emissive="#072d5b"
          emissiveIntensity={0.2}
        />
      ) : (
        <meshPhongMaterial
          map={map}
          bumpMap={bumpMap}
          bumpScale={0.15}
          specularMap={specularMap}
          specular={new THREE.Color('grey')}
          shininess={10}
        />
      )}
    </Sphere>
  );
}
