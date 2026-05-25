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
   * Safe fetch products list from Chariow API and map them to our internal Product interface
   */
  static async getProducts(): Promise<Product[]> {
    try {
      console.log('[ChariowService] Fetching products list from proxy API...');
      const response = await fetch('/api/chariow/products');
      if (!response.ok) {
        console.warn(`[ChariowService] Proxy API returned status ${response.status}`);
        return [];
      }

      const resJson = await response.json();
      if (!resJson || !resJson.success || !resJson.data) {
        console.warn('[ChariowService] Proxy API response was not successful or lacks data');
        return [];
      }

      const rawData = resJson.data;
      let rawList: any[] = [];

      // Safe deep extraction logic matching ChariowTestConsole.tsx
      if (Array.isArray(rawData)) {
        rawList = rawData;
      } else if (rawData.data && rawData.data.products && Array.isArray(rawData.data.products)) {
        rawList = rawData.data.products;
      } else if (rawData.products && Array.isArray(rawData.products)) {
        rawList = rawData.products;
      } else if (rawData.data && Array.isArray(rawData.data)) {
        rawList = rawData.data;
      } else {
        console.warn('[ChariowService] Unable to locate products array in Chariow payload structures:', rawData);
        return [];
      }

      // Map raw list to MZ+ internal Product schema
      const mappedProducts: Product[] = rawList.map((cp: any) => {
        const rawPrice = cp.price || cp.pricing?.price?.value || 0;
        const convertedPrice = Number(rawPrice) || 0;
        
        // Calculate 40% default commission if not specified
        const rawCommission = cp.commission_amount || cp.commission || Math.floor(convertedPrice * 0.4);
        const commission = Number(rawCommission) || 0;

        // Custom checkout link construction using Chariow URL structures or fallbacks
        const slugOrId = cp.slug || cp.id;
        const fallbackLink = slugOrId ? `https://mzplus.mychariow.shop/${slugOrId}/checkout` : "https://api.chariow.com";
        const link = cp.final_link || cp.finalLink || cp.link || cp.url || cp.checkout_url || fallbackLink;

        return {
          id: String(cp.id || cp._id || `ch_${Math.random().toString(36).substr(2, 9)}`),
          name: cp.name || cp.title || "Produit Chariow",
          description: cp.description || cp.desc || "Pas de description de produit fournie.",
          price: convertedPrice,
          commission_amount: commission,
          image_url: cp.image_url || cp.imageUrl || cp.image || cp.thumbnail || "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
          final_link: link
        };
      });

      console.log(`[ChariowService] Successfully loaded & mapped ${mappedProducts.length} products from Chariow API.`);
      return mappedProducts;
    } catch (err) {
      console.warn('[ChariowService] Error loading or mapping products from Chariow API:', err);
    }
    return [];
  }
}
