import admin from 'firebase-admin';

/**
 * Service de Notifications Push (Firebase Admin SDK HTTP v1)
 * Ce module est conçu pour être importé et utilisé n'importe où dans le backend.
 */

/**
 * Initialise l'instance Admin (à appeler au démarrage du serveur)
 */
export const initAdmin = () => {
    if (admin.apps.length) return admin;

    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!saJson) {
        console.error('FCM: FIREBASE_SERVICE_ACCOUNT manquant dans les variables d\'environnement !');
        return admin;
    }

    try {
        const cleanedJson = saJson.trim();
        // Log basic info about the string (size, start) without leaking sensitive parts
        console.log(`FCM: Parsing service account JSON (${cleanedJson.length} chars, starts with "${cleanedJson.substring(0, 5)}...")`);
        const serviceAccount = JSON.parse(cleanedJson);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('FCM: Firebase Admin initialisé via variable d\'environnement');
    } catch (e: any) {
        console.error('FCM: Erreur lors du parsing ou de l\'initialisation de FIREBASE_SERVICE_ACCOUNT:', e.message);
        console.error('FCM: Contenu brut (tronqué):', saJson.substring(0, 50) + '...');
    }
    return admin;
};

/**
 * Envoie une notification de manière sécurisée et gère les erreurs de tokens.
 * 
 * @param token Token FCM du destinataire
 * @param title Titre de la notification
 * @param body Corps du message
 * @param options Données supplémentaires (icon, url, data)
 */
export const sendPush = async (
    token: string, 
    title: string, 
    body: string, 
    options: { icon?: string; url?: string; data?: any } = {}
) => {
    // S'assurer qu'admin est prêt
    if (!admin.apps.length) initAdmin();

    const payload = {
        token,
        notification: {
            title,
            body,
        },
        // Données transmises au Service Worker en arrière-plan
        data: {
            ...(options.data as Record<string, string> || {}),
            title,
            body,
            url: options.url || '/',
            icon: options.icon || '/icon.png'
        },
        // Configuration spécifique Web Push (Arrière-plan et compatibilité navigateurs)
        webpush: {
            headers: {
                Urgency: 'high'
            },
            notification: {
                title,
                body,
                icon: options.icon || '/icon.png',
                badge: options.icon || '/icon.png',
                click_action: options.url || '/',
                requireInteraction: true // La notification reste jusqu'à interaction
            },
            fcmOptions: {
                link: options.url || '/'
            }
        }
    };

    try {
        const response = await admin.messaging().send(payload);
        return { success: true, messageId: response };
    } catch (error: unknown) {
        // Detection des tokens expirés ou invalides
        const err = error as { code?: string; message?: string };
        const isInvalid = 
            err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token';

        if (isInvalid) {
            return { success: false, error: 'invalid_token', reason: err.message };
        }

        console.error('Erreur FCM:', error);
        return { success: false, error: 'unknown_error', reason: err.message };
    }
};

/**
 * Envoie une notification à plusieurs tokens
 */
export const sendMulticast = async (
    tokens: string[], 
    title: string, 
    body: string, 
    options: { icon?: string; url?: string; data?: any } = {}
) => {
    if (!tokens.length) return { success: false, error: 'no_tokens' };
    if (!admin.apps.length) initAdmin();

    const payload = {
        notification: { title, body },
        data: {
            ...(options.data as Record<string, string> || {}),
            title,
            body,
            url: options.url || '/',
            icon: options.icon || '/icon.png'
        },
        webpush: {
            headers: { Urgency: 'high' },
            notification: {
                title,
                body,
                icon: options.icon || '/icon.png',
                badge: options.icon || '/icon.png',
                click_action: options.url || '/',
                requireInteraction: true
            },
            fcmOptions: { link: options.url || '/' }
        }
    };

    try {
        const response = await admin.messaging().sendEach(tokens.map(token => ({
            ...payload,
            token
        })));
        
        return { 
            success: true, 
            successCount: response.successCount, 
            failureCount: response.failureCount 
        };
    } catch (error: any) {
        console.error('Erreur Multicast FCM:', error);
        return { success: false, error: 'multicast_error', reason: error.message };
    }
};

/**
 * Cas d'usage spécifique : Ajout de produit pour tout le monde
 */
export const broadcastProductAdded = async (productName: string, icon?: string) => {
    // Note: On ne peut pas facilement importer Supabase ici sans risquer des cycles ou des configs manquantes
    // On laisse le serveur s'occuper de la liste des tokens et appeler sendMulticast
    return { title: 'Nouveau Produit ! 🚀', body: `Le service "${productName}" est maintenant disponible. Allez voir !` };
};

/**
 * Cas d'usage spécifique : Ajout de produit individuel
 */
export const notifyProductAdded = async (token: string, productName: string) => {

    return sendPush(
        token,
        'Produit ajouté ! 🚀',
        `Le produit "${productName}" est maintenant disponible dans votre boutique.`,
        {
            url: '/boutique',
            icon: '/icon.png' // Assurez-vous que cette icône existe
        }
    );
};
