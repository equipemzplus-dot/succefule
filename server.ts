import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { initAdmin, sendPush, sendMulticast } from './notifications.js';
import { runPriorityDispatcher } from './services/priorityDispatcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase for manifest route
const RAW_URL = process.env.VITE_SUPABASE_URL || 'https://ydkicdhcylpdffuzgdvm.supabase.co';
const SUPABASE_URL = RAW_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_E_rpgEr5_Vf1_1wkLBGKNQ_hxvfdeED';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // LOGS DE DÉBOGAGE API
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
      console.log(`[FIREBASE API] ${req.method} ${req.url}`);
    }
    next();
  });

  // Dynamic Icon Route
  app.get('/icon.png', async (req, res) => {
    try {
      const { data } = await supabase.from('mz_app_config').select('icon_base64').eq('id', 'main-config').maybeSingle();
      if (data?.icon_base64) {
        const base64Data = data.icon_base64.split(',')[1];
        if (base64Data) {
          const img = Buffer.from(base64Data, 'base64');
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Content-Length', img.length);
          res.send(img);
          return;
        }
      }
      res.redirect('https://ui-avatars.com/api/?name=MZ&background=ca8a04&color=fff&size=512&format=png');
    } catch (error) {
      res.status(500).send('Error');
    }
  });

  // Dynamic Manifest Route
  app.get('/manifest.json', async (req, res) => {
    try {
      const { data } = await supabase.from('mz_app_config').select('*').eq('id', 'main-config').maybeSingle();
      
      const customName = data?.app_name || 'MZ+ Elite';
      // Use the stable route for icons instead of raw base64 for better compatibility
      const iconUrl = '/icon.png?v=' + (data?.updated_at ? new Date(data.updated_at).getTime() : Date.now());

      const manifest = {
        "id": "mz-plus-elite-system",
        "name": customName,
        "short_name": customName.substring(0, 12),
        "description": "Système Élite - " + customName,
        "icons": [
          {
            "src": iconUrl,
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": iconUrl,
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ],
        "start_url": "/",
        "display": "standalone",
        "background_color": "#000000",
        "theme_color": "#ca8a04",
        "scope": "/",
        "gcm_sender_id": "627912091228"
      };

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(manifest));
    } catch (error) {
      console.error('Manifest generation error, using memory fallback:', error);
      const fallbackManifest = {
        "id": "mz-plus-elite-system",
        "name": "Millionaire Zone Plus - Elite",
        "short_name": "MZ+ Elite",
        "description": "Système Élite Millionaire Zone Plus",
        "icons": [
          {
            "src": "/icon.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/icon.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ],
        "start_url": "/",
        "display": "standalone",
        "background_color": "#000000",
        "theme_color": "#ca8a04",
        "scope": "/"
      };
      res.setHeader('Content-Type', 'application/json');
      res.json(fallbackManifest);
    }
  });

  // API Route to broadcast a new product to ALL users
  app.post('/api/broadcast-product', async (req, res) => {
    const { productName, icon } = req.body;

    try {
      if (!productName) {
        return res.status(400).json({ error: 'Nom du produit manquant' });
      }

      // Fetch all users with a valid FCM token
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('fcm_token')
        .not('fcm_token', 'is', null);

      if (fetchError) throw fetchError;

      if (!users || users.length === 0) {
        return res.json({ success: true, message: 'Aucun token trouvé, notification ignorée' });
      }

      const tokens = users.map(u => u.fcm_token as string).filter(Boolean);
      
      const title = 'Nouveau Service ! 🚀';
      const body = `Le service "${productName}" est maintenant disponible. Allez voir !`;
      
      const result = await sendMulticast(tokens, title, body, { 
        icon: icon || '/icon.png',
        url: '/catalog' 
      });

      res.json(result);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('API Broadcast-Product Error:', error);
      res.status(500).json({ error: err.message });
    }
  });

  initAdmin();

  // Background Dispatcher for Priority Notifications (Run every 30 seconds)
  console.log('[Server] Dispatcher interval set (30s)');
  setInterval(() => {
    console.log('[Server] Starting runPriorityDispatcher...');
    runPriorityDispatcher().catch(err => {
      console.error('[Dispatcher Error]', err);
    });
  }, 30000);

  // API Route to send real FCM Push (using the new service)
  app.post('/api/send-push', async (req, res) => {
    const { token, tokens: initialTokens, title, body, url, icon, target } = req.body;
    let tokens = initialTokens || [];

    // Diagnostic if service account is obviously missing
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.error('[FIREBASE API] FIREBASE_SERVICE_ACCOUNT is missing in environment variables');
      return res.status(500).json({ 
        success: false, 
        error: 'missing_config', 
        details: 'Server environment missing FIREBASE_SERVICE_ACCOUNT. Contact admin.' 
      });
    }

    try {
      if (target === 'all' && tokens.length === 0) {
        const { data: users, error: supabaseErr } = await supabase.from('users').select('fcm_token').not('fcm_token', 'is', null);
        if (supabaseErr) {
           console.error('[Supabase Error] Fetching tokens for broadcast:', supabaseErr);
           return res.status(500).json({ success: false, error: 'database_error', details: supabaseErr.message });
        }
        if (users) {
          tokens = users.map(u => u.fcm_token as string).filter(Boolean);
        }
      }

      if (!token && (!tokens || tokens.length === 0)) {
        return res.status(400).json({ error: 'Token ou liste de tokens manquant', details: 'Aucun destinataire valide trouvé' });
      }

      let result;
      if (tokens && Array.isArray(tokens) && tokens.length > 0) {
        // Envoi groupé (Multicast)
        result = await sendMulticast(tokens, title, body, { url, icon });
      } else if (token) {
        // Envoi individuel
        result = await sendPush(token, title, body, { url, icon });
      } else {
        return res.status(400).json({ error: 'Format de requête invalide' });
      }

      if (!result.success) {
        console.error('[FIREBASE API] Push failed:', result);
        return res.status(500).json({ ...result, server_time: new Date().toISOString() });
      }

      res.json(result);
    } catch (error: unknown) {
      const err = error as { message?: string; name?: string; code?: string };
      console.error('API Send-Push Error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'internal_exception', 
        details: err.message || 'Unknown server error',
        code: err.code
      });
    }
  });

  // Chariow API test endpoint with CORS / OPTIONS support
  app.use('/api/chariow/test', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.get('/api/chariow/test', async (req, res) => {
    const apiKeys = [
      process.env.CHARIOW_API_KEY,
      process.env.VITE_CHARIOW_API_KEY,
      process.env.CHARIOZ_API_KEY,
      process.env.VITE_CHARIOZ_API_KEY
    ];
    const apiKey = apiKeys.find(key => key && key.trim() !== '');

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'missing_api_key',
        message: "La clé API Chariow (CHARIOW_API_KEY) n'a pas été trouvée dans les variables d'environnement."
      });
    }

    try {
      console.log('[Chariow API Test] Testing connection...');
      const response = await fetch('https://api.chariow.com/v1/store', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      } else {
        data = await response.text().catch(() => null);
      }
      
      return res.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        detectedKeyLength: apiKey.length,
        detectedKeyPreview: apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : '****'
      });
    } catch (error: any) {
      console.error('[Chariow API Test] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'fetch_error',
        message: "Erreur de connexion lors de la communication avec l'API Chariow.",
        details: error.message
      });
    }
  });

  // Chariow API products endpoint with CORS / OPTIONS support
  app.use('/api/chariow/products', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.get('/api/chariow/products', async (req, res) => {
    const apiKeys = [
      process.env.CHARIOW_API_KEY,
      process.env.VITE_CHARIOW_API_KEY,
      process.env.CHARIOZ_API_KEY,
      process.env.VITE_CHARIOZ_API_KEY
    ];
    const apiKey = apiKeys.find(key => key && key.trim() !== '');

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'missing_api_key',
        message: "La clé API Chariow (CHARIOW_API_KEY) n'a pas été trouvée dans les variables d'environnement."
      });
    }

    try {
      console.log('[Chariow API Products] Fetching products list...');
      const response = await fetch('https://api.chariow.com/v1/products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      } else {
        data = await response.text().catch(() => null);
      }
      
      return res.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        detectedKeyLength: apiKey.length,
        detectedKeyPreview: apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : '****'
      });
    } catch (error: any) {
      console.error('[Chariow API Products] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'fetch_error',
        message: "Erreur de connexion lors du chargement des produits de l'API Chariow.",
        details: error.message
      });
    }
  });

  // Chariow API checkout integration with CORS / OPTIONS support
  app.use('/api/chariow/checkout', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.post('/api/chariow/checkout', async (req, res) => {
    const apiKeys = [
      process.env.CHARIOW_API_KEY,
      process.env.VITE_CHARIOW_API_KEY,
      process.env.CHARIOZ_API_KEY,
      process.env.VITE_CHARIOZ_API_KEY
    ];
    const apiKey = apiKeys.find(key => key && key.trim() !== '');

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'missing_api_key',
        message: "La clé API Chariow (CHARIOW_API_KEY) n'a pas été trouvée dans les variables d'environnement."
      });
    }

    const { product_id, email, first_name, last_name, phone, redirect_url } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'invalid_parameters',
        message: "Le paramètre 'product_id' est requis au format string."
      });
    }

    try {
      console.log(`[Chariow API Checkout] Initiating checkout for user ${email || 'unknown'} and product ${product_id}...`);
      const response = await fetch('https://api.chariow.com/v1/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          product_id,
          email,
          first_name,
          last_name,
          phone,
          redirect_url: redirect_url || undefined
        })
      });

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      } else {
        data = await response.text().catch(() => null);
      }
      
      return res.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        detectedKeyLength: apiKey.length,
        detectedKeyPreview: apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : '****'
      });
    } catch (error: any) {
      console.error('[Chariow API Checkout] Error during checkout call:', error);
      return res.status(500).json({
        success: false,
        error: 'fetch_error',
        message: "Erreur de connexion lors de l'appel à la passerelle de paiement Chariow.",
        details: error.message
      });
    }
  });

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API error handler - guarantees JSON for all /api/* errors
  app.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error('[API Unhandled Error]', err);
    res.status(500).json({
      success: false,
      error: 'internal_server_error',
      message: err.message || 'Une erreur interne est survenue sur le serveur.',
      details: String(err)
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
