
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth({ onLocationSelect }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const [rotationSpeed] = useState(0.001);
  const [textureError, setTextureError] = useState(false);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  
  // Define texture paths - using Unsplash placeholders that actually exist
  const texturePaths = {
    map: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', // Blue lake/water image works well for Earth
    bumpMap: 'https://images.unsplash.com/photo-1500673922987-e212871fec22', // Light/shadow contrast for bump mapping
    specularMap: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05' // Good for specular highlights
  };
  
  // Load textures using drei's useTexture hook with proper options object
  const textures = useTexture(texturePaths);

  // Handle texture loading success or failure with useEffect
  useEffect(() => {
    try {
      // Check if textures are valid
      const allValid = Object.values(textures).every(
        (texture) => texture instanceof THREE.Texture && texture.image !== undefined
      );
      
      if (allValid) {
        console.log('Earth textures loaded successfully');
        setTexturesLoaded(true);
        
        // Apply texture settings safely
        if (textures.bumpMap && textures.bumpMap instanceof THREE.Texture) {
          textures.bumpMap.wrapS = THREE.RepeatWrapping;
          textures.bumpMap.wrapT = THREE.RepeatWrapping;
        }
      } else {
        console.error('One or more earth textures failed to load completely');
        setTextureError(true);
      }
    } catch (err) {
      console.error('Error applying texture settings:', err);
      setTextureError(true);
    }
  }, [textures]);
  
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
      {textureError || !texturesLoaded ? (
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
