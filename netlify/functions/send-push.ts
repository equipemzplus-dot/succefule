import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ydkicdhcylpdffuzgdvm.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const initAdmin = () => {
  if (admin.apps.length) return admin;

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saJson) {
    console.error('FCM: FIREBASE_SERVICE_ACCOUNT is missing!');
    return admin;
  }

  try {
    const serviceAccount = JSON.parse(saJson.trim());
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('FCM: Firebase Admin initialized successfully');
  } catch (e: any) {
    console.error('FCM: Error parsing FIREBASE_SERVICE_ACCOUNT:', e.message);
  }
  return admin;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { token, tokens: initialTokens, title, body, url, icon, target } = JSON.parse(event.body || '{}');
  let tokens = initialTokens || [];

  try {
    const adminInstance = initAdmin();
    if (!adminInstance.apps.length) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Firebase not initialized' }) };
    }

    // Gestion du broadcast si "target: all" et pas de tokens fournis
    if (target === 'all' && tokens.length === 0) {
      if (!SUPABASE_ANON_KEY) {
         console.warn("FCM: Target ALL but no tokens provided and no Supabase Key");
      } else {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: users } = await supabase.from('users').select('fcm_token').not('fcm_token', 'is', null);
        if (users) {
           tokens = users.map(u => u.fcm_token).filter(Boolean);
        }
      }
    }

    const payloadBase = {
      notification: { title, body },
      data: { title, body, url: url || '/', icon: icon || '/icon.png' },
      webpush: {
        notification: {
          title,
          body,
          icon: icon || '/icon.png',
          badge: icon || '/icon.png',
          click_action: url || '/'
        },
        fcmOptions: {
          link: url || '/'
        }
      }
    };

    if (tokens && Array.isArray(tokens) && tokens.length > 0) {
      // Chunking if many tokens (FCM limit is 500 for sendEach)
      const results = [];
      for (let i = 0; i < tokens.length; i += 500) {
        const chunk = tokens.slice(i, i + 500);
        const response = await adminInstance.messaging().sendEach(chunk.map(t => ({ ...payloadBase, token: t })));
        results.push(response);
      }
      return { 
        statusCode: 200, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, results }) 
      };
    } else if (token) {
      const response = await adminInstance.messaging().send({ ...payloadBase, token });
      return { 
        statusCode: 200, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, messageId: response }) 
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'No tokens found' }) };
  } catch (error: any) {
    console.error('FCM Error:', error);
    return { 
      statusCode: 500, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message }) 
    };
  }
};
