import { getFirebaseAdmin } from './firebaseAdmin.js';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
  url?: string;
}

/**
 * Service pour gérer l'envoi de notifications push via Firebase Admin
 */
export class NotificationService {
  /**
   * Envoie une notification à un ou plusieurs tokens FCM
   * @param tokens Token unique ou tableau de tokens
   * @param payload Contenu de la notification
   * @returns Un objet contenant les succès et les tokens à nettoyer (invalides)
   */
  static async sendPush(tokens: string | string[], payload: PushNotificationPayload) {
    const admin = getFirebaseAdmin();
    const tokenList = Array.isArray(tokens) ? tokens : [tokens];
    const uniqueTokens = Array.from(new Set(tokenList)).filter(Boolean);

    if (uniqueTokens.length === 0) {
      return { success: false, error: 'No valid tokens provided' };
    }

    const defaultIcon = 'https://ui-avatars.com/api/?name=MZ&background=ca8a04&color=fff&size=512&format=png';
    const icon = payload.icon || defaultIcon;
    
    // Payload optimisé pour HTTP v1
    const messageBase = {
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.image && { image: payload.image })
      },
      data: {
        ...payload.data,
        title: payload.title,
        body: payload.body,
        url: payload.url || '/',
        icon: icon
      },
      webpush: {
        headers: {
          'Urgency': 'high'
        },
        notification: {
          icon: icon,
          badge: icon,
          click_action: payload.url || '/',
          requireInteraction: true // Garde la notification visible jusqu'à interaction
        },
        fcmOptions: {
          link: payload.url || '/'
        }
      }
    };

    try {
      if (uniqueTokens.length === 1) {
        // Envoi simple (plus rapide pour 1 seul token)
        try {
          const response = await admin.messaging().send({
            ...messageBase,
            token: uniqueTokens[0]
          });
          return { success: true, messageId: response, invalidTokens: [] };
        } catch (error: any) {
          const isInvalid = this.isTokenInvalidError(error);
          return { 
            success: false, 
            error: error.message, 
            invalidTokens: isInvalid ? [uniqueTokens[0]] : [] 
          };
        }
      } else {
        // Envoi groupé
        const response = await admin.messaging().sendEach(uniqueTokens.map(token => ({
          ...messageBase,
          token
        })));

        const invalidTokens: string[] = [];
        response.responses.forEach((res, idx) => {
          if (!res.success && this.isTokenInvalidError(res.error)) {
            invalidTokens.push(uniqueTokens[idx]);
          }
        });

        return {
          success: true,
          responses: response.responses,
          invalidTokens,
          successCount: response.successCount,
          failureCount: response.failureCount
        };
      }
    } catch (error: any) {
      console.error('NotificationService Error:', error);
      throw error;
    }
  }

  /**
   * Spécifique au cas d'usage: Ajout de produit
   */
  static async notifyProductAdded(token: string, productName: string, productIcon?: string) {
    return this.sendPush(token, {
      title: 'Produit ajouté ! 🚀',
      body: `Félicitations, "${productName}" est maintenant dans ta boutique.`,
      icon: productIcon,
      url: '/boutique' // Redirection vers la boutique
    });
  }

  /**
   * Détecte si l'erreur FCM indique un token qui n'est plus valide
   */
  private static isTokenInvalidError(error: any): boolean {
    if (!error) return false;
    const errorCode = error.code || (error.errorInfo && error.errorInfo.code);
    const errorMessage = error.message ? error.message.toLowerCase() : '';
    
    return (
      errorCode === 'messaging/registration-token-not-registered' ||
      errorCode === 'messaging/invalid-registration-token' ||
      errorMessage.includes('not-registered') ||
      errorMessage.includes('invalid-argument')
    );
  }
}
