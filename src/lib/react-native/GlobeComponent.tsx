
import React, { useRef, useEffect, useState } from 'react';
// Use platform-specific imports
import { isWeb } from '../../utils/threejs-viewer/platform-check';

// Web polyfills for React Native components
const WebPolyfills = {
  View: ({ style, children }: any) => <div style={style}>{children}</div>,
  Text: ({ style, children }: any) => <span style={style}>{children}</span>,
  ActivityIndicator: ({ size, color }: any) => (
    <div style={{ 
      width: size === 'large' ? '36px' : '24px',
      height: size === 'large' ? '36px' : '24px',
      border: `3px solid ${color || '#000'}`,
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  ),
  StyleSheet: {
    create: (styles: any) => styles
  },
  Dimensions: {
    get: (dimension: string) => ({
      width: typeof window !== 'undefined' ? window.innerWidth : 300,
      height: typeof window !== 'undefined' ? window.innerHeight : 500
    })
  }
};

// Import conditionally based on platform
let View: any, Text: any, ActivityIndicator: any, StyleSheet: any, WebView: any, Dimensions: any;

// This code will only run during component rendering, not during build/import time
const initComponents = () => {
  if (isWeb()) {
    // Use polyfills in web environment
    View = WebPolyfills.View;
    Text = WebPolyfills.Text;
    ActivityIndicator = WebPolyfills.ActivityIndicator;
    StyleSheet = WebPolyfills.StyleSheet;
    Dimensions = WebPolyfills.Dimensions;
    // Mock WebView for web environment
    WebView = ({ source, style, onMessage, renderLoading }: any) => (
      <div style={style}>
        <iframe 
          src={source.uri || 'about:blank'} 
          srcDoc={source.html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Globe WebView"
        />
        {renderLoading && renderLoading()}
      </div>
    );
  } else {
    // Only import React Native components when in React Native environment
    try {
      const RN = require('react-native');
      View = RN.View;
      Text = RN.Text;
      ActivityIndicator = RN.ActivityIndicator;
      StyleSheet = RN.StyleSheet;
      Dimensions = RN.Dimensions;
      WebView = require('react-native-webview').default;
    } catch (e) {
      console.error('Failed to load React Native components:', e);
    }
  }
};

// Call init function before component definition
initComponents();

interface GlobeComponentProps {
  options?: any;
  selectedLocation?: any;
  onReady?: (api: any) => void;
  onFlyComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * React Native component wrapper for ThreeGlobeCore using WebView
 * This component is designed to work in both React Native and web environments
 */
export const GlobeComponent: React.FC<GlobeComponentProps> = ({
  options,
  selectedLocation,
  onReady,
  onFlyComplete,
  onError
}) => {
  // Initialize component UI elements if not done already
  if (!View) initComponents();
  
  const webViewRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle messages from the WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent?.data || event.data);
      switch (data.type) {
        case 'ready':
          setIsReady(true);
          if (onReady) onReady(data.api);
          break;
        case 'flyComplete':
          if (onFlyComplete) onFlyComplete();
          break;
        case 'error':
          setError(data.message);
          if (onError) onError(new Error(data.message));
          break;
      }
    } catch (e) {
      console.error('Failed to parse WebView message:', e);
      if (onError) onError(e as Error);
    }
  };

  // Send updated location to WebView when it changes
  useEffect(() => {
    if (webViewRef.current && isReady && selectedLocation) {
      if (isWeb()) {
        // Web implementation
        const iframe = webViewRef.current.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({
            type: 'setLocation',
            location: selectedLocation
          }), '*');
        }
      } else {
        // React Native implementation
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setLocation',
          location: selectedLocation
        }));
      }
    }
  }, [selectedLocation, isReady]);
  
  // HTML content for WebView that creates a Three.js globe
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body { margin: 0; overflow: hidden; width: 100vw; height: 100vh; background-color: black; }
          #globe-container { width: 100%; height: 100%; position: relative; }
          .loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center; }
        </style>
        <script src="https://threejs.org/build/three.min.js"></script>
        <script src="https://threejs.org/examples/js/controls/OrbitControls.js"></script>
      </head>
      <body>
        <div id="globe-container"></div>
        <script>
          // Globe implementation using Three.js
          const container = document.getElementById('globe-container');
          let scene, camera, renderer, globe, controls;
          let isReady = false;
          let pendingLocation = null;
          
          function initGlobe() {
            // Setup scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000011);
            
            // Setup camera
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 20;
            
            // Setup renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            container.appendChild(renderer.domElement);
            
            // Setup lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(1, 0.5, 1);
            scene.add(directionalLight);
            
            // Create globe
            const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
            const earthMaterial = new THREE.MeshPhongMaterial({
              color: 0x2233ff,
              shininess: 5,
              specular: new THREE.Color(0x111111)
            });
            
            const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
            globe = new THREE.Group();
            globe.add(earthMesh);
            scene.add(globe);
            
            // Add stars
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
            scene.add(starField);
            
            // Setup controls
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = true;
            
            // Handle resizing
            window.addEventListener('resize', () => {
              camera.aspect = window.innerWidth / window.innerHeight;
              camera.updateProjectionMatrix();
              renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
            // Animation loop
            function animate() {
              requestAnimationFrame(animate);
              globe.rotation.y += 0.001;
              controls.update();
              renderer.render(scene, camera);
            }
            
            animate();
            isReady = true;
            
            // Notify React Native that the globe is ready
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'ready', 
              api: { version: '1.0.0' } 
            }));
            
            // If there's a pending location, set it now
            if (pendingLocation) {
              flyToLocation(pendingLocation);
              pendingLocation = null;
            }
          }
          
          function flyToLocation(location) {
            if (!isReady) {
              pendingLocation = location;
              return;
            }
            
            // Convert lat/long to 3D position
            const lat = location.y;
            const lng = location.x;
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lng + 180) * (Math.PI / 180);
            const radius = 15; // Camera distance
            
            const x = -radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.sin(theta);
            
            // Simple animation for camera position
            const startPos = new THREE.Vector3().copy(camera.position);
            const endPos = new THREE.Vector3(x, y, z);
            const duration = 1000; // ms
            const startTime = Date.now();
            
            function animateCamera() {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Ease function
              const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;
                
              camera.position.lerpVectors(startPos, endPos, easeProgress);
              camera.lookAt(0, 0, 0);
              
              if (progress < 1) {
                requestAnimationFrame(animateCamera);
              } else {
                // Notify when flight is complete
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'flyComplete' }));
              }
            }
            
            animateCamera();
          }
          
          // Handle messages from React Native
          window.addEventListener('message', function(event) {
            try {
              const message = JSON.parse(event.data);
              if (message.type === 'setLocation' && message.location) {
                flyToLocation(message.location);
              }
            } catch (e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'error', 
                message: 'Failed to parse message: ' + e.message 
              }));
            }
          });
          
          // Initialize globe
          try {
            initGlobe();
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to initialize globe: ' + e.message 
            }));
          }
        </script>
      </body>
    </html>
  `;

  const styles = {
    container: {
      flex: 1,
      backgroundColor: 'black',
    },
    webView: {
      flex: 1,
    },
    loadingContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'black',
    },
    loadingText: {
      marginTop: 10,
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    errorContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 10,
      backgroundColor: 'rgba(255, 0, 0, 0.7)',
    },
    errorText: {
      color: 'white',
      textAlign: 'center',
    },
  };

  // Add event listener for web platform message passing
  useEffect(() => {
    if (isWeb()) {
      const handleWebMessage = (event: MessageEvent) => {
        handleMessage({ data: event.data });
      };
      
      window.addEventListener('message', handleWebMessage);
      return () => {
        window.removeEventListener('message', handleWebMessage);
      };
    }
  }, []);

  // Conditionally render based on platform
  if (isWeb()) {
    // Web implementation
    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webView}
          onMessage={handleMessage}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading Globe</Text>
            </View>
          )}
        />
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  } else {
    // React Native implementation - this part will only run in React Native
    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webView}
          onMessage={handleMessage}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading Globe</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError(`WebView error: ${nativeEvent.description}`);
            if (onError) onError(new Error(nativeEvent.description));
          }}
        />
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  }
};
