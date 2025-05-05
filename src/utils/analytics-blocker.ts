
/**
 * Utility to block unwanted analytics and tracking requests
 */

export function setupAnalyticsBlocker(): void {
  // Block specific analytics endpoints with more comprehensive patterns
  const BLOCKED_DOMAINS = [
    'facebook.com/tr',
    'lovable.dev/ingest',
    'lovable.dev/i/',
    'fb.com',
    'facebook.net',
    'analytics',
    'tracking',
    'stat',
    'metrics',
    'posthog',
    'segment'
  ];
  
  // Create a lookup object for faster checking
  const blockedDomainsLookup = BLOCKED_DOMAINS.reduce((acc, domain) => {
    acc[domain] = true;
    return acc;
  }, {} as Record<string, boolean>);

  // Helper function to check if URL should be blocked
  const shouldBlockUrl = (url: string): boolean => {
    if (!url) return false;
    return BLOCKED_DOMAINS.some(domain => url.includes(domain));
  };
  
  // More aggressive fetch blocking with debouncing
  const originalFetch = window.fetch;
  const pendingFetchURLs = new Set<string>();
  
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    if (shouldBlockUrl(url)) {
      console.log('Blocked analytics request:', url);
      
      // Prevent repeated requests to the same URL within a short time
      if (pendingFetchURLs.has(url)) {
        console.log('Duplicate request blocked:', url);
        return Promise.resolve(new Response('{"success":true,"status":"blocked"}', {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Track this URL briefly to prevent repetitive calls
      pendingFetchURLs.add(url);
      setTimeout(() => pendingFetchURLs.delete(url), 5000);
      
      // Return a successful response to prevent retries
      return Promise.resolve(new Response(JSON.stringify({success: true, status: "blocked"}), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    return originalFetch(input, init);
  };
  
  // Block XMLHttpRequest with retry prevention
  const originalOpen = XMLHttpRequest.prototype.open;
  const pendingXHRURLs = new Set<string>();
  
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]): void {
    const urlString = url.toString();
    if (shouldBlockUrl(urlString)) {
      console.log('Blocked XHR analytics request:', urlString);
      
      // Prevent repeated requests
      if (pendingXHRURLs.has(urlString)) {
        console.log('Duplicate XHR blocked:', urlString);
      }
      
      pendingXHRURLs.add(urlString);
      setTimeout(() => pendingXHRURLs.delete(urlString), 5000);
      
      // Mock the XHR methods to prevent errors
      this.send = function() {};
      this.setRequestHeader = function() {};
      this.abort = function() {};
      this.onload = function() {};
      
      // Set fake readyState and status
      Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
      Object.defineProperty(this, 'status', { value: 200, configurable: true });
      Object.defineProperty(this, 'responseText', { 
        value: '{"success":true,"status":"blocked"}',
        configurable: true
      });
      
      // Simulate successful response
      setTimeout(() => {
        if (typeof this.onreadystatechange === 'function') {
          this.onreadystatechange();
        }
        if (typeof this.onload === 'function') {
          this.onload();
        }
      }, 10);
      return;
    }
    
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  // Block navigator.sendBeacon with retry prevention
  const originalSendBeacon = navigator.sendBeacon;
  const pendingBeaconURLs = new Set<string>();
  
  navigator.sendBeacon = function(url: string | URL, data?: BodyInit): boolean {
    const urlString = url.toString();
    if (shouldBlockUrl(urlString)) {
      console.log('Blocked sendBeacon analytics request:', urlString);
      
      // Prevent repeated requests
      if (pendingBeaconURLs.has(urlString)) {
        console.log('Duplicate beacon blocked:', urlString);
      }
      
      pendingBeaconURLs.add(urlString);
      setTimeout(() => pendingBeaconURLs.delete(urlString), 5000);
      
      return true; // Pretend it was sent successfully
    }
    return originalSendBeacon.call(navigator, url, data);
  };
  
  // Enhanced script blocking
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'SCRIPT') {
            const scriptNode = node as HTMLScriptElement;
            if (scriptNode.src && shouldBlockUrl(scriptNode.src)) {
              console.log('Blocked analytics script:', scriptNode.src);
              scriptNode.remove();
            } else if (scriptNode.textContent && 
                      BLOCKED_DOMAINS.some(domain => scriptNode.textContent?.includes(domain) ?? false)) {
              console.log('Blocked inline analytics script');
              scriptNode.textContent = '/* Analytics script blocked */';
            }
          }
        });
      }
    });
  });
  
  // Start observing document for script additions
  observer.observe(document, { childList: true, subtree: true });
  
  // Block window.onerror for analytics scripts
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (source && shouldBlockUrl(source.toString())) {
      console.log('Blocked error from analytics source:', source);
      return true;  // Prevents the default handler
    }
    return originalOnError ? originalOnError.apply(this, arguments as any) : false;
  };
  
  // Block all image pixels commonly used for tracking
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName: string, options?: ElementCreationOptions): HTMLElement {
    const element = originalCreateElement.call(document, tagName, options);
    
    if (tagName.toLowerCase() === 'img') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name: string, value: string) {
        if (name === 'src' && shouldBlockUrl(value)) {
          console.log('Blocked tracking pixel:', value);
          return originalSetAttribute.call(this, 'src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };
  
  console.log('Enhanced anti-flickering analytics blocker initialized');
}
