import 'dotenv/config';

const timeout = Number.parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '90000', 10);

export const aiConfig = Object.freeze({
  serviceUrl: (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8100').replace(/\/$/, ''),
  serviceToken: process.env.AI_SERVICE_TOKEN || '',
  requestTimeoutMs: Number.isFinite(timeout) ? Math.min(Math.max(timeout, 1000), 180000) : 90000,
  includeClinicalNotes: process.env.AI_INCLUDE_CLINICAL_NOTES === 'true',
});
