
import { GlobeOptions } from '../types';

/**
 * Create default options for the globe
 */
export function createDefaultGlobeOptions(): GlobeOptions {
  return {
    earthRadius: 5,
    texturePath: '/assets/earth_texture.jpg',
    bumpMapPath: '/assets/earth_bump.jpg',
    backgroundColor: '#000011',
    autoRotate: true,
    rotationSpeed: 0.0005
  };
}
