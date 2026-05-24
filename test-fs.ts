import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import fs from 'fs';
const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
try {
  const db = getFirestore(app, config.firestoreDatabaseId);
  console.log("Success getFirestore");
  getDocFromServer(doc(db, "test", "test")).then(() => {
    console.log("Connected");
  }).catch((e) => {
    console.error("Firestore error:", e.message);
  });
} catch(e) {
  console.error("Error:", e);
}
