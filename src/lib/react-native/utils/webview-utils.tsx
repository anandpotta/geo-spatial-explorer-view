
import React, { useRef, useState, useEffect } from 'react';
import { isWeb } from '@/utils/threejs-viewer/platform-check';
import { Location } from '@/utils/geo-utils';

// Placeholder for React Native WebView component
// In a real React Native project, this would be imported from 'react-native-webview'
const RNWebView = (props: any) => <div {...props} />;

// Function to initialize components for different platforms
export function initComponents() {
  // This would contain platform-specific initialization in a real cross-platform app
  console.log('Initializing components for the current platform');
}

// Shared messaging hook for WebView communication
export function useWebViewMessaging(
  onReady?: (api: any) => void,
  onLocationSelect?: (location: Location) => void,
  onFlyComplete?: () => void,
  onError?: (error: Error) => void
) {
  const webViewRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  const handleMessage = (event: MessageEvent | { nativeEvent: { data: string } }) => {
    try {
      // Handle both web and React Native message formats
      const messageData = isWeb() 
        ? event as MessageEvent
        : event as { nativeEvent: { data: string } };
      
      const data = isWeb()
        ? (messageData as MessageEvent).data
        : (messageData as { nativeEvent: { data: string } }).nativeEvent.data;
      
      const message = typeof data === 'string' ? JSON.parse(data) : data;

      console.log('Received message:', message.type);

      switch (message.type) {
        case 'ready':
          setIsReady(true);
          if (onReady) onReady(message.api || {});
          break;
        case 'locationSelect':
          if (onLocationSelect && message.location) {
            onLocationSelect(message.location);
          }
          break;
        case 'flyComplete':
          if (onFlyComplete) onFlyComplete();
          break;
        case 'error':
          if (onError && message.error) {
            onError(new Error(message.error));
          }
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
      if (onError) onError(error as Error);
    }
  };

  return {
    webViewRef,
    isReady,
    handleMessage
  };
}

// Hook for adding web message listener (for web platform)
export function useWebMessageListener(callback: (event: MessageEvent) => void) {
  useEffect(() => {
    if (isWeb()) {
      window.addEventListener('message', callback);
      return () => window.removeEventListener('message', callback);
    }
    return undefined;
  }, [callback]);
}

// Common WebView component for both platforms
export const CommonWebView: React.FC<{
  webViewRef: React.RefObject<any>;
  htmlContent: string;
  onMessage: any;
  backgroundColor?: string;
  loadingText?: string;
}> = ({ webViewRef, htmlContent, onMessage, backgroundColor = 'white', loadingText = 'Loading...' }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading completion
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isWeb()) {
    // Web implementation using iframe
    return (
      <div className="relative w-full h-full" style={{ backgroundColor }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-opacity-75 bg-black z-10">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p>{loadingText}</p>
            </div>
          </div>
        )}
        <div
          ref={webViewRef}
          className="w-full h-full"
          dangerouslySetInnerHTML={{
            __html: `<iframe
              src="data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}"
              style="border: none; width: 100%; height: 100%;"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>`,
          }}
        />
      </div>
    );
  } else {
    // React Native implementation
    return (
      <RNWebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onMessage={onMessage}
        style={{ backgroundColor }}
      />
    );
  }
};
