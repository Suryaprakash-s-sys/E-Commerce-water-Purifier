const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize using the new v12+ syntax
initializeApp({
  credential: cert(serviceAccount)
});

// Paste your UID here again
const uid = "iMfsEPzsWNOWA2KtWpFe8gR48CE3"; 

// Set the custom claim using the new getAuth() method
getAuth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Success! The user with UID ${uid} is now an admin.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error setting custom claim:", error);
    process.exit(1);
  });