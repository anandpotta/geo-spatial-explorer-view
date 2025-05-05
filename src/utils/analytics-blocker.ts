
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
  
  // More aggressive fetch blocking
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    if (BLOCKED_DOMAINS.some(domain => url.includes(domain))) {
      console.log('Blocked analytics request:', url);
      // Return a successful response to prevent retries
      return Promise.resolve(new Response(JSON.stringify({success: true, status: "blocked"}), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    return originalFetch(input, init);
  };
  
  // Block XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]): void {
    const urlString = url.toString();
    if (BLOCKED_DOMAINS.some(domain => urlString.includes(domain))) {
      console.log('Blocked XHR analytics request:', urlString);
      // Mock the XHR methods to prevent errors
      this.send = function() {};
      this.setRequestHeader = function() {};
      this.abort = function() {};
      this.onload = function() {};
      // Set fake readyState and status
      Object.defineProperty(this, 'readyState', { value: 4 });
      Object.defineProperty(this, 'status', { value: 200 });
      Object.defineProperty(this, 'responseText', { value: '{"success":true,"status":"blocked"}' });
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
  
  // Also block navigator.sendBeacon which is often used for analytics
  const originalSendBeacon = navigator.sendBeacon;
  navigator.sendBeacon = function(url: string | URL, data?: BodyInit): boolean {
    const urlString = url.toString();
    if (BLOCKED_DOMAINS.some(domain => urlString.includes(domain))) {
      console.log('Blocked sendBeacon analytics request:', urlString);
      return true; // Pretend it was sent successfully
    }
    return originalSendBeacon.call(navigator, url, data);
  };
  
  // Intercept and block script tags that might be adding analytics
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'SCRIPT') {
            const scriptNode = node as HTMLScriptElement;
            if (scriptNode.src && BLOCKED_DOMAINS.some(domain => scriptNode.src.includes(domain))) {
              console.log('Blocked analytics script:', scriptNode.src);
              scriptNode.remove();
            }
          }
        });
      }
    });
  });
  
  // Start observing document for script additions
  observer.observe(document, { childList: true, subtree: true });
  
  // Block window.onerror and window.onunhandledrejection for analytics scripts
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (source && BLOCKED_DOMAINS.some(domain => source.toString().includes(domain))) {
      console.log('Blocked error from analytics source:', source);
      return true;  // Prevents the default handler
    }
    return originalOnError ? originalOnError.apply(this, arguments as any) : false;
  };
  
  console.log('Enhanced analytics blocker initialized');
}

