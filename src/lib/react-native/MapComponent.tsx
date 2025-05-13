
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { GeoLocation } from '../geospatial-core/types';
import { LoadingIndicator, INJECT_SCRIPT, handleWebViewMessage } from './utils/webview-utils';

interface MapComponentProps {
  selectedLocation?: GeoLocation;
  onLocationSelect?: (location: GeoLocation) => void;
  onMapReady?: () => void;
  onError?: (error: Error) => void;
  baseUrl?: string;
  mapType?: 'street' | 'satellite' | 'hybrid';
}

export const MapComponent: React.FC<MapComponentProps> = ({
  selectedLocation,
  onLocationSelect,
  onMapReady,
  onError,
  baseUrl = 'https://geo.example.com/map',
  mapType = 'street'
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
        }
        #map-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
      </style>
      <base href="${baseUrl}">
    </head>
    <body>
      <div id="map-container"></div>
      <script>
        // Basic initialization, would be replaced with actual implementation
        window.onload = function() {
          // Let React Native know the map is ready
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

          // Set map type
          window.setMapType('${mapType}');
        };
      </script>
    </body>
    </html>
  `;
  
  // Handle WebView navigation state changes
  const handleLoadEnd = (navState: any) => {
    setIsLoading(false);
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
        onLoadEnd={handleLoadEnd}
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
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  }
});
