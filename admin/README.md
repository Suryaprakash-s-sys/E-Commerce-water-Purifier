
# Califnco admin console

Responsive Firebase admin dashboard built with React, TypeScript and Vite.

## Local development

1. Copy `.env.example` to `.env` and add the Firebase Web app config.
2. Run `npm install` and `npm run dev`.
3. Admin sign-in requires an Auth user with a trusted custom claim `{ admin: true }` or `{ role: 'admin' }`. See the root `firebase/README.md` for claim assignment. The client profile `role` field does not authorize this dashboard.

## Vercel deployment

Import this repository in Vercel and set the project root to `admin`. Use `npm run build` as the build command and `dist` as the output directory. Add all `VITE_FIREBASE_*` values from `.env.example` as Vercel environment variables for the deployment environment, then deploy. No live deployment has been made from this workspace.
