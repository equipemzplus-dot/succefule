import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  getDocFromServer,
  doc,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;

// // Test connection CRITICAL
// async function testConnection() {
//   try {
//     await getDocFromServer(doc(db, 'test', 'connection'));
//   } catch (error) {
//     if(error instanceof Error && error.message.includes('the client is offline')) {
//       console.error("Please check your Firebase configuration.");
//     }
//   }
// }
// testConnection();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function addLivePulseEvent(event: {
  user_name: string;
  type: "gain" | "join" | "premium" | "coaching";
  detail: string;
}) {
  try {
    await addDoc(collection(db, "live_pulse"), {
      ...event,
      created_at: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "live_pulse");
  }
}

export const requestNotificationPermission = async (vapidKey: string) => {
  if (!messaging) {
    console.error("FCM: Messaging not supported or initialized");
    return { token: null, status: "unsupported" };
  }

  try {
    if (!("Notification" in window)) {
      console.error("FCM: Notifications not supported by browser");
      return { token: null, status: "unsupported" };
    }

    console.log("FCM: Requesting permission with VAPID:", vapidKey);
    const permission = await Notification.requestPermission();
    console.log("FCM: Permission result:", permission);

    if (permission === 'granted') {
      try {
        console.log("FCM: Taking token...");
        const token = await getToken(messaging, { 
          vapidKey: vapidKey || "BJq2QbMlGOeSnuz94cUiQ-kqj6DqXGyIEa968-nBPmmPZ2V7Y_USSAhDodiPSiSwyWl-v8y8fP75byiWFgmFtlo" 
        });
        if (token) {
          console.log("FCM: Token successfully retrieved:", token);
          return { token, status: "granted" };
        } else {
          console.log("FCM: No registration token available. Request permission to generate one.");
          return { token: null, status: "no_token" };
        }
      } catch (err) {
        console.error("FCM: An error occurred while retrieving token. ", err);
        return { token: null, status: "error" };
      }
    } else {
      console.log("FCM: Permission not granted. Status:", permission);
      return { token: null, status: permission };
    }
  } catch (error) {
    console.error("FCM: Error in requestNotificationPermission:", error);
    return { token: null, status: "error" };
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return;
  return onMessage(messaging, (payload) => {
    console.log("FCM: Foreground message received:", payload);
    callback(payload);
  });
};
