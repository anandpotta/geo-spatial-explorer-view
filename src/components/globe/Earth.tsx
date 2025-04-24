
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth({ onLocationSelect }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const [rotationSpeed] = useState(0.001);
  
  // Simple material with nice earth-like color instead of complex textures
  const earthMaterial = new THREE.MeshStandardMaterial({
    color: "#1e3a8a",
    metalness: 0.2,
    roughness: 0.8,
    emissive: "#072d5b",
    emissiveIntensity: 0.2
  });

  // Add subtle variation to the globe surface
  const bumpTexture = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1500673922987-e212871fec22', undefined, undefined, (error) => {
    console.error('Optional bump texture failed to load:', error);
    // Silently fail - we'll still have the base material
  });
  
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
      <meshStandardMaterial
        color="#1e3a8a"
        metalness={0.2}
        roughness={0.8}
        emissive="#072d5b"
        emissiveIntensity={0.2}
      />
    </Sphere>
  );
}
