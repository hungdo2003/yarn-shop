const axios = require('axios');
const crypto = require('crypto');

const CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const API_KEY = process.env.PAYOS_API_KEY;
const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;
const BASE_URL = 'https://api-merchant.payos.vn';

function createSignature(data) {
  // Sort keys alphabetically, build query string, sign with HMAC-SHA256
  const sortedKeys = Object.keys(data).sort();
  const str = sortedKeys.map(k => `${k}=${data[k]}`).join('&');
  return crypto.createHmac('sha256', CHECKSUM_KEY).update(str).digest('hex');
}

async function createPaymentLink({ orderCode, amount, description, items, returnUrl, cancelUrl, expiredAt, buyerName, buyerEmail, buyerPhone }) {
  const signData = { amount, cancelUrl, description, orderCode, returnUrl };
  const signature = createSignature(signData);

  const body = { orderCode, amount, description, items, returnUrl, cancelUrl, signature, expiredAt };
  if (buyerName) body.buyerName = buyerName;
  if (buyerEmail) body.buyerEmail = buyerEmail;
  if (buyerPhone) body.buyerPhone = buyerPhone;

  const res = await axios.post(`${BASE_URL}/v2/payment-requests`, body, {
    headers: { 'x-client-id': CLIENT_ID, 'x-api-key': API_KEY, 'Content-Type': 'application/json' }
  });

  if (res.data.code !== '00') throw new Error(res.data.desc || 'PayOS error');
  return res.data.data; // { checkoutUrl, paymentLinkId, ... }
}

async function getPaymentLinkInfo(orderCode) {
  const res = await axios.get(`${BASE_URL}/v2/payment-requests/${orderCode}`, {
    headers: { 'x-client-id': CLIENT_ID, 'x-api-key': API_KEY }
  });
  if (res.data.code !== '00') throw new Error(res.data.desc || 'PayOS error');
  return res.data.data;
}

async function cancelPaymentLink(orderCode, reason = 'Cancelled') {
  const res = await axios.delete(`${BASE_URL}/v2/payment-requests/${orderCode}`, {
    headers: { 'x-client-id': CLIENT_ID, 'x-api-key': API_KEY },
    data: { cancellationReason: reason }
  });
  return res.data;
}

function verifyWebhookData(body) {
  const { data, signature } = body;
  if (!data || !signature) throw new Error('Invalid webhook body');

  // Rebuild signature from data fields
  const signData = { ...data };
  delete signData.signature;
  const expected = createSignature(signData);

  if (expected !== signature) throw new Error('Invalid webhook signature');
  return data;
}

module.exports = { createPaymentLink, getPaymentLinkInfo, cancelPaymentLink, verifyWebhookData };
