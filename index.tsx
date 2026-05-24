import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AxisProvider } from './components/features/axis/AxisProvider.tsx';
import { AxisEntity } from './components/features/axis/AxisEntity.tsx';

console.log("MZ+ System: Starting initialization...");

// Global error handling for network issues
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message === 'Failed to fetch') {
    console.warn('MZ+ System: Network fetch failed. This may be due to a slow connection or Supabase project status.');
    // Prevent the error from crashing the app
    event.preventDefault();
  }
});

// Application de la personnalisation PWA (Branding)
const applyBranding = () => {
  const customName = localStorage.getItem('pwa_custom_name') || 'MZ+ Elite';
  const customIcon = localStorage.getItem('pwa_custom_icon');

  if (customName) {
    document.title = customName;
    const appleTitleId = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitleId) appleTitleId.setAttribute('content', customName);
  }

  if (customIcon) {
    // On met à jour les liens d'icônes classiques uniquement
    const updateIcon = (selector: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('href', customIcon);
    };
    updateIcon('link[rel="apple-touch-icon"]');
    updateIcon('link[rel="icon"]');
    
    // Le manifest est maintenant servi dynamiquement par le serveur (server.ts)
    // Cela garantit une installation PWA fiable avec les bonnes icônes.
    console.log('MZ+ System: Branding synced, relying on server-side manifest');
  }
};

const mountApp = () => {
  applyBranding();
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error("MZ+ System: Root element not found");
      return;
    }

    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <AxisProvider>
            <App />
            <AxisEntity />
          </AxisProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
    console.log("MZ+ System: React rendered successfully.");
  } catch (error) {
    console.error("MZ+ System: Mounting error:", error);
    throw error;
  }
};

// On s'assure que le DOM est prêt avant de monter
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}