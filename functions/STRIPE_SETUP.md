# Stripe Billing (AI Import Plus) — go-live

## Product
- **Plus** = unlimited shared AI imports (`aiImportPlan: 'plus'`; legacy `'pro'` still honored)
- Free = 10 shared AI imports; personal Gemini key = allowlisted emails only
- Price: **$4.99/month** (Stripe product: GroceryLister Plus)

AI import + Checkout are open to **all signed-in users**.

## Live cutover (do once)

### 1) Create live Product / Price / Webhook
From `functions/`:

```powershell
$env:STRIPE_SECRET_KEY="sk_live_..."
node scripts/setupLiveStripe.js
```

Or create manually in Stripe Dashboard (**Live** mode):
- Product: GroceryLister Plus
- Price: $4.99 / month
- Webhook URL: `https://us-central1-grocerylister-b107b.cloudfunctions.net/stripeWebhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 2) Set Firebase secrets + price
```powershell
firebase functions:secrets:set STRIPE_SECRET_KEY
# paste sk_live_…

firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# paste live whsec_…
```

`functions/.env`:
```
STRIPE_PRICE_ID=price_LIVE_xxx
APP_PUBLIC_URL=https://web.grocerylisterapp.com
STRIPE_REQUIRE_LIVE=true
```

### 3) Customer Portal (Live mode)
Stripe Dashboard → Settings → Billing → Customer portal:
- Cancel subscription
- Update payment method

### 4) Deploy
```powershell
npm run deploy:functions
npm run build
npx firebase-tools deploy --only hosting:app,firestore:rules
```

### 5) Smoke test
1. Account → Upgrade to Plus → pay
2. Account shows Plan: Plus
3. Manage billing → cancel → still Plus until period end

### 6) Budgets
- Google Cloud billing alert
- Gemini / AI Studio usage alert
