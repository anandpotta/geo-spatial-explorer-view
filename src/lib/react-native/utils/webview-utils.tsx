
import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

// Loading indicator for WebView
export const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

// Inject script for communication between WebView and React Native
export const INJECT_SCRIPT = `
  window.ReactNativeWebView.postMessage = function(data) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  };
  true;
`;

// Handle WebView messages
export const handleWebViewMessage = (
  event: any, 
  onLocationSelect?: (location: any) => void,
  onMapReady?: () => void
) => {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    
    if (data.type === 'LOCATION_SELECTED' && onLocationSelect) {
      onLocationSelect(data.location);
    } else if (data.type === 'MAP_READY' && onMapReady) {
      onMapReady();
    }
  } catch (error) {
    console.error('Error processing WebView message:', error);
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  }
});

export interface WebViewMessage {
  type: string;
  payload?: any;
}
