# Firebase and payment setup

The mobile app and admin console use Firebase Authentication and Firestore. The project can stay on Firebase Spark: Razorpay payment verification runs in a Cloudflare Worker, not a Firebase Cloud Function.

## Firebase setup

1. Create a Firebase Spark project. Enable Email/Password sign-in, create Firestore, and register the mobile and web apps.
2. Copy the Firebase web app values to `mobile/.env` and `admin/.env.local`. These client values identify the project; Firestore security rules enforce access.
3. From the repository root deploy `firebase/firestore.rules` and `firebase/firestore.indexes.json` with `npx firebase-tools@latest deploy --only firestore:rules,firestore:indexes`.
4. Create a service account key for the trusted importer and payment Worker. Keep it at `firebase/serviceAccountKey.json`; that path is ignored by Git. Never add the key to the mobile or admin app.
5. Import products: `cd firebase`, `npm install`, `node importData.js`. The importer writes public fields to `products/{id}` and wholesale rates to restricted `dealerPrices/{id}`. Re-running the import migrates the supplied 53 products and removes the old wholesale field from those product documents.
6. Grant the admin account a custom claim from a trusted Admin SDK session: `await getAuth().setCustomUserClaims(uid, { admin: true, role: 'admin' })`. Sign out and back in to refresh the claim.

## Razorpay backend on Cloudflare Workers

From `mobile/`, run `npx wrangler login`, then set these secrets (Wrangler prompts for each value):

```powershell
npx wrangler secret put FIREBASE_WEB_API_KEY --config ../workers/payment-api/wrangler.toml
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON --config ../workers/payment-api/wrangler.toml
npx wrangler secret put RAZORPAY_KEY_ID --config ../workers/payment-api/wrangler.toml
npx wrangler secret put RAZORPAY_KEY_SECRET --config ../workers/payment-api/wrangler.toml
npm run deploy
```

Use Razorpay `rzp_test_` credentials. Paste the service account JSON only into Wrangler's secure prompt. Do not store Razorpay secrets in app environment files. Set the printed Worker URL as `EXPO_PUBLIC_PAYMENT_API_URL` in `mobile/.env`, then restart Expo.

The Worker requires an authenticated Firebase ID token. It reads current product and approved-dealer pricing from Firestore, creates a Razorpay order, verifies the returned HMAC signature, confirms the payment is captured, then atomically creates the paid order and marks its payment intent complete. Mobile clients cannot create or change paid orders. This approach does not enable Secret Manager or require a Firebase billing upgrade.

Razorpay checkout uses native code. Install an EAS development or preview build; Expo Go and web checkout cannot use `react-native-razorpay`.

## Existing catalogue migration

Firestore rules cannot hide a field from public reads. Therefore wholesale prices must not remain on public product documents. Run the importer after applying the rules to move the supplied catalogue's prices into `dealerPrices`. Approved dealers can read that collection; customers cannot. The Worker checks the same protected collection on every checkout.

## Free-plan/provider boundaries

The app and admin console store service bookings and notification records in Firestore. Actual push delivery needs native device setup and FCM credentials; EmailJS and TextBee also need provider accounts/keys. Those are separate from product/order/service data and are not live until configured.
