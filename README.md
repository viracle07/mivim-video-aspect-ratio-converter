# MiVim Video Aspect Ratio Converter

MiVim is a production-shaped Next.js SaaS application for uploading videos, converting them to target aspect ratios, tracking conversion history, and managing subscriptions.

## Stack

- Next.js App Router, React, JavaScript, Tailwind CSS
- Firebase Authentication, Firestore, Firebase Storage
- Paystack subscriptions, verification, and signed webhooks
- Browser-based FFmpeg video processing
- Protected dashboard, billing, upload, history, and admin areas

## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in Firebase and Paystack values.
3. Run locally: `npm run dev`
4. Open `http://localhost:3000`

Paystack checkout activates after `PAYSTACK_SECRET_KEY`, `PAYSTACK_PLAN_MONTHLY`, and `PAYSTACK_PLAN_YEARLY` are configured. Amount values use the currency subunit and are verified when supplied.

Create monthly and annual subscription plans in the Paystack dashboard, then add their `PLN_...` codes to `.env.local`. For local tests, use Paystack test keys and test plan codes.

Set `SESSION_SECRET` to a long random value before production deployment. Production sessions require Firebase authentication, and administrator access is limited to the comma-separated addresses in `ADMIN_EMAILS`.

## Deployment

Deploy the Next.js app to Vercel, configure all environment variables, and register `/api/paystack/webhook` as the Paystack webhook URL.
