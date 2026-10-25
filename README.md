# Califnco Water Purifier E-Commerce Platform

A full-stack e-commerce platform for water purifiers, filtration products, and accessories. The project includes a mobile shopping application, a web-based admin dashboard, secure payment processing, dealer management, service bookings, and social media marketing automation.

## 1. Technology Stack

| Component | Technology |
|---|---|
| Mobile application | React Native, Expo |
| Admin dashboard | React, Vite |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Backend services | Firebase Admin SDK |
| Payment gateway | Razorpay (Test Mode) |
| Payment API | Cloudflare Workers |
| Admin deployment | Vercel |
| Marketing automation | Make.com |
| Product data | Google Sheets |
| Social media | Instagram |
| Notifications | Firebase Cloud Messaging (FCM) |
| Email and SMS | EmailJS, TextBee |
| Languages | JavaScript, TypeScript |

## 2. Main Features

### Customer Mobile App
- User registration and login
- Product catalogue and product details
- Shopping cart and checkout
- Razorpay payment integration
- Order management
- Service booking
- Customer notifications

### Admin Dashboard
- Secure administrator login using Firebase custom claims
- Product catalogue management
- Order management
- Dealer approval and management
- Service booking management
- Protected wholesale pricing
- Customer and dealer notification records

### Payment Processing
- Razorpay test-mode checkout
- Server-side price calculation
- Payment signature verification
- Payment capture verification
- Secure order creation after successful payment

### Marketing Automation
- Read product information from Google Sheets
- Generate or prepare product captions
- Use product images hosted at an accessible URL
- Publish product posts through the connected Instagram integration
- Update the spreadsheet with the posting status and post details

## 3. Project Structure

The repository is organised into the following main directories:

```text
califnco-water-purifier/
├── mobile/                  # React Native / Expo app
│   ├── .env.example
│   └── package.json
├── admin/                   # React + Vite admin dashboard
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── firebase/                # Firestore setup and product importer
│   ├── importData.js
│   └── serviceAccountKey.json  # Local only; never commit
├── workers/
│   └── payment-api/         # Cloudflare payment Worker
│       └── wrangler.toml
└── README.md
```

The exact file layout may vary slightly depending on the current repository version.

## 4. Prerequisites

Install or create the following before running the project:

- Node.js and npm
- Git
- A Firebase project on the Spark plan
- A Cloudflare account
- A Razorpay account with Test Mode enabled
- An Expo development environment
- A Vercel account for admin deployment
- A Google account for Google Sheets and Make.com automation

For Android development, install the required Android development tools if you plan to build the native application locally.

## 5. Firebase Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable Email/Password authentication.
3. Create a Cloud Firestore database.
4. Register the mobile application and web admin application.
5. Copy the Firebase web configuration into the relevant environment files.

Create `mobile/.env` from `mobile/.env.example` and `admin/.env.local` from `admin/.env.example`.

Fill in the actual values for the Firebase API key, authentication domain, project ID, storage bucket, sender ID, and app ID as required by the example files.

Install Firebase CLI if needed, then deploy the Firestore rules and indexes from the repository root:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Use the exact Firebase configuration files and project ID associated with the repository.

### Administrator Access

Create the administrator account in Firebase Authentication. Using a trusted Firebase Admin SDK environment, assign the required custom claims:

admin : admin@waterpurifier.com
pass : 123456

customer : diya@d.com
pass : 12345678

dealer : sam@s.com
pass : 12345678

```javascript
await getAuth().setCustomUserClaims(uid, {
  admin: true,
  role: "admin"
});
```

Replace `uid` with the actual administrator's Firebase user ID. This operation must run in a trusted environment, never in the browser or mobile application.

Sign out and sign in again to refresh the user's ID token.

## 6. Import Product Catalogue

The project includes 53 product records across the assigned categories.

From the repository root, run:

```bash
cd firebase
npm install
node importData.js
```

The importer uses the trusted Firebase Admin SDK to populate the product catalogue and protected dealer pricing documents.

Before running it, ensure the service account credentials are available to the script in the expected location.

**Security:** Never commit `serviceAccountKey.json` to Git or include it in frontend environment variables. The importer should be run only from a trusted local environment.

## 7. Run the Mobile Application

Navigate to the mobile directory:

```bash
cd mobile
npm install
```

Create `mobile/.env` using the example file and configure the Firebase values and payment API URL.

Start Expo:

```bash
npm start
```

Use the Expo development tools to open the application on a compatible device or emulator.

### Razorpay Mobile Checkout

The Razorpay integration uses native mobile code. Expo Go and web checkout are not supported for this integration.

Build and install an appropriate EAS development or preview build before testing payments.

Use Razorpay **Test Mode** credentials only during development. Never embed the Razorpay secret key in the mobile application.

## 8. Configure and Deploy the Payment API

The payment backend runs on Cloudflare Workers so that payment verification can work without upgrading Firebase from the Spark plan.

From the mobile directory, authenticate with Cloudflare:

```bash
npx wrangler login
```

Configure the Worker secrets using the Worker configuration path:

```bash
npx wrangler secret put FIREBASE_WEB_API_KEY --config ../workers/payment-api/wrangler.toml
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON --config ../workers/payment-api/wrangler.toml
npx wrangler secret put RAZORPAY_KEY_ID --config ../workers/payment-api/wrangler.toml
npx wrangler secret put RAZORPAY_KEY_SECRET --config ../workers/payment-api/wrangler.toml
```

Provide the actual values when prompted. Use Razorpay test keys and the Firebase service account JSON only in the secure secret prompt.

Deploy the Worker:

```bash
npm run deploy
```

Copy the generated Worker URL and set it as `EXPO_PUBLIC_PAYMENT_API_URL` in `mobile/.env`.

Restart Expo after updating the environment configuration.

The Worker is responsible for authenticating the customer, recalculating product prices, validating the Razorpay payment signature and captured payment, and creating the paid order only after successful verification.

## 9. Run the Admin Dashboard

Open a terminal and navigate to the admin directory:

```bash
cd admin
npm install
npm run dev
```

Create `admin/.env.local` from the example file and provide the required `VITE_FIREBASE_*` configuration values.

Open the local URL printed by Vite in your browser.

The dashboard requires an authenticated Firebase administrator with the correct custom claims. Ordinary customer accounts should not have administrator access.

### Deploy the Dashboard to Vercel

1. Import the repository into Vercel.
2. Set the project root to `admin/`.
3. Configure the required `VITE_FIREBASE_*` environment variables.
4. Deploy the project.
5. Test administrator login, catalogue management, order management, and service desk features.

The repository's Vercel configuration provides the SPA routing rewrite.

## 10. Make.com Instagram Automation

Make.com is used to automate product marketing using Google Sheets and Instagram.

### Google Sheets Structure

Create a spreadsheet with these columns:

| Column | Purpose |
|---|---|
| `product_id` | Unique product identifier |
| `product_name` | Product name |
| `price` | Selling price |
| `features` | Product description or features |
| `status` | Posting status, such as `PENDING` or `POSTED` |

Add a product row with status `PENDING` to test the workflow.

### Automation Workflow

Configure the Make.com scenario with the following modules:

1. **Google Sheets — Search Rows:** Find the next pending product. Set the result limit to one row.
2. **Image hosting:** Obtain a publicly accessible product image URL, such as a Cloudinary secure URL.
3. **Caption generation:** Use the configured text-generation module to create a caption from the product name, price, and features.
4. **Instagram for Business:** Select the connected Facebook Page and Instagram professional account. Map the image URL and generated caption to the publishing module.
5. **Google Sheets — Update Row:** Update the same row with the `POSTED` status, Instagram post ID, and posting timestamp.

Use the actual row number returned by the search module when updating the row. Configure the timestamp using the intended timezone, such as Asia/Kolkata.

### Test and Activate

1. Connect the required Google, image-hosting, AI, and Meta accounts.
2. Set one product row to `PENDING`.
3. Run the scenario once and inspect each module's output.
4. Confirm the Instagram post was published and the spreadsheet row was updated.
5. Configure the scenario schedule and activate it after testing.

Instagram publishing requires a supported professional account, the appropriate Meta permissions, and accessible image URLs. Availability of individual modules and scheduling options depends on the connected services and Make.com plan.

This workflow publishes to Instagram; it does not automatically publish directly to WhatsApp Status.

## 11. Notifications

The application includes notification records and a notification screen.

Actual remote delivery requires additional configuration:

- **FCM:** Register the mobile application, configure Firebase Cloud Messaging, obtain device registration tokens, and implement or configure the sending service.
- **EmailJS:** Configure the email service and approved templates.
- **TextBee:** Configure the service credentials and supported SMS or messaging workflow.

Creating a notification in Firestore alone does not guarantee that a push notification, email, or SMS will be delivered.

## 12. Security Guidelines

- Never commit service account keys or API secrets.
- Keep Razorpay secret keys on the payment backend.
- Never trust prices submitted by the client; recalculate them on the server.
- Verify payment signatures and captured payment status before creating paid orders.
- Enforce administrator permissions using Firebase custom claims and Firestore Security Rules.
- Keep dealer wholesale prices in protected documents.
- Do not store payment card details in the application.
- Use test credentials during development.
- Restrict production secrets to the services that need them.

## 13. Testing Checklist

Before considering the project ready for deployment, verify:

- [ ] Customer registration and login
- [ ] Product catalogue and product details
- [ ] Cart and checkout
- [ ] Razorpay successful and failed test payments
- [ ] Server-side payment verification
- [ ] Order creation and order management
- [ ] Admin access control
- [ ] Dealer approval and protected pricing
- [ ] Service booking management
- [ ] Notification delivery on a registered device
- [ ] Instagram automation and spreadsheet status updates
- [ ] Production environment variables and deployment URLs

## 14. Deployment Status

The project implementation includes the mobile app, admin dashboard, seeded product catalogue, Firestore security configuration, and Razorpay payment backend.

Live deployment still requires the relevant Firebase, Cloudflare, Razorpay, Vercel, and provider account configuration. The Make.com automation also requires connected accounts and successful end-to-end testing.

Razorpay Test Mode payments are simulated and do not transfer real money.


Add the applicable project license before distributing or publishing the repository.
