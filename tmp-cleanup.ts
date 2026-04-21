import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Fetching inquiries...");
  const snap = await getDocs(collection(db, "inquiries"));
  let deleted = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (data.message && typeof data.message === 'string' && data.message.includes("Scraped from AHCAB")) {
      await deleteDoc(doc(db, "inquiries", d.id));
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} scraped inquiries.`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
