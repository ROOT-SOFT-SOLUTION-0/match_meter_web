self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through cross-origin requests or navigation requests without intercepting,
  // or only intercept our own origin to avoid breaking OAuth / Popups.
  if (event.request.method !== 'GET') return;
  
  // Exclude Firebase Auth and other cross-origin APIs from being intercepted entirely
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      // Basic offline fallback or just let it fail
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || 'MATCHMETER', options || {});
  }
});
