
/**
 * Utility to block unwanted analytics and tracking requests
 */

export function setupAnalyticsBlocker(): void {
  // Block specific analytics endpoints
  const BLOCKED_DOMAINS = [
    'facebook.com/tr',
    'lovable.dev/ingest',
    'fb.com',
    'facebook.net',
    'analytics',
    'tracking'
  ];
  
  // Override fetch to block analytics
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    if (BLOCKED_DOMAINS.some(domain => url.includes(domain))) {
      console.log('Blocked analytics request:', url);
      return Promise.resolve(new Response('', {
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
      this.abort();
      return;
    }
    
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  console.log('Analytics blocker initialized');
}
