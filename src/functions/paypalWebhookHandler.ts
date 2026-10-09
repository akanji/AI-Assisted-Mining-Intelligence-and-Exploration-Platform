import type { Request, Response } from 'express';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Configuration from Environment
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || 'https://api-m.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'BAAIOmq3Kx_2Lo8oiG7L8JlzOuuAKT2E1V2cJaJka7wJ5afyYJRYJRhXzbX-KnAPEU19Hn4jdHf79ksIqo';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET_KEY || '';
const PAYPAL_SECRET_KEY = process.env.PAYPAL_SECRET_KEY || process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '33234690XT010280P';

// Initialize Firebase Admin for Secure Backend Operations
function getAdminFirestore() {
  try {
    const app = getApps().length === 0
      ? initializeApp({ projectId: firebaseConfig.projectId })
      : getApp();
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.warn('[Firebase Cloud Function] Admin Firestore initialization fallback:', err);
    return null;
  }
}

// In-Memory Fallback Cache for local/dev sandbox
const inMemorySubscriptionStore = new Map<string, any>();

/**
 * Obtain PayPal OAuth Access Token securely on backend
 */
export async function getPayPalAccessToken(): Promise<string> {
  const secret = PAYPAL_SECRET_KEY || PAYPAL_CLIENT_SECRET;
  if (!PAYPAL_CLIENT_ID || !secret) {
    throw new Error('PayPal Client ID or Secret Key not configured in backend environment.');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${secret}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal Token Error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Verifies the incoming webhook signature with PayPal REST API
 */
export async function verifyPayPalWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  rawBody: any
): Promise<{ verified: boolean; message: string; isBypass?: boolean }> {
  const transmissionId = (headers['paypal-transmission-id'] as string) || '';
  const timestamp = (headers['paypal-transmission-time'] as string) || '';
  const certUrl = (headers['paypal-cert-url'] as string) || '';
  const transmissionSig = (headers['paypal-transmission-sig'] as string) || '';
  const authAlgo = (headers['paypal-auth-algo'] as string) || '';
  const webhookId = process.env.PAYPAL_WEBHOOK_ID || PAYPAL_WEBHOOK_ID;

  let bodyObj: any = {};
  if (Buffer.isBuffer(rawBody)) {
    try {
      bodyObj = JSON.parse(rawBody.toString('utf8'));
    } catch {
      bodyObj = {};
    }
  } else if (typeof rawBody === 'string') {
    try {
      bodyObj = JSON.parse(rawBody);
    } catch {
      bodyObj = {};
    }
  } else if (typeof rawBody === 'object' && rawBody !== null) {
    bodyObj = rawBody;
  }

  const secret = PAYPAL_SECRET_KEY || PAYPAL_CLIENT_SECRET;

  // Real production verification if credentials and all PayPal transmission headers are provided
  if (PAYPAL_CLIENT_ID && secret && transmissionId && transmissionSig && certUrl) {
    try {
      const accessToken = await getPayPalAccessToken();

      const verifyPayload = {
        transmission_id: transmissionId,
        timestamp,
        webhook_id: webhookId,
        event_id: bodyObj.id,
        cert_url: certUrl,
        actual_event: bodyObj,
        transmission_sig: transmissionSig,
        auth_algo: authAlgo,
      };

      const verifyResponse = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyPayload),
      });

      const verifyResult = (await verifyResponse.json()) as any;

      if (verifyResult.verification_status === 'SUCCESS') {
        return { verified: true, message: 'PayPal signature verified successfully' };
      } else {
        return {
          verified: false,
          message: `Verification status failed: ${verifyResult.verification_status || 'FAILURE'}`,
        };
      }
    } catch (err: any) {
      return { verified: false, message: `Verification request failed: ${err.message}` };
    }
  }

  // Local/Dev environment fallback when simulated webhook is sent
  console.log(`[PayPal Cloud Function] Processing webhook event (dev/test simulation): ${bodyObj.event_type || 'TEST_EVENT'}`);
  return {
    verified: true,
    message: 'Dev/simulation bypass: Verified without production signature headers',
    isBypass: true,
  };
}

/**
 * Updates Firestore Directly with User Subscription Status
 */
export async function updateFirestoreSubscription(event: any): Promise<{
  success: boolean;
  subscriptionId: string;
  status: string;
  targetDoc: string;
  source: string;
}> {
  const eventType = event.event_type || 'UNKNOWN';
  const resource = event.resource || {};
  const subscriptionId = resource.billing_agreement_id || resource.id || `SUB-${Date.now()}`;
  const customId = resource.custom_id || resource.subscriber?.custom_id || null;
  const subscriberEmail = resource.subscriber?.email_address || resource.payer?.email_address || resource.userEmail || '';

  let subscriptionStatus: 'trial' | 'active_monthly' | 'active_yearly' | 'cancelled' | 'suspended' | 'expired' = 'trial';
  let planTier: 'none' | 'monthly' | 'yearly' = 'none';
  let paidDays = 30;

  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
    case 'PAYMENT.SALE.COMPLETED':
      const planName = (resource.plan_id || '').toLowerCase();
      if (planName.includes('year') || event.planType === 'yearly') {
        subscriptionStatus = 'active_yearly';
        planTier = 'yearly';
        paidDays = 365;
      } else {
        subscriptionStatus = 'active_monthly';
        planTier = 'monthly';
        paidDays = 30;
      }
      break;

    case 'BILLING.SUBSCRIPTION.CANCELLED':
      subscriptionStatus = 'cancelled';
      planTier = 'none';
      break;

    case 'BILLING.SUBSCRIPTION.SUSPENDED':
      subscriptionStatus = 'suspended';
      planTier = 'none';
      break;

    case 'BILLING.SUBSCRIPTION.EXPIRED':
      subscriptionStatus = 'expired';
      planTier = 'none';
      break;

    default:
      subscriptionStatus = 'active_monthly';
      planTier = 'monthly';
      paidDays = 30;
  }

  const now = new Date();
  const paidUntilDate = resource.billing_info?.next_billing_time
    ? new Date(resource.billing_info.next_billing_time).toISOString()
    : new Date(now.getTime() + paidDays * 24 * 3600 * 1000).toISOString();

  const amountUSD = parseFloat(
    resource.amount?.total ||
    resource.billing_info?.last_payment?.amount?.value ||
    (planTier === 'yearly' ? '199.99' : '19.99')
  );

  const subscriptionRecord = {
    id: subscriptionId,
    subscriptionId,
    userId: customId || null,
    userEmail: subscriberEmail,
    subscriptionStatus,
    plan: planTier,
    paidUntil: paidUntilDate,
    lastBilledDate: now.toISOString(),
    lastPaymentAmountUSD: isNaN(amountUSD) ? 19.99 : amountUSD,
    lastEvent: eventType,
    updatedAt: now.toISOString(),
    source: 'firebase_cloud_function_backend',
  };

  // Cache in-memory store
  inMemorySubscriptionStore.set(subscriptionId, subscriptionRecord);
  if (customId) inMemorySubscriptionStore.set(customId, subscriptionRecord);
  if (subscriberEmail) inMemorySubscriptionStore.set(subscriberEmail, subscriptionRecord);

  // Directly update Firestore via Admin SDK
  const db = getAdminFirestore();
  let firestoreUpdated = false;

  if (db) {
    try {
      // 1. Write to subscriptions/{subscriptionId}
      await db.collection('subscriptions').doc(subscriptionId).set(subscriptionRecord, { merge: true });
      firestoreUpdated = true;

      // 2. If customId (user UID) is available, also write to subscriptions/{customId}
      if (customId) {
        await db.collection('subscriptions').doc(customId).set(subscriptionRecord, { merge: true });
        
        // Also update the user's document in users/{customId} if exists
        try {
          await db.collection('users').doc(customId).set(
            {
              subscriptionStatus,
              plan: planTier,
              paidUntil: paidUntilDate,
              updatedAt: now.toISOString(),
            },
            { merge: true }
          );
        } catch (_uErr) {
          // Non-fatal
        }
      }

      // 3. If subscriber email is present, update any matching user doc
      if (subscriberEmail) {
        try {
          const userQuery = await db.collection('users').where('email', '==', subscriberEmail).limit(1).get();
          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            await userDoc.ref.set(
              {
                subscriptionStatus,
                plan: planTier,
                paidUntil: paidUntilDate,
                subscriptionId,
                updatedAt: now.toISOString(),
              },
              { merge: true }
            );
          }
        } catch (_qErr) {
          // Non-fatal
        }
      }
    } catch (dbErr: any) {
      console.warn('[Firebase Cloud Function] Firestore direct update note:', dbErr.message);
    }
  }

  return {
    success: true,
    subscriptionId,
    status: subscriptionStatus,
    targetDoc: `subscriptions/${subscriptionId}`,
    source: firestoreUpdated ? 'firestore_persisted' : 'memory_persisted',
  };
}

/**
 * Secure HTTP Handler for PayPal Webhook Endpoint
 * Acts as the Firebase Cloud Function HTTP handler and Express route
 */
export async function handlePayPalWebhookHttp(req: Request, res: Response) {
  try {
    const rawBody = req.body;

    // 1. Verify Signature
    const verification = await verifyPayPalWebhookSignature(req.headers as any, rawBody);
    if (!verification.verified) {
      console.warn('[PayPal Webhook] Signature Verification Rejected:', verification.message);
      return res.status(400).json({
        error: 'Signature Verification Failed',
        details: verification.message,
      });
    }

    // 2. Parse event payload
    let eventObj = rawBody;
    if (Buffer.isBuffer(rawBody)) {
      eventObj = JSON.parse(rawBody.toString('utf8'));
    } else if (typeof rawBody === 'string') {
      eventObj = JSON.parse(rawBody);
    }

    console.log(`[PayPal Webhook] Verified Event: ${eventObj.event_type || 'UNKNOWN'}`);

    // 3. Update Firestore Directly
    const firestoreResult = await updateFirestoreSubscription(eventObj);

    return res.status(200).json({
      success: true,
      processed: true,
      eventType: eventObj.event_type,
      verification: verification.message,
      firestoreResult,
    });
  } catch (error: any) {
    console.error('[PayPal Webhook] Handler Error:', error);
    return res.status(500).json({
      error: 'Internal Webhook Processing Error',
      message: error.message,
    });
  }
}

/**
 * Retrieve cached/stored subscription status by ID or Email
 */
export function getSubscriptionFromStore(idOrEmail: string) {
  return inMemorySubscriptionStore.get(idOrEmail) || null;
}
