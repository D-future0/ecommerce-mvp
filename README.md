# Ecommerce MVP — Phase 4: Shipping, Images, Emails

## Stack
Next.js 16 (App Router, React 19) · TypeScript · Tailwind CSS · Neon Postgres (Prisma) · Auth.js (NextAuth, JWT) · Redis (ioredis) · Paystack · Resend · Cloudinary

## What's built

### Phase 1 — Auth & data models
Models, Auth.js credentials+JWT, `/login` + `/register`, Redis rate limiting, route middleware.

### Phase 2 — Catalog, product page, cart, wishlist
`/category/[slug]`, `/search`, `/product/[slug]`, `/cart`, `/account/wishlist`, header cart badge.

### Phase 3 — Checkout, payments, admin dashboard
`/checkout` → Paystack → webhook + verify-on-return fallback, idempotent order fulfillment, `/admin` dashboard with product/category/order CRUD.

### Phase 4 — Real shipping rates, image uploads, transactional email *(new)*

**Shipping (`src/lib/shipping.ts`)**
- Zone-based Nigerian rates modeled on observed 2026 courier pricing (GIG Logistics-style: same-city ₦3,000–5,000, interstate ₦4,500–9,000 depending on route, plus their flat ₦700 door-to-door surcharge):
  - **Lagos** (intra-city): ₦3,500 + ₦700 surcharge = **₦4,200**
  - **Zone 1** — Ogun, Oyo, Osun: **₦5,200**
  - **Zone 2** — Ondo, Ekiti, Edo, Delta, Rivers, Abuja (FCT), Anambra, Enugu, Imo, Abia: **₦7,200**
  - **Zone 3** — everywhere else in Nigeria: **₦9,200**
  - Non-Nigerian addresses fall back to the top tier rather than silently undercharging.
- This is a **static approximation**, not a live carrier quote — good enough to launch with, but swap `getShippingFee()` for a real carrier-rate API (GIG Logistics has one) once volume justifies it.
- `/checkout` now has a real Nigerian-states dropdown and shows the computed shipping fee + total live as the customer picks their state.

**Cloudinary image uploads**
- `POST /api/admin/upload` — validates type (JPEG/PNG/WebP/GIF) and size (≤8MB), uploads to Cloudinary, returns the secure URL. Rate-limited per admin.
- Both `/admin/products/*` and `/admin/categories/*` forms now have an "Upload image(s)" button alongside the URL field — pick a file, it uploads and the URL drops into the field automatically, with a thumbnail preview. Pasting a URL directly still works too.

**Resend transactional email (`src/lib/email.ts`)**
- Order confirmation sent automatically from `markOrderPaid()` — fires from both the webhook and the verify-on-return fallback, so it always sends exactly once regardless of which path confirmed the payment.
- Shipping-update email sent when an admin moves an order to `shipped` or `delivered` in `/admin/orders/[id]`.
- **Fails safe**: if `RESEND_API_KEY` isn't set, email sending no-ops instead of crashing checkout — this actually broke the build the first time I wired it in (the Resend SDK throws at import time on a missing key, not just at send time), so it's now lazily initialized and confirmed working both with and without the key set.

## Setup
```bash
cp .env.example .env.local   # add your Neon and service credentials
pnpm install
pnpm run db:migrate
pnpm run seed
pnpm run dev
```

Set `DATABASE_URL` to Neon's pooled connection string (the hostname contains `-pooler`) and `DIRECT_URL` to Neon's direct, unpooled connection string. Prisma uses the pooled URL for app queries and the direct URL for migrations. Configure `NEXTAUTH_SECRET`, Redis, Paystack, Resend, and Cloudinary as needed; `ADMIN_EMAIL` / `ADMIN_PASSWORD` are optional seed settings. Resend requires the `RESEND_FROM_EMAIL` domain to be verified in your Resend account before it'll send.

### Moving existing data from MongoDB

The one-time importer copies users, categories, collections, products, orders, carts, reviews, and banners while preserving MongoDB ObjectId values as string IDs. Before running it, take a MongoDB backup, set `MONGODB_URI` to the source database, and confirm the Neon database is empty. Then run:

```bash
pnpm run db:migrate
pnpm run migrate:mongodb
```

The importer refuses to run against a non-empty Neon database; it does not delete or alter the MongoDB source. Review the copied record counts before switching traffic. `MONGODB_URI` is only needed for this import and is not used by the application.

## Not built yet
This closes out everything in the original feature list. What's left is genuinely "launch polish," not missing functionality:
1. **Live carrier rates** — replace the static shipping table with a real GIG Logistics (or similar) API call once you have an account with them.
2. **Order cancellation/refunds** — the status enum supports `cancelled`/`refunded` and the admin can set them, but there's no Paystack refund API call wired up yet.
3. **Product image deletion from Cloudinary** — deleting a product doesn't currently delete its Cloudinary assets (cheap to add with `cloudinary.uploader.destroy`, low priority for an MVP).
4. **Pagination on `/admin/orders` and `/admin/products`** — currently capped at 200/all respectively, fine until the catalog or order volume grows significantly.
