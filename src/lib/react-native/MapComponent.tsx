
/**
 * This is a simplified implementation for React Native
 * In a real app, you would use react-native-maps
 */
import React, { useState, useRef } from 'react';
import type { GeoLocation, MapViewOptions } from '../geospatial-core/types';

// Define simple types to avoid the need for react-native package in web environment
type ReactNativeView = React.ComponentType<any>;
type ReactNativeWebView = React.ComponentType<any> & { postMessage?: (data: string) => void };

interface WebViewProps {
  source: { html: string };
  style: any;
  onMessage: (event: any) => void;
  javaScriptEnabled: boolean;
  originWhitelist: string[];
  ref: React.RefObject<ReactNativeWebView>;
}

// Mock React Native components for web environment
const View: ReactNativeView = (props) => <div {...props} />;
const Text: ReactNativeView = (props) => <span {...props} />;
const ActivityIndicator: ReactNativeView = (props) => <div {...props}>Loading...</div>;
const WebView: ReactNativeWebView = (props) => <iframe {...props} />;

// Mock StyleSheet for web environment
const StyleSheet = {
  create: (styles: any) => styles,
  absoluteFillObject: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
};

// HTML template for WebView that includes a simple map
const getHtmlTemplate = (options: Partial<MapViewOptions> = {}) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { margin: 0; overflow: hidden; }
      #map { width: 100%; height: 100%; }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      // Initialize map
      const map = L.map('map').setView([${options.initialCenter?.[0] ?? 0}, ${options.initialCenter?.[1] ?? 0}], ${options.initialZoom ?? 2});
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: ${options.maxZoom ?? 19}
      }).addTo(map);
      
      // Handle messages from React Native
      window.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'centerMap') {
            map.setView([data.latitude, data.longitude], data.zoom || map.getZoom());
          }
          
          if (data.type === 'addMarker') {
            L.marker([data.latitude, data.longitude])
              .addTo(map)
              .bindPopup(data.label || 'Marker');
          }
        } catch (e) {
          console.error('Error processing message:', e);
        }
      });
      
      // Map click handler
      map.on('click', (e) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapClick',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      });
      
      // Notify React Native that we're ready
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ready'
      }));
    </script>
  </body>
  </html>
`;

interface MapComponentProps {
  options?: Partial<MapViewOptions>;
  selectedLocation?: GeoLocation;
  onReady?: (api: any) => void;
  onLocationSelect?: (location: GeoLocation) => void;
  onError?: (error: Error) => void;
}

export const MapComponent = ({
  options = {},
  selectedLocation,
  onReady,
  onLocationSelect,
  onError
}: MapComponentProps) => {
  const webViewRef = useRef<ReactNativeWebView>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'ready') {
        setIsReady(true);
        if (onReady) onReady({});
      }
      
      if (data.type === 'mapClick' && onLocationSelect) {
        onLocationSelect({
          id: `loc-${Date.now()}`,
          label: `Location at ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`,
          x: data.longitude,
          y: data.latitude
        });
      }
    } catch (error) {
      console.error('Error processing WebView message:', error);
      if (onError) onError(error as Error);
    }
  };
  
  // Send location to WebView when it changes
  React.useEffect(() => {
    if (webViewRef.current && isReady && selectedLocation) {
      webViewRef.current.postMessage && webViewRef.current.postMessage(JSON.stringify({
        type: 'centerMap',
        latitude: selectedLocation.y,
        longitude: selectedLocation.x,
        zoom: 13
      }));
      
      webViewRef.current.postMessage && webViewRef.current.postMessage(JSON.stringify({
        type: 'addMarker',
        latitude: selectedLocation.y,
        longitude: selectedLocation.x,
        label: selectedLocation.label
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
          <Text style={styles.loadingText}>Loading Map</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  loadingText: {
    color: '#0066cc',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

