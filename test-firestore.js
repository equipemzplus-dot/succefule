import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
console.log("Config loaded:", config);

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const d = doc(db, 'test/doc');
    await getDocFromServer(d);
    console.log("Connection success!");
  } catch (e) {
    console.error("Error connecting to Firestore:", e);
  }
}
run();
