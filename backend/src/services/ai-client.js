import { aiConfig } from '../config/ai.js';
import { ApiError } from '../utils/api-error.js';

async function request(path, { method = 'GET', body } = {}) {
  if (!aiConfig.serviceToken || aiConfig.serviceToken.length < 32) {
    throw new ApiError(503, 'The internal AI service token is not configured.', {
      code: 'AI_SERVICE_TOKEN_MISSING',
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);

  try {
    const response = await fetch(`${aiConfig.serviceUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-ai-service-token': aiConfig.serviceToken,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    let payload = null;
    try { payload = await response.json(); } catch { /* do not expose raw response */ }

    if (!response.ok) {
      const detail = payload?.detail;
      const message = typeof detail === 'string'
        ? detail
        : detail?.message || 'The AI service could not complete this request.';
      const status = response.status === 422
        ? 400
        : (response.status === 401 || response.status === 403)
          ? 503
          : response.status;
      throw new ApiError(status, message, {
        code: detail?.code || 'AI_SERVICE_ERROR',
        ...(Array.isArray(detail?.models) ? { models: detail.models } : {}),
      });
    }

    return payload?.data ?? payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'AbortError') {
      throw new ApiError(503, 'The AI service request timed out. No prediction was returned.', {
        code: 'AI_SERVICE_TIMEOUT',
      });
    }
    throw new ApiError(503, 'The AI model service is unavailable. No prediction was returned.', {
      code: 'AI_SERVICE_UNAVAILABLE',
    });
  } finally {
    clearTimeout(timer);
  }
}

export const aiClient = {
  getModels: () => request('/v1/models'),
  assess: (payload) => request('/v1/risk-assessments', { method: 'POST', body: payload }),
};
