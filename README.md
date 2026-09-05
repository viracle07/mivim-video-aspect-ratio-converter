# MiVim Video Aspect Ratio Converter

MiVim is a production-shaped Next.js SaaS application for uploading videos, fitting them into target aspect ratios without cropping, tracking conversion history, and managing subscriptions.

## Stack

- Next.js App Router, React, JavaScript, Tailwind CSS
- Firebase Authentication with signed server sessions
- Firestore sync for profiles and conversion records, with an offline local cache
- IndexedDB for on-device source and converted video storage
- Signed Cloudinary backups for completed outputs, with local fallback
- Paystack subscriptions, verification, and signed webhooks
- Browser-based FFmpeg video processing
- Adaptive blurred or custom-colour canvases, 720p/1080p quality, and selectable frame rates
- Protected dashboard, billing, upload, history, and admin areas
- Three free video uploads per account, enforced server-side with Firestore
- Server-verified paid conversion access tied to the signed-in Paystack customer
- Paystack renewal, failed-invoice, non-renewing, and cancellation lifecycle sync
- Platform admin dashboard for users, subscriptions, usage, access controls, and audit logs

## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in Firebase and Paystack values.
3. Run locally: `npm run dev`
4. Open `http://localhost:3000`

## Firebase Setup

1. Create a Firebase project and add a Web app from Project settings.
2. Enable Email/Password and Google providers under Authentication.
3. Create a Firestore database. Video backups use Cloudinary, so Firebase Storage is not required.
4. Add the six Web app configuration values to `.env.local`.
5. Run `npm run firebase:login`, then deploy the Firestore rules.
6. Restart MiVim after changing `.env.local`.

Without these values, MiVim clearly runs in local preview mode. Real Firebase accounts, Google sign-in, and cross-device Firestore synchronization activate only after setup is complete.

Run `npm run build` before deployment. With the app running, `npm run test:smoke` checks the public pages, protected routes, session security, and Paystack webhook guard.

Paystack checkout activates after `PAYSTACK_SECRET_KEY`, `PAYSTACK_PLAN_MONTHLY`, and `PAYSTACK_PLAN_YEARLY` are configured. Amount values use the currency subunit and are verified when supplied.

Create monthly and annual subscription plans in the Paystack dashboard, then add their `PLN_...` codes to `.env.local`. For local tests, use Paystack test keys and test plan codes.

Set `SESSION_SECRET` to a long random value before production deployment. Production sessions require Firebase authentication, and administrator access is limited to the comma-separated addresses in `ADMIN_EMAILS`.

## Deployment

Deploy the Next.js app to Vercel and configure `SESSION_SECRET`, the Firebase browser and Admin variables, `PAYSTACK_SECRET_KEY`, both Paystack plan codes, and `ADMIN_EMAILS`. Keep `FIREBASE_ADMIN_PRIVATE_KEY` quoted with escaped newlines. Register `https://your-domain.com/api/paystack/webhook` as the webhook URL in Paystack.

Video conversion and media storage currently run in each user's browser. Profile details and conversion metadata sync through Firestore when Firebase is configured, while video files stay on-device.

When Cloudinary is configured, completed outputs are also uploaded through a signed server-authorized request. MiVim keeps a local copy when cloud upload is unavailable or exceeds the account's file-size limit.
