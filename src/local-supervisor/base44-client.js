/* eslint-disable */
// Lightweight Base44 API client using only Node built-ins (fetch available in Node 18+)
const config = require('./config');

const BASE_URL = config.base44.apiUrl;
const HEADERS = {
  'Content-Type': 'application/json',
  'X-App-Id': config.base44.appId,
  'Authorization': `Bearer ${config.base44.serviceToken}`,
};

async function apiRequest(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Base44 API ${method} ${path} failed (${res.status}): ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Entity operations
const entities = {
  async list(entityName, sortBy, limit) {
    const params = new URLSearchParams();
    if (sortBy) params.set('sort_by', sortBy);
    if (limit) params.set('limit', String(limit));
    return apiRequest('GET', `/entities/${entityName}?${params}`);
  },

  async filter(entityName, filters, sortBy, limit) {
    const params = new URLSearchParams();
    if (sortBy) params.set('sort_by', sortBy);
    if (limit) params.set('limit', String(limit));
    params.set('filters', JSON.stringify(filters));
    return apiRequest('GET', `/entities/${entityName}?${params}`);
  },

  async create(entityName, data) {
    return apiRequest('POST', `/entities/${entityName}`, data);
  },

  async update(entityName, id, data) {
    return apiRequest('PUT', `/entities/${entityName}/${id}`, data);
  },
};

module.exports = { entities };