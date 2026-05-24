import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let firebaseAdminInitialized = false;

export function initializeFirebaseAdmin() {
  if (firebaseAdminInitialized) return admin;

  let serviceAccount;
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountStr) {
    try {
      serviceAccount = JSON.parse(serviceAccountStr);
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', e);
    }
  } else {
    try {
      const saPath = path.join(process.cwd(), 'service-account.json');
      if (fs.existsSync(saPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
        console.log('Using service-account.json file for Firebase Admin');
      }
    } catch (error) {
      console.warn('service-account.json not found or invalid');
    }
  }

  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseAdminInitialized = true;
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
    }
  } else {
    console.warn('No Firebase Service Account found (env or file)');
  }

  return admin;
}

export const getFirebaseAdmin = () => {
  if (!firebaseAdminInitialized) {
    return initializeFirebaseAdmin();
  }
  return admin;
};
