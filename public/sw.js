self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Don't cache API routes or authenticated HTML
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Pass through to network, no caching
  event.respondWith(fetch(event.request));
});
