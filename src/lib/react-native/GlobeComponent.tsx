
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { GeoLocation } from '../geospatial-core/types';
import { LoadingIndicator, INJECT_SCRIPT, handleWebViewMessage } from './utils/webview-utils';

interface GlobeComponentProps {
  selectedLocation?: GeoLocation;
  onLocationSelect?: (location: GeoLocation) => void;
  onMapReady?: () => void;
  onError?: (error: Error) => void;
  baseUrl?: string;
}

export const GlobeComponent: React.FC<GlobeComponentProps> = ({
  selectedLocation,
  onLocationSelect,
  onMapReady,
  onError,
  baseUrl = 'https://geo.example.com/globe'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Create HTML content for WebView
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        html, body { 
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: #000;
        }
        #globe-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
      </style>
    </head>
    <body>
      <div id="globe-container"></div>
      <script>
        // Basic initialization, would be replaced with actual implementation
        window.onload = function() {
          // Let React Native know the globe is ready
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_READY'
          }));
          
          // Example of handling selected location updates
          window.updateLocation = function(location) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'LOCATION_SELECTED',
                location: location
              }));
            }
          };
        };
      </script>
    </body>
    </html>
  `;
  
  // Handle WebView navigation state changes
  const handleNavigationStateChange = (navState: any) => {
    if (navState.loading === false && isLoading) {
      setIsLoading(false);
    }
  };
  
  // Update selected location
  React.useEffect(() => {
    if (selectedLocation) {
      // Send location to WebView
    }
  }, [selectedLocation]);
  
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ 
          html: htmlContent, 
          headers: { 'Content-Type': 'text/html; charset=utf-8' } 
        }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={INJECT_SCRIPT}
        onMessage={(event) => handleWebViewMessage(event, onLocationSelect, onMapReady)}
        onError={(event) => {
          if (onError) onError(new Error(`WebView error: ${event.nativeEvent.description}`));
        }}
      />
      {isLoading && <LoadingIndicator />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  }
});
