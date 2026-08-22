# 1 Million Adverts

Public **1000×1000** pixel billboard. Buyers drag a block (min **10×10**), pay with Stripe, and their link paints on the canvas forever.

## How pixels work

- Logical board: 1,000,000 pixels
- UI draws sold blocks on a canvas (not 1M DOM nodes)
- Selection snaps to a 10px grid
- Overlaps with paid/recent-pending blocks are rejected
- Price starts at **1p/pixel** and rises as fill % increases

## Local setup

```bash
npm install
npx prisma db push
npm run dev
```

1. Put Stripe **test** keys in `.env`
2. `stripe listen --forward-to localhost:3000/api/webhook/stripe`
3. Paste webhook secret into `STRIPE_WEBHOOK_SECRET`

## Go live

1. Buy/point `1millionadverts.com` DNS
2. Deploy on Coolify (Next.js). Mount a volume for SQLite or switch `DATABASE_URL` to MySQL
3. Stripe webhook → `https://1millionadverts.com/api/webhook/stripe` for `checkout.session.completed`
4. Set `NEXT_PUBLIC_SITE_URL=https://1millionadverts.com`
5. Launch on X / Reddit / HN — empty boards don't sell themselves
