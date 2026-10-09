import { onRequest } from "firebase-functions/v2/https";
import { handlePayPalWebhookHttp } from "../src/functions/paypalWebhookHandler";

/**
 * Firebase Cloud Function: paypalWebhook
 * Processes incoming PayPal webhooks securely:
 * - Verifies webhook signature against PayPal REST API
 * - Directly updates user subscription in Firestore
 * - Protects API keys and secrets entirely on backend
 */
export const paypalWebhook = onRequest(
  {
    cors: true,
    region: "us-central1",
    maxInstances: 10,
  },
  async (req, res) => {
    await handlePayPalWebhookHttp(req as any, res as any);
  }
);
