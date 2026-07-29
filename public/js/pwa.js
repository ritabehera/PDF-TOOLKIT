/**
 * PWA Service Worker Register Script (Network-First & Auto-Update)
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        reg.update();
        console.log('ServiceWorker updated with scope:', reg.scope);
      })
      .catch(err => console.warn('ServiceWorker registration failed:', err));
  });
}
