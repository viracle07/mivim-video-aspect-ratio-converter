# MiVim Video Aspect Ratio Converter

MiVim is a production-shaped Next.js SaaS application for uploading videos, converting them to target aspect ratios, tracking conversion history, and managing subscriptions.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Firebase Authentication, Firestore, Firebase Storage
- Stripe checkout and webhooks
- FFmpeg-compatible processing service integration
- Protected dashboard, billing, upload, history, and admin areas

## Getting Started

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env.local` and fill in Firebase, Stripe, and processing service values.
3. Run locally: `pnpm dev`
4. Open `http://localhost:3000`

The app includes local-safe fallback behavior for early development. Real Firebase and Stripe features activate when the required environment variables are present.

## Deployment

Deploy the Next.js app to Vercel, configure all environment variables, deploy the FFmpeg processing worker to Cloud Run or an equivalent service, then point `PROCESSING_SERVICE_URL` to that worker.
