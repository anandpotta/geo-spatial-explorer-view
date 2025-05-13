
import React, { useRef, useEffect, useState } from 'react';
import { isWeb } from '@/utils/threejs-viewer/platform-check';

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

// Platform-specific component references
let View: any, Text: any, ActivityIndicator: any, StyleSheet: any, WebView: any, Dimensions: any;

/**
 * Initialize platform-specific components
 */
export const initComponents = () => {
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
          title="WebView Content"
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

// Common styles for WebView components
export const createCommonStyles = () => ({
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
});

// Send message to WebView in a platform-agnostic way
export const sendMessageToWebView = (
  webViewRef: React.RefObject<any>,
  message: any
) => {
  if (!webViewRef.current) return;
  
  if (isWeb()) {
    // Web implementation
    const iframe = webViewRef.current.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify(message), '*');
    }
  } else {
    // React Native implementation
    webViewRef.current.postMessage(JSON.stringify(message));
  }
};

// Common WebView component with error handling
export const CommonWebView = ({ 
  webViewRef, 
  htmlContent, 
  onMessage, 
  backgroundColor = 'white',
  loadingText = 'Loading'
}: {
  webViewRef: React.RefObject<any>;
  htmlContent: string;
  onMessage: (event: any) => void;
  backgroundColor?: string;
  loadingText?: string;
}) => {
  const [error, setError] = useState<string | null>(null);
  
  // Make sure components are initialized
  if (!View) initComponents();
  
  const styles = createCommonStyles();
  
  // Custom styles based on parameters
  const customStyles = {
    ...styles,
    container: {
      ...styles.container,
      backgroundColor
    },
    loadingContainer: {
      ...styles.loadingContainer,
      backgroundColor
    },
    loadingText: {
      ...styles.loadingText,
      color: backgroundColor === 'white' ? 'black' : 'white'
    }
  };
  
  if (isWeb()) {
    // Web implementation
    return (
      <View style={customStyles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={customStyles.webView}
          onMessage={onMessage}
          renderLoading={() => (
            <View style={customStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={customStyles.loadingText}>{loadingText}</Text>
            </View>
          )}
        />
        {error && (
          <View style={customStyles.errorContainer}>
            <Text style={customStyles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  } else {
    // React Native implementation
    return (
      <View style={customStyles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={customStyles.webView}
          onMessage={onMessage}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={customStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={customStyles.loadingText}>{loadingText}</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            const errorMessage = `WebView error: ${nativeEvent.description}`;
            setError(errorMessage);
          }}
        />
        {error && (
          <View style={customStyles.errorContainer}>
            <Text style={customStyles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  }
};

// Hook for handling WebView message processing
export function useWebViewMessaging(
  onReady?: (api: any) => void,
  onLocationSelect?: (location: any) => void,
  onFlyComplete?: () => void,
  onError?: (error: Error) => void
) {
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

  return {
    webViewRef,
    isReady,
    error,
    setError,
    handleMessage
  };
}

// Add web message event listener for web platform
export function useWebMessageListener(handleMessage: (event: any) => void) {
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
  }, [handleMessage]);
}
