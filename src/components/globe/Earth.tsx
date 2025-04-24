
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth({ onLocationSelect }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const [rotationSpeed] = useState(0.001);
  const [textureError, setTextureError] = useState(false);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  
  // Define texture paths
  const texturePaths = {
    map: '/earth-texture.jpg',
    bumpMap: '/earth-bump.jpg',
    specularMap: '/earth-specular.jpg'
  };
  
  // Load textures using drei's useTexture hook
  const textures = useTexture(texturePaths, (loadedTextures) => {
    // This callback runs when textures are loaded
    setTexturesLoaded(true);
  }, (error) => {
    // This callback runs if there's an error loading textures
    console.error('Failed to load Earth textures:', error);
    setTextureError(true);
  });
  
  // Configure textures after loading
  useEffect(() => {
    if (texturesLoaded && textures) {
      try {
        // Type check each texture before accessing properties
        const allValid = Object.entries(textures).every(([key, texture]) => {
          // Make sure texture is a valid THREE.Texture with image property
          return texture instanceof THREE.Texture && 
                 texture.image !== undefined && 
                 texture.image !== null;
        });
        
        if (!allValid) {
          console.error('One or more earth textures failed to load completely');
          setTextureError(true);
        } else if (textures.bumpMap && textures.bumpMap instanceof THREE.Texture) {
          // Apply texture settings safely
          textures.bumpMap.wrapS = THREE.RepeatWrapping;
          textures.bumpMap.wrapT = THREE.RepeatWrapping;
        }
      } catch (err) {
        console.error('Error checking texture validity:', err);
        setTextureError(true);
      }
    }
  }, [texturesLoaded, textures]);
  
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
      {textureError || !textures ? (
        // Fallback material if textures fail to load
        <meshStandardMaterial
          color="#1e3a8a"
          metalness={0.2}
          roughness={0.8}
          emissive="#072d5b"
          emissiveIntensity={0.2}
        />
      ) : (
        // Only use textures if they're available
        <meshPhongMaterial
          map={textures.map}
          bumpMap={textures.bumpMap}
          bumpScale={0.15}
          specularMap={textures.specularMap}
          specular={new THREE.Color('grey')}
          shininess={10}
        />
      )}
    </Sphere>
  );
}
