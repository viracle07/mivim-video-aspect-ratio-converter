# MiVim Video Aspect Ratio Converter

MiVim is a production-shaped Next.js SaaS application for uploading videos, converting them to target aspect ratios, tracking conversion history, and managing subscriptions.

## Stack

- Next.js App Router, React, JavaScript, Tailwind CSS
- Firebase Authentication with signed server sessions
- Firestore sync for profiles and conversion records, with an offline local cache
- IndexedDB for on-device source and converted video storage
- Paystack subscriptions, verification, and signed webhooks
- Browser-based FFmpeg video processing
- Protected dashboard, billing, upload, history, and admin areas

## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in Firebase and Paystack values.
3. Run locally: `npm run dev`
4. Open `http://localhost:3000`

Run `npm run build` before deployment. With the app running, `npm run test:smoke` checks the public pages, protected routes, session security, and Paystack webhook guard.

Paystack checkout activates after `PAYSTACK_SECRET_KEY`, `PAYSTACK_PLAN_MONTHLY`, and `PAYSTACK_PLAN_YEARLY` are configured. Amount values use the currency subunit and are verified when supplied.

Create monthly and annual subscription plans in the Paystack dashboard, then add their `PLN_...` codes to `.env.local`. For local tests, use Paystack test keys and test plan codes.

Set `SESSION_SECRET` to a long random value before production deployment. Production sessions require Firebase authentication, and administrator access is limited to the comma-separated addresses in `ADMIN_EMAILS`.

## Deployment

Deploy the Next.js app to Vercel and configure `SESSION_SECRET`, the Firebase variables, `PAYSTACK_SECRET_KEY`, both Paystack plan codes, and `ADMIN_EMAILS`. Register `https://your-domain.com/api/paystack/webhook` as the webhook URL in Paystack.

Video conversion and media storage currently run in each user's browser. Profile details and conversion metadata sync through Firestore when Firebase is configured, while video files stay on-device.
