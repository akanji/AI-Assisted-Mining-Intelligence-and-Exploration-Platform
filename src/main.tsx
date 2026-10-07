import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';
import { EquipmentNotificationProvider } from './context/EquipmentNotificationContext';
import { SubscriptionAuthProvider } from './context/SubscriptionAuthContext';
import { FirebaseProvider } from './context/FirebaseContext';

// Register Service Worker and initialize IndexedDB offline data
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <SubscriptionAuthProvider>
        <EquipmentNotificationProvider>
          <App />
        </EquipmentNotificationProvider>
      </SubscriptionAuthProvider>
    </FirebaseProvider>
  </StrictMode>,
);
