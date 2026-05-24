import { Product } from '../types';

export class ChariowService {
  /**
   * Initiates payment for a selected product with customer information
   * calling our secure backend proxy route to hide Chariow API Key.
   */
  static async initiateCheckout(params: {
    productId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    countryCode: string;
    referrerId?: string;
  }): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
    try {
      // Build internal clean redirect URL that passes Chariow's {sale_id} template token and referrer/product info
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/?merci=true&sale_id={sale_id}&ref_id=${params.referrerId || ''}&prod_id=${params.productId}`;

      console.log('[ChariowService] Preparing checkout payload to backend...', redirectUrl);
      
      const payload = {
        product_id: params.productId,
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        phone: {
          number: params.phone,
          country_code: params.countryCode
        },
        redirect_url: redirectUrl
      };

      // Call our secure backend checkout proxy
      const response = await fetch('/api/chariow/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        return {
          success: false,
          error: 'invalid_response',
          message: 'Le serveur a retourné une réponse invalide.',
          data: text
        };
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      console.error('[ChariowService] Error in initiateCheckout:', err);
      return {
        success: false,
        error: 'network_error',
        message: err.message || 'Erreur réseau lors de la communication de paiement.'
      };
    }
  }

  /**
   * Safe fetch products list from raw database or proxy API
   */
  static async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch('/api/chariow/products');
      if (response.ok) {
        const resJson = await response.json();
        if (resJson && resJson.success && resJson.data) {
          return Array.isArray(resJson.data) ? resJson.data : (resJson.data.products || []);
        }
      }
    } catch (err) {
      console.warn('[ChariowService] Failed to load products via proxy API, falling back to local database fetch', err);
    }
    return [];
  }
}
