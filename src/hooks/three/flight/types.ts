
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export interface FlightControlRefs {
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null> | {
    current: THREE.PerspectiveCamera | null;
  };
  controlsRef: React.MutableRefObject<OrbitControls | null>;
}

export interface FlightAnimation {
  startPosition: THREE.Vector3;
  outerPosition: THREE.Vector3;
  finalPosition: THREE.Vector3;
  currentTarget: THREE.Vector3;
  finalTarget: THREE.Vector3;
  duration: number;
  wasAutoRotating: boolean;
  wasDamping: boolean;
}
