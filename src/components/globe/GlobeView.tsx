
import { Suspense } from 'react';
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

export default function GlobeView() {
  return (
    <div className="w-full h-full">
      <Canvas 
        camera={{ position: [0, 0, 4] }}
        gl={{ alpha: false, antialias: true }}
        dpr={[1, 2]} // Responsive rendering for different device pixel ratios
      >
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} />
        <Suspense fallback={<EarthErrorFallback />}>
          <ErrorBoundary fallback={<EarthErrorFallback />}>
            <Earth />
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
        <p>Drag to rotate • Scroll to zoom • For best results, download earth textures and place in public folder</p>
      </div>
    </div>
  );
}
