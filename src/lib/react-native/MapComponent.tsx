
import React from 'react';
import { isWeb } from '@/utils/threejs-viewer/platform-check';
import { useWebViewMessaging, useWebMessageListener, CommonWebView } from './utils/webview-utils';
import { Location } from '@/utils/geo-utils';

// Initialize components
import { initComponents } from './utils/webview-utils';
initComponents();

interface MapComponentProps {
  selectedLocation?: Location;
  onReady?: (api: any) => void;
  onLocationSelect?: (location: Location) => void;
  onError?: (error: Error) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  selectedLocation,
  onReady,
  onLocationSelect,
  onError
}) => {
  // Use shared messaging hook
  const {
    webViewRef,
    isReady,
    handleMessage
  } = useWebViewMessaging(onReady, onLocationSelect, undefined, onError);

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
          <title>2D Map View</title>
          <style>
            html, body { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; }
            #map-container { width: 100%; height: 100%; background: #f0f0f0; }
          </style>
        </head>
        <body>
          <div id="map-container"></div>
          <script>
            // Simple initialization to show something is loading
            document.addEventListener('DOMContentLoaded', function() {
              // Send ready event
              window.parent.postMessage(JSON.stringify({
                type: 'ready',
                api: { version: '1.0', capabilities: ['2d', 'map'] }
              }), '*');
              
              // Setup message handler
              window.addEventListener('message', function(event) {
                try {
                  const message = JSON.parse(event.data);
                  if (message.type === 'pan' && message.location) {
                    console.log('Panning to location:', message.location);
                  }
                } catch (e) {
                  console.error('Error parsing message:', e);
                }
              });
              
              // Set up click handler for map
              document.getElementById('map-container').addEventListener('click', function(e) {
                // Example of sending a location selection event back
                window.parent.postMessage(JSON.stringify({
                  type: 'locationSelect',
                  location: {
                    id: 'clicked-location',
                    label: 'Map Clicked Location',
                    x: -74 + Math.random() * 10,
                    y: 40 + Math.random() * 10
                  }
                }), '*');
              });
              
              // Initial setup is complete
              console.log('Map view initialized');
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
        type: 'pan',
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
      backgroundColor="white"
      loadingText="Loading Map..."
    />
  );
};

export default MapComponent;
