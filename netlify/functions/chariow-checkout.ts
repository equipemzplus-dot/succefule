import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'missing_api_key',
        message: "La clé API Chariow (CHARIOW_API_KEY) n'a pas été trouvée dans les variables d'environnement de Netlify."
      })
    };
  }

  let bodyData: any = {};
  try {
    if (event.body) {
      bodyData = JSON.parse(event.body);
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ success: false, error: 'invalid_json', message: 'Le corps de la requête doit être du JSON valide.' })
    };
  }

  const { product_id, email, first_name, last_name, phone } = bodyData;

  if (!product_id) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'invalid_parameters',
        message: "Le paramètre 'product_id' est requis."
      })
    };
  }

  try {
    console.log('[Chariow Netlify Checkout] Initiating checkout...');
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
        phone
      })
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    console.error('[Chariow Netlify Checkout] Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'fetch_error',
        message: "Erreur de connexion lors de la communication de Netlify avec la passerelle Chariow.",
        details: error.message
      })
    };
  }
};
