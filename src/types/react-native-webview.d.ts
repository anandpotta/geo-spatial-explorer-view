
declare module 'react-native-webview' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface WebViewProps extends ViewProps {
    /**
     * Source to load in the WebView.
     */
    source?: {
      uri?: string;
      html?: string;
      headers?: { [key: string]: string };
    };

    /**
     * Function that is invoked when the WebView calls `window.ReactNativeWebView.postMessage`.
     */
    onMessage?: (event: { nativeEvent: { data: string } }) => void;

    /**
     * Function that is invoked when the WebView load fails.
     */
    onError?: (event: { nativeEvent: { code: string; description: string; url: string } }) => void;

    /**
     * Function that is invoked when the WebView finishes loading.
     */
    onLoadEnd?: (event: { nativeEvent: any }) => void;

    /**
     * Set this to provide JavaScript that will be injected into the web page when the view loads.
     */
    injectedJavaScript?: string;

    /**
     * Set this to true to allow the use of JavaScript in the WebView.
     */
    javaScriptEnabled?: boolean;

    /**
     * Set this to true to allow DOM Storage API.
     */
    domStorageEnabled?: boolean;

    /**
     * List of origin strings to allow being navigated to.
     */
    originWhitelist?: string[];

    /**
     * Set this to true if the WebView should start in a loading state.
     */
    startInLoadingState?: boolean;

    /**
     * Function that returns a view to show when the WebView is in a loading state.
     */
    renderLoading?: () => React.ReactNode;
  }

  export default class WebView extends Component<WebViewProps> {
    /**
     * Posts a message to the WebView.
     */
    postMessage(data: string): void;

    /**
     * Reloads the current page.
     */
    reload(): void;

    /**
     * Stop loading the current page.
     */
    stopLoading(): void;
  }
}
