
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
  }
};

// Import conditionally based on platform
let View: any, Text: any, ActivityIndicator: any, StyleSheet: any, WebView: any;

// This code will only run during component rendering, not during build/import time
const initComponents = () => {
  if (isWeb()) {
    // Use polyfills in web environment
    View = WebPolyfills.View;
    Text = WebPolyfills.Text;
    ActivityIndicator = WebPolyfills.ActivityIndicator;
    StyleSheet = WebPolyfills.StyleSheet;
    // Mock WebView for web environment
    WebView = ({ source, style, onMessage, renderLoading }: any) => (
      <div style={style}>
        <iframe 
          src={source.uri || 'about:blank'} 
          srcDoc={source.html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Map WebView"
        />
        {renderLoading && renderLoading()}
      </div>
    );
  } else {
    // Only import React Native components when in React Native environment
    // These imports will be skipped in web environments
    try {
      const RN = require('react-native');
      View = RN.View;
      Text = RN.Text;
      ActivityIndicator = RN.ActivityIndicator;
      StyleSheet = RN.StyleSheet;
      WebView = require('react-native-webview').default;
    } catch (e) {
      console.error('Failed to load React Native components:', e);
    }
  }
};

// Call init function before component definition
initComponents();

interface MapComponentProps {
  options?: any;
  selectedLocation?: any;
  onReady?: (api: any) => void;
  onLocationSelect?: (location: any) => void;
  onError?: (error: Error) => void;
}

/**
 * React Native component wrapper for MapCore
 * This component is designed to work in both React Native and web environments
 */
export const MapComponent: React.FC<MapComponentProps> = ({
  options,
  selectedLocation,
  onReady,
  onLocationSelect,
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
        case 'locationSelect':
          if (onLocationSelect && data.location) {
            onLocationSelect(data.location);
          }
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
  
  // HTML content for WebView that creates a Leaflet map
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body { margin: 0; padding: 0; width: 100vw; height: 100vh; }
          #map { width: 100%; height: 100%; }
          .loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 1000; }
        </style>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          let map;
          let isReady = false;
          let marker;
          let initialZoom = ${options?.initialZoom || 2};
          let initialCenter = ${options?.initialCenter ? 
            `[${options.initialCenter[0]}, ${options.initialCenter[1]}]` : 
            '[0, 0]'
          };
          
          function initMap() {
            map = L.map('map').setView(initialCenter, initialZoom);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: ${options?.maxZoom || 19},
              minZoom: ${options?.minZoom || 1},
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            if (${options?.showControls !== false}) {
              L.control.zoom().addTo(map);
            }
            
            // Handle map clicks
            map.on('click', function(e) {
              const location = {
                id: 'selected-' + Date.now(),
                label: 'Selected Location',
                x: e.latlng.lng,
                y: e.latlng.lat
              };
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelect',
                location: location
              }));
            });
            
            isReady = true;
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'ready', 
              api: { version: '1.0.0' } 
            }));
          }
          
          function setLocation(location) {
            if (!map) return;
            
            const latlng = [location.y, location.x];
            
            // Center map on location
            map.setView(latlng, map.getZoom());
            
            // Add or update marker
            if (marker) {
              marker.setLatLng(latlng);
            } else {
              marker = L.marker(latlng).addTo(map);
            }
            
            // Add popup with label if available
            if (location.label) {
              marker.bindPopup(location.label).openPopup();
            }
          }
          
          // Handle messages from React Native
          window.addEventListener('message', function(event) {
            try {
              const message = JSON.parse(event.data);
              if (message.type === 'setLocation' && message.location) {
                setLocation(message.location);
              }
            } catch (e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'error', 
                message: 'Failed to parse message: ' + e.message 
              }));
            }
          });
          
          // Initialize map
          try {
            initMap();
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to initialize map: ' + e.message 
            }));
          }
        </script>
      </body>
    </html>
  `;

  const styles = {
    container: {
      flex: 1,
      backgroundColor: 'white',
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
      backgroundColor: 'white',
    },
    loadingText: {
      marginTop: 10,
      color: 'black',
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
              <Text style={styles.loadingText}>Loading Map</Text>
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
              <Text style={styles.loadingText}>Loading Map</Text>
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
