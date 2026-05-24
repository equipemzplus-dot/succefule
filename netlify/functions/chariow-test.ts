import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  const apiKeys = [
    process.env.CHARIOW_API_KEY,
    process.env.VITE_CHARIOW_API_KEY,
    process.env.CHARIOZ_API_KEY,
    process.env.VITE_CHARIOZ_API_KEY
  ];
  const apiKey = apiKeys.find(key => key && key.trim() !== '');

  if (!apiKey) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'missing_api_key',
        message: "La clé API Chariow (CHARIOW_API_KEY) n'a pas été trouvée dans les variables d'environnement de Netlify."
      })
    };
  }

  try {
    console.log('[Chariow Netlify Test] Testing connection...');
    const response = await fetch('https://api.chariow.com/v1/store', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Accept': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type');
    let data: any = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => null);
    }

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        detectedKeyLength: apiKey.length,
        detectedKeyPreview: apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : '****'
      })
    };
  } catch (error: any) {
    console.error('[Chariow Netlify Test] Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'fetch_error',
        message: "Erreur de connexion lors de la communication de Netlify avec l'API Chariow.",
        details: error.message
      })
    };
  }
};
