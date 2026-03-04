import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error-handler.js';

const FLOUCI_BASE_URL = 'https://developers.flouci.com/api';
const FLOUCI_SESSION_TIMEOUT_SECS = 1200;
const FLOUCI_AMOUNT_UNIT_MULTIPLIER = 1000; // Flouci expects millimes (1 TND = 1000 millimes)

function toFlouciAmount(amount) {
  return Math.round(Number(amount) * FLOUCI_AMOUNT_UNIT_MULTIPLIER);
}

export async function createSession(payment) {
  const response = await fetch(`${FLOUCI_BASE_URL}/generate_payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_token: env.flouci.appToken,
      app_secret: env.flouci.appSecret,
      amount: toFlouciAmount(payment.amount),
      accept_card: 'true',
      session_timeout_secs: FLOUCI_SESSION_TIMEOUT_SECS,
      success_link: `${env.clientUrl}/payment/success?paymentId=${payment.id}`,
      fail_link: `${env.clientUrl}/payment/fail?paymentId=${payment.id}`,
      developer_tracking_id: payment.id,
    }),
  });

  const data = await response.json();
  if (!data.result?.success) throw new AppError('Failed to initiate payment', 400);

  return { paymentId: data.result.payment_id, link: data.result.link };
}

export async function verifySession(providerTxId) {
  const response = await fetch(`${FLOUCI_BASE_URL}/verify_payment/${providerTxId}`, {
    headers: {
      'Content-Type': 'application/json',
      apppublic: env.flouci.appToken,
      appsecret: env.flouci.appSecret,
    },
  });

  const data = await response.json();
  return { success: data.result?.status === 'SUCCESS' };
}
