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
    if (!product.id || !product.name || !Array.isArray(product.images) || product.images.length === 0) {
      throw new Error(`Product is missing an id, name, or image URL: ${product.name || product.id || "unknown product"}`);
    }
    // If your JSON has an "id" field, use it as the document ID. Otherwise, auto-generate one.
    const docRef = product.id 
      ? db.collection("products").doc(product.id) 
      : db.collection("products").doc();
      
    const { dealerPrice, ...publicProduct } = product;
    const existing = await docRef.get();
    const now = new Date();
    await docRef.set({
      ...publicProduct,
      createdAt: existing.data()?.createdAt ?? now,
      updatedAt: now,
    });
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
