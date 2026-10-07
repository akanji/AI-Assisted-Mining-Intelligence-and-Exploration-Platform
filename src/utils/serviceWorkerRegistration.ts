import { precacheCriticalMiningData } from './offlineStorage';

export const registerServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('MineAI Service Worker registered with scope:', registration.scope);

          // Seed or update offline IndexedDB cache
          precacheCriticalMiningData().then((res) => {
            if (res.success) {
              console.log(`MineAI IndexedDB offline pre-cache active: ${res.count} critical records cached.`);
            }
          });
        })
        .catch((error) => {
          console.warn('MineAI Service Worker registration failed:', error);
        });
    });
  }
};
