
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Earth from './Earth';

export default function GlobeView() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.1} />
        <pointLight position={[100, 10, -50]} intensity={20} />
        <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} />
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
        <OrbitControls 
          enableZoom={true}
          minDistance={2}
          maxDistance={10}
          autoRotate={false}
        />
      </Canvas>
      <div className="absolute bottom-2 left-2 text-xs text-white opacity-70">
        <p>Note: For best results, download earth textures from links in comments and place them in the public folder</p>
      </div>
    </div>
  );
}
