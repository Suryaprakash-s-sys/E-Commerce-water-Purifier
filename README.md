# Califnco water purifier commerce — Round 1

Workspace deliverables for the mobile commerce app, Firebase-backed admin console, product seed data, and n8n Instagram posting workflow.

## Workspace checklist

- [x] Expo/React Native app scaffold, authentication screens/services, product catalogue, cart and checkout screens; attached missing screens and navigation entry point.
- [x] 53 product records spanning the assigned categories.
- [x] Responsive Vite admin console with Firebase custom-claim sign-in, order and service desk, dealer approvals, and product management.
- [x] 53 product records across assigned categories; importer stores wholesale prices in protected `dealerPrices` documents.
- [x] Firestore rules prevent client-created paid orders and unauthorized status changes.
- [x] Razorpay test-mode backend in a Cloudflare Worker. It recalculates prices, verifies signatures and captured payments, and creates paid orders. Firebase can remain on Spark.
- [ ] Firebase data/credentials, deployed Worker URL, Vercel admin URL, and Razorpay test keys require account setup.
- [ ] FCM, EmailJS, and TextBee delivery require provider and device configuration.

## Run locally and deploy

### Firebase Spark setup

1. Create a Firebase project on Spark. Enable Email/Password Authentication, create Firestore, and register mobile and web apps. Put the public Firebase app configuration in `mobile/.env` and `admin/.env.local` using the example files.
2. From the repository root, deploy rules and indexes: `npx firebase-tools deploy --only firestore:rules,firestore:indexes` (or use the Firebase CLI installed on your machine).
3. Create a service account key only for the trusted import script and Cloudflare Worker. Keep `firebase/serviceAccountKey.json` local; it is ignored by Git. Never put this key in either client app.
4. Import the catalogue from the repository root: `cd firebase; npm install; node importData.js`. This imports 53 public product records and their prices into the admin/dealer-only `dealerPrices/{productId}` collection. Re-run it to migrate an existing seed catalogue and remove old `dealerPrice` fields from those product documents.
5. Create an administrator with Firebase Auth, then grant the custom claim from a trusted Admin SDK session: `await getAuth().setCustomUserClaims(uid, { admin: true, role: 'admin' })`. Sign out and back in to refresh the claim.

### Payment backend (Cloudflare Worker, Spark-compatible)

1. In `mobile/`, run `npx wrangler login` once to connect your Cloudflare account.
2. Set Worker secrets from `mobile/` (Wrangler reads the Worker config explicitly):
   - `npx wrangler secret put FIREBASE_WEB_API_KEY --config ../workers/payment-api/wrangler.toml`
   - `npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON --config ../workers/payment-api/wrangler.toml`
   - `npx wrangler secret put RAZORPAY_KEY_ID --config ../workers/payment-api/wrangler.toml`
   - `npx wrangler secret put RAZORPAY_KEY_SECRET --config ../workers/payment-api/wrangler.toml`

   Use Razorpay test keys. Paste the service-account JSON only into Wrangler's secure prompt; do not place it in app environment files. These Cloudflare Worker secrets avoid Firebase Secret Manager and do not require upgrading Firebase from Spark.
3. Deploy from `mobile/` with `npm run deploy`. This deploys the Worker config directly; it does not run an Expo web export. Copy the printed `workers.dev` URL into `EXPO_PUBLIC_PAYMENT_API_URL` in `mobile/.env`, then restart Expo.
4. From the repository root, deploy Firestore rules: `npx firebase-tools deploy --only firestore:rules`. Orders are written only after the Worker authenticates the Firebase ID token, fetches current product/wholesale prices, and verifies the Razorpay signature and captured payment.
5. Razorpay checkout uses native code. Build and install an EAS development or preview Android/iOS build; Expo Go and web checkout are not supported by `react-native-razorpay`.

### Mobile app

Copy `mobile/.env.example` to `mobile/.env`, fill in Firebase web app values and the deployed Worker URL. From `mobile/`, run `npm install` and `npm start`. Install an EAS development build to test Razorpay checkout.

### Admin panel / Vercel

Copy `admin/.env.example` to `admin/.env.local`, set the Firebase web app values, then run `cd admin; npm install; npm run dev`. To deploy, import the `admin/` directory as the Vercel project root, set the same `VITE_FIREBASE_*` environment variables, and deploy. The SPA rewrite is configured in `admin/vercel.json`. Admin sign-in requires the Firebase custom claim above.

### Remaining provider-backed features

The admin panel includes dealer approval, order management, product catalog management, and service booking management. Customer/dealer notifications are stored in Firestore and the app includes a notification screen. Actual remote push, email, and SMS delivery need FCM device credentials, EmailJS, and TextBee configuration respectively; these cannot be activated without those accounts and device setup. Product images are demo URLs and should be replaced with licensed, verified assets.

## Acceptance status and limitations

The implementation is configured for Firebase Spark plus a Cloudflare Worker backend, but no live Firebase, Razorpay, Cloudflare, or Vercel account credentials were provided here. Deployment and real payment execution therefore remain user-side setup steps. The worker never stores payment-card data. Razorpay test payments do not move real money.

## Submission summary

Implemented customer and dealer shopping flows, a server-verified Razorpay checkout Worker, protected wholesale pricing, a Firebase-backed admin console, and service desk. Live deployment and real gateway execution still require account setup and credentials.
