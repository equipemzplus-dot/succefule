// Importer les scripts Firebase pour le service worker (v9 compat)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Ces valeurs DOIVENT correspondre exactement à votre projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAaHLKDOeDvHogKY22PCjA8XfzRv-HXLqw",
  authDomain: "gen-lang-client-0260821538.firebaseapp.com",
  projectId: "gen-lang-client-0260821538",
  storageBucket: "gen-lang-client-0260821538.firebasestorage.app",
  messagingSenderId: "627912091228",
  appId: "1:627912091228:web:5662acb38029ac349b6899"
};

// Initialisation
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Gestion des messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Message en arrière-plan reçu :', payload);
  
  const icon = payload.data?.icon || payload.notification?.icon || '/firebase-logo.png';
  const title = payload.notification?.title || payload.data?.title || 'Elite MZ+ Alert';
  const body = payload.notification?.body || payload.data?.body || 'Nouvelle notification reçue de l\'Elite System.';
  
  const notificationOptions = {
    body: body,
    icon: icon,
    badge: icon,
    tag: 'mz-plus-push',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: payload.data?.url || '/'
    }
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Écouteur générique pour maximiser la compatibilité
self.addEventListener('push', (event) => {
  console.log('[SW] Événement Push réseau détecté');
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[SW] Données Push reçues:', data);
      
      // Si FCM gère déjà via onBackgroundMessage, showNotification fera un renotify sur le même tag
      const icon = data.data?.icon || data.notification?.icon || '/firebase-logo.png';
      const title = data.notification?.title || data.data?.title || 'MZ+ Elite';
      const body = data.notification?.body || data.data?.body || 'Alerte Système';
      
      const promiseChain = self.registration.showNotification(title, {
        body: body,
        icon: icon,
        badge: icon,
        tag: 'mz-plus-push',
        data: { url: data.data?.url || '/' }
      });
      event.waitUntil(promiseChain);
    } catch (e) {
      console.error('[SW] Erreur parsing Push Data:', e);
    }
  }
});

const CACHE_NAME = 'mz-elite-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Événement d'installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache des ressources critiques');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Événement d'activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Nettoyage rigoureux des anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Suppression du vieux cache:', name);
              return caches.delete(name);
            }
          })
        );
      })
    ])
  );
});

// Interception des requêtes avec mise à jour du cache
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes API locales ou externes, ou Firebase
  const isApiRequest = event.request.url.includes('/api/') || event.request.url.includes('/.netlify/');
  if (!event.request.url.startsWith(self.location.origin) || isApiRequest) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Si la réponse est valide, on met à jour le cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      // Stratégie : Réseau d'abord pour le HTML/Manifest, Cache d'abord pour le reste
      const isCritical = event.request.url.endsWith('index.html') || 
                       event.request.url.endsWith('manifest.json') || 
                       event.request.url === self.location.origin + '/';

      if (isCritical) {
        return fetchPromise.then(res => res || cachedResponse);
      }

      return cachedResponse || fetchPromise;
    })
  );
});

// Gestion du clic
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Déterminer l'objet URL cible
      let targetUrl;
      try {
        targetUrl = new URL(urlToOpen, self.location.origin);
      } catch (e) {
        targetUrl = new URL('/', self.location.origin);
      }

      // Si le site est déjà ouvert sur le même origin, on le redirige et on lui donne le focus
      for (let client of windowClients) {
        try {
          const clientUrl = new URL(client.url, self.location.origin);
          if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
            if ('navigate' in client) {
              client.navigate(targetUrl.href);
            }
            return client.focus();
          }
        } catch (err) {
          console.error('[SW] Erreur de comparaison URL client:', err);
        }
      }

      // Sinon on ouvre un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(targetUrl.href);
      }
    })
  );
});
