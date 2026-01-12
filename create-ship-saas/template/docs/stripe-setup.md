# Stripe Setup Guide

Complete guide for configuring Stripe payments in your application.

## Prerequisites

- A Stripe account ([sign up here](https://dashboard.stripe.com/register))
- Node.js 18+ installed
- The application running locally

## 1. Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **API Keys**
3. Copy your **Publishable key** and **Secret key**

For development, use test mode keys (starting with `pk_test_` and `sk_test_`).

## 2. Configure Environment Variables

Add these to your `.env` file:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhook Secret (see step 4)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 3. Create Products and Prices

### Via Stripe Dashboard

1. Go to **Products** in the Stripe Dashboard
2. Click **Add Product**
3. Create products for each plan:

| Product | Monthly Price | Yearly Price |
|---------|--------------|--------------|
| Plus    | $9/month     | $90/year     |
| Pro     | $29/month    | $290/year    |

4. Copy the Price IDs and add to `.env`:

```env
STRIPE_PRICE_ID_PLUS_MONTHLY=price_...
STRIPE_PRICE_ID_PLUS_YEARLY=price_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
```

### Via Stripe CLI (Alternative)

```bash
# Create Plus plan
stripe products create --name="Plus Plan"
stripe prices create \
  --product=prod_xxx \
  --unit-amount=900 \
  --currency=usd \
  --recurring[interval]=month

# Create Pro plan
stripe products create --name="Pro Plan"
stripe prices create \
  --product=prod_yyy \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month
```

## 4. Configure Webhooks

### Local Development

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_`) to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Production

1. Go to **Developers** > **Webhooks** in Stripe Dashboard
2. Click **Add Endpoint**
3. Enter your production URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `charge.refunded`

5. Copy the signing secret to your production environment variables

## 5. Test the Integration

### Test Checkout Flow

1. Start your development server
2. Navigate to `/pricing`
3. Click on a plan to start checkout
4. Use Stripe test cards:
   - **Success**: `4242 4242 4242 4242`
   - **Declined**: `4000 0000 0000 0002`
   - **Requires Auth**: `4000 0025 0000 3155`

### Verify Webhook Events

Watch the Stripe CLI output to see webhook events being received:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

You should see events like:
```
2024-01-15 10:30:00  --> checkout.session.completed [evt_xxx]
2024-01-15 10:30:01  <-- [200] POST http://localhost:3000/api/webhooks/stripe
```

## 6. Customer Portal

The customer portal allows users to:
- View and update payment methods
- View invoice history
- Cancel or modify subscriptions

Configure it in Stripe Dashboard:

1. Go to **Settings** > **Billing** > **Customer portal**
2. Enable the features you want
3. Customize the portal appearance

Users access the portal via the billing settings page at `/settings/billing`.

## 7. Dunning Management

The application includes automated dunning for failed payments:

| Day | Action |
|-----|--------|
| 0   | Payment failed email sent |
| 3   | Reminder email sent |
| 7   | Final warning email sent |
| 10  | Subscription suspended |

Configure cron jobs to run these:

```env
CRON_SECRET=your-cron-secret-here
```

Set up cron jobs to call:
- `POST /api/cron/send-dunning-emails` - Daily
- `POST /api/cron/suspend-subscriptions` - Daily

## 8. Promotional Codes

Create promo codes in Stripe Dashboard:

1. Go to **Products** > **Coupons**
2. Create a coupon (percentage or fixed amount)
3. Create a promotion code for the coupon

Users can apply promo codes during checkout.

## Troubleshooting

### Webhooks Not Received

1. Check Stripe CLI is running
2. Verify the webhook URL is correct
3. Check the signing secret matches
4. Look for errors in your server logs

### Checkout Fails

1. Verify Price IDs are correct
2. Check Stripe API keys are set
3. Ensure the user is authenticated
4. Check browser console for errors

### Subscription Not Created

1. Verify webhook events are being processed
2. Check database for the subscription record
3. Look for errors in webhook handler logs

## Security Considerations

- **Never expose** your secret key in client-side code
- **Always verify** webhook signatures
- **Use HTTPS** in production
- **Rate limit** checkout creation to prevent abuse
- Store only necessary customer data
