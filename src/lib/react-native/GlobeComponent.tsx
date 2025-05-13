
/**
 * This is a simplified implementation for React Native
 * In a real app, you would use react-native-webgl or Expo's GL module
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type { GeoLocation, GlobeOptions } from '../geospatial-core/types';

// HTML template for WebView that includes Three.js and our globe implementation
const getHtmlTemplate = (options: Partial<GlobeOptions> = {}) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { margin: 0; overflow: hidden; background-color: ${options.backgroundColor || '#000011'}; }
      canvas { width: 100%; height: 100%; display: block; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  </head>
  <body>
    <div id="container" style="width: 100%; height: 100%;"></div>
    <script>
      // Simplified Three.js globe implementation
      const init = () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 15;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('container').appendChild(renderer.domElement);
        
        // Create earth
        const radius = ${options.earthRadius || 5};
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        const material = new THREE.MeshPhongMaterial({ 
          color: 0x2233ff,
          shininess: 5
        });
        const globe = new THREE.Mesh(geometry, material);
        scene.add(globe);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 0.5, 1);
        scene.add(light);
        
        // Handle messages from React Native
        window.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'flyTo') {
            // Here we would implement the flying animation
            // This is simplified
            setTimeout(() => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'flyComplete'
              }));
            }, 1500);
          }
        });
        
        // Animation loop
        function animate() {
          requestAnimationFrame(animate);
          globe.rotation.y += 0.005;
          renderer.render(scene, camera);
        }
        animate();
        
        // Notify React Native that we're ready
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ready'
        }));
      };
      
      // Initialize once everything is loaded
      window.onload = init;
    </script>
  </body>
  </html>
`;

interface GlobeComponentProps {
  options?: Partial<GlobeOptions>;
  selectedLocation?: GeoLocation;
  onReady?: (api: any) => void;
  onFlyComplete?: () => void;
  onError?: (error: Error) => void;
}

export const GlobeComponent = ({
  options = {},
  selectedLocation,
  onReady,
  onFlyComplete,
  onError
}: GlobeComponentProps) => {
  const webViewRef = React.useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'ready') {
        setIsReady(true);
        if (onReady) onReady({});
      }
      
      if (data.type === 'flyComplete') {
        if (onFlyComplete) onFlyComplete();
      }
    } catch (error) {
      console.error('Error processing WebView message:', error);
      if (onError) onError(error as Error);
    }
  };
  
  // Send location to WebView when it changes
  React.useEffect(() => {
    if (webViewRef.current && isReady && selectedLocation) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'flyTo',
        longitude: selectedLocation.x,
        latitude: selectedLocation.y
      }));
    }
  }, [selectedLocation, isReady]);
  
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: getHtmlTemplate(options) }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        originWhitelist={['*']}
      />
      {!isReady && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading Globe</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
