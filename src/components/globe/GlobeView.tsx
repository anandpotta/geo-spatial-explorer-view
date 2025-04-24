
import { Suspense, useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { ErrorBoundary } from 'react-error-boundary';
import Earth from './Earth';

// Improved fallback component when errors occur in the Earth component
function EarthErrorFallback() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#1e40af" wireframe={false} />
      </mesh>
      {/* Add a wireframe overlay for visual interest */}
      <mesh>
        <sphereGeometry args={[1.01, 16, 16]} />
        <meshBasicMaterial color="#60a5fa" wireframe={true} transparent={true} opacity={0.4} />
      </mesh>
    </>
  );
}

export default function GlobeView({ onLocationSelect }) {
  // Only track error handling state once to prevent re-renders
  const [hasError, setHasError] = useState(false);
  const errorHandled = useRef(false);
  
  // Enhanced error handler with ref to prevent multiple state updates
  const handleError = useCallback((error) => {
    if (!errorHandled.current) {
      console.error('Globe rendering error:', error);
      setHasError(true);
      errorHandled.current = true;
    }
  }, []);
  
  // Safe wrapper for location selection with callback to prevent re-renders
  const handleLocationSelect = useCallback((coords) => {
    try {
      if (coords && onLocationSelect) {
        onLocationSelect({
          id: `loc-${coords.latitude}-${coords.longitude}`,
          label: `Location at ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
          x: coords.longitude,
          y: coords.latitude
        });
      }
    } catch (err) {
      console.error('Error selecting location on globe:', err);
    }
  }, [onLocationSelect]);

  return (
    <div className="w-full h-full">
      <Canvas 
        camera={{ position: [0, 0, 4] }}
        gl={{ alpha: false, antialias: true }}
        dpr={[1, 2]} // Responsive rendering for different device pixel ratios
        onCreated={({ gl }) => {
          // Configure WebGL context for better performance
          gl.setClearColor('#000');
        }}
      >
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -5]} intensity={0.8} />
        {/* Add a subtle rim light for better depth */}
        <pointLight position={[0, 0, -10]} intensity={0.5} color="#4080ff" />
        
        <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} />
        
        <Suspense fallback={<EarthErrorFallback />}>
          <ErrorBoundary
            fallback={<EarthErrorFallback />}
            onError={handleError}
            resetKeys={[hasError]}
          >
            {!hasError && <Earth onLocationSelect={handleLocationSelect} />}
          </ErrorBoundary>
        </Suspense>
        
        <OrbitControls 
          enableZoom={true}
          minDistance={2}
          maxDistance={10}
          autoRotate={false}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
      
      <div className="absolute bottom-2 left-2 text-xs text-white opacity-70">
        <p>Drag to rotate • Scroll to zoom • Click on globe to select locations</p>
      </div>
    </div>
  );
}
