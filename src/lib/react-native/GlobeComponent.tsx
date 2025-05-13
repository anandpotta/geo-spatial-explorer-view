
import React, { useRef } from 'react';
import { isWeb } from '@/utils/threejs-viewer/platform-check';
import { useWebViewMessaging, useWebMessageListener, CommonWebView } from './utils/webview-utils';
import { Location } from '@/utils/geo-utils';

// Initialize components
import { initComponents } from './utils/webview-utils';
initComponents();

interface GlobeComponentProps {
  selectedLocation?: Location;
  onReady?: (api: any) => void;
  onFlyComplete?: () => void;
  onError?: (error: Error) => void;
}

export const GlobeComponent: React.FC<GlobeComponentProps> = ({
  selectedLocation,
  onReady,
  onFlyComplete,
  onError
}) => {
  // Use shared messaging hook
  const {
    webViewRef,
    isReady,
    handleMessage
  } = useWebViewMessaging(onReady, undefined, onFlyComplete, onError);

  // Add web message listener for web platform
  useWebMessageListener(handleMessage);

  // Generate HTML content for WebView
  const generateHtmlContent = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>3D Globe View</title>
          <style>
            html, body { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; background: black; }
            #globe-container { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="globe-container"></div>
          <script>
            // Simple initialization to show something is loading
            document.addEventListener('DOMContentLoaded', function() {
              // Send ready event
              window.parent.postMessage(JSON.stringify({
                type: 'ready',
                api: { version: '1.0', capabilities: ['3d', 'globe'] }
              }), '*');
              
              // Setup message handler
              window.addEventListener('message', function(event) {
                try {
                  const message = JSON.parse(event.data);
                  if (message.type === 'fly' && message.location) {
                    console.log('Flying to location:', message.location);
                    
                    // Simulate flight completion after a delay
                    setTimeout(function() {
                      window.parent.postMessage(JSON.stringify({
                        type: 'flyComplete'
                      }), '*');
                    }, 2000);
                  }
                } catch (e) {
                  console.error('Error parsing message:', e);
                }
              });
              
              // Initial setup is complete
              console.log('Globe view initialized');
            });
          </script>
        </body>
      </html>
    `;
  };

  // Effect to send location updates to WebView
  React.useEffect(() => {
    if (isReady && selectedLocation && webViewRef.current) {
      const message = {
        type: 'fly',
        location: selectedLocation
      };
      
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
    }
  }, [isReady, selectedLocation]);

  return (
    <CommonWebView
      webViewRef={webViewRef}
      htmlContent={generateHtmlContent()}
      onMessage={handleMessage}
      backgroundColor="black"
      loadingText="Loading 3D Globe..."
    />
  );
};

export default GlobeComponent;
