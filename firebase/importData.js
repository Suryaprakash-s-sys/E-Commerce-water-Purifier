const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");
const products = require("../data/products.json");

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function uploadData() {
  console.log("Starting data import...");
  let count = 0;
  
  for (const product of products) {
    // If your JSON has an "id" field, use it as the document ID. Otherwise, auto-generate one.
    const docRef = product.id 
      ? db.collection("products").doc(product.id) 
      : db.collection("products").doc();
      
    const { dealerPrice, ...publicProduct } = product;
    await docRef.set(publicProduct);
    if (Number.isFinite(dealerPrice)) {
      await db.collection("dealerPrices").doc(docRef.id).set({ price: dealerPrice, updatedAt: new Date() });
    }
    count++;
  }
  
  console.log(`Success! Imported ${count} products into Firestore.`);
  process.exit(0);
}

uploadData().catch((error) => {
  console.error("Error importing data:", error);
  process.exit(1);
});
