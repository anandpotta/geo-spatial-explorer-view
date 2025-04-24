
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Earth from './Earth';
import { ErrorBoundary } from 'react-error-boundary';

// Fallback component when errors occur in the Earth component
function EarthErrorFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="blue" wireframe />
    </mesh>
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
        <ambientLight intensity={0.1} />
        <pointLight position={[100, 10, -50]} intensity={20} />
        <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} />
        <Suspense fallback={null}>
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
        <p>Note: For best results, download earth textures from links in comments and place them in the public folder</p>
      </div>
    </div>
  );
}
