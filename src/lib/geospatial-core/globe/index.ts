
import * as THREE from 'three';
import { GlobeOptions, RendererContext, GeoLocation, GlobeEventHandlers } from '../types';
import { createDefaultGlobeOptions } from './options';
import { latLongToVector3 } from '../utils';

/**
 * Core Globe implementation using Three.js
 * This is framework-agnostic and can be used across different UI libraries
 */
export class ThreeGlobeCore {
  // Three.js instances
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private globe: THREE.Group | null = null;
  private controls: any = null; // OrbitControls
  private animationFrameId: number | null = null;
  
  // State
  private isInitialized = false;
  private isFlying = false;
  private currentLocation: GeoLocation | null = null;
  private options: GlobeOptions;
  private context: RendererContext | null = null;
  private eventHandlers: GlobeEventHandlers = {};
  
  constructor(options?: Partial<GlobeOptions>) {
    this.options = { ...createDefaultGlobeOptions(), ...options };
  }
  
  /**
   * Initialize the globe in the provided rendering context
   */
  public init(context: RendererContext, eventHandlers?: GlobeEventHandlers): void {
    if (this.isInitialized) {
      console.warn('ThreeGlobeCore is already initialized');
      return;
    }
    
    this.context = context;
    if (eventHandlers) {
      this.eventHandlers = eventHandlers;
    }
    
    try {
      this.initThreeJs();
      this.setupScene();
      this.startAnimation();
      this.isInitialized = true;
      
      if (this.eventHandlers.onReady) {
        this.eventHandlers.onReady(this);
      }
      
      // Add resize handler if the context provides one
      if (context.onResize) {
        context.onResize(() => this.handleResize());
      }
      
      // Add cleanup handler if the context provides one
      if (context.onCleanup) {
        context.onCleanup(() => this.dispose());
      }
    } catch (error) {
      console.error('Failed to initialize ThreeGlobeCore:', error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(error as Error);
      }
    }
  }
  
  /**
   * Clean up all Three.js resources
   */
  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Dispose Three.js objects
    if (this.globe) {
      this.scene?.remove(this.globe);
      this.disposeObject(this.globe);
      this.globe = null;
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.isInitialized = false;
    this.currentLocation = null;
  }
  
  /**
   * Fly to a specific location on the globe
   */
  public flyToLocation(longitude: number, latitude: number, callback?: () => void): void {
    if (!this.isInitialized || !this.globe || !this.camera || !this.controls) {
      console.warn('Cannot fly - globe not initialized');
      return;
    }
    
    this.isFlying = true;
    
    // Implementation of smooth camera transition
    // Here we would implement the actual flying animation
    console.log(`Flying to: ${longitude}, ${latitude}`);
    
    // This is a simplified version - in a real implementation we would animate
    // the camera position smoothly
    const EARTH_RADIUS = this.options.earthRadius || 5;
    const position = latLongToVector3(latitude, longitude, EARTH_RADIUS * 2);
    
    // Simple timeout to simulate animation
    setTimeout(() => {
      if (this.camera) {
        this.camera.position.set(position[0], position[1], position[2]);
        this.camera.lookAt(0, 0, 0);
      }
      
      this.isFlying = false;
      
      if (callback) {
        callback();
      }
      
      if (this.eventHandlers.onFlyComplete) {
        this.eventHandlers.onFlyComplete();
      }
    }, 1500);
  }
  
  /**
   * Set current location
   */
  public setLocation(location: GeoLocation): void {
    this.currentLocation = location;
    this.flyToLocation(location.x, location.y);
  }
  
  /**
   * Get current location
   */
  public getLocation(): GeoLocation | null {
    return this.currentLocation;
  }
  
  /**
   * Initialize Three.js renderer, scene and camera
   */
  private initThreeJs(): void {
    const { width, height } = this.context!.getDimensions();
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor || '#000011');
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = 20;
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    
    // Get the DOM element from the context and append the renderer
    const element = this.context!.getElement();
    
    // This is a simplified approach - in reality we would handle this differently
    // depending on the platform (Web vs React Native)
    try {
      if (element && typeof element.appendChild === 'function') {
        element.appendChild(this.renderer.domElement);
      } else {
        console.warn('Context element does not support appendChild - renderer may not be visible');
      }
    } catch (error) {
      console.error('Failed to append renderer to DOM:', error);
    }
  }
  
  /**
   * Set up the scene with globe and lighting
   */
  private setupScene(): void {
    if (!this.scene) return;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 0.5, 1);
    this.scene.add(directionalLight);
    
    // Create globe - simplified version
    const earthGeometry = new THREE.SphereGeometry(
      this.options.earthRadius || 5,
      64,
      64
    );
    
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2233ff,
      shininess: 5,
      specular: new THREE.Color(0x111111)
    });
    
    // In a full implementation, we would load textures here
    
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    this.globe = new THREE.Group();
    this.globe.add(earthMesh);
    this.scene.add(this.globe);
    
    // Add stars
    this.addStarfield();
  }
  
  /**
   * Add starfield background
   */
  private addStarfield(): void {
    if (!this.scene) return;
    
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.05,
      transparent: true
    });
    
    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(starField);
  }
  
  /**
   * Start animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      if (this.globe && !this.isFlying && this.options.autoRotate) {
        this.globe.rotation.y += (this.options.rotationSpeed || 0.001);
      }
      
      if (this.controls) {
        this.controls.update();
      }
      
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    
    animate();
  }
  
  /**
   * Handle window resize
   */
  private handleResize(): void {
    if (!this.camera || !this.renderer || !this.context) return;
    
    const { width, height } = this.context.getDimensions();
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  /**
   * Dispose Three.js object recursively
   */
  private disposeObject(obj: THREE.Object3D): void {
    if (!obj) return;
    
    if (obj.children) {
      obj.children.forEach(child => this.disposeObject(child));
    }
    
    if ((obj as any).geometry) {
      (obj as any).geometry.dispose();
    }
    
    if ((obj as any).material) {
      if (Array.isArray((obj as any).material)) {
        (obj as any).material.forEach((material: THREE.Material) => material.dispose());
      } else {
        (obj as any).material.dispose();
      }
    }
  }
}

export { createDefaultGlobeOptions } from './options';
