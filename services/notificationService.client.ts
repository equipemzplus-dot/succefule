/**
 * Service Client pour les Notifications Push
 */

export interface PushOptions {
  url?: string;
  icon?: string;
  data?: any;
}

/**
 * Envoie une notification push via l'API backend
 */
export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  options: PushOptions = {}
) => {
  try {
    const response = await fetch('/api/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        title,
        body,
        url: options.url || '/',
        icon: options.icon || '/icon.png',
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const text = await response.text();
        errorData = { error: 'raw_error', details: text.substring(0, 200) };
      }
      
      console.error(`FCM Server Error (${response.status}):`, errorData);
      return { 
        success: false, 
        error: `server_error_${response.status}`, 
        details: errorData.details || errorData.error || 'Unknown error' 
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification push:', error);
    return { success: false, error: 'network_error' };
  }
};

/**
 * Helper spécifique pour l'ajout de produit
 */
export const notifyProductImported = async (token: string, productName: string) => {
  return sendPushNotification(
    token,
    'Produit ajouté ! 🚀',
    `Le produit "${productName}" est maintenant disponible dans votre boutique.`,
    {
      url: '/boutique',
      icon: '/icon.png'
    }
  );
};
