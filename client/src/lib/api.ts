const API_BASE = '/api/v1';

export async function fetchJson(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('waitwise_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`API returned non-JSON response (${response.status}): ${text.slice(0, 120)}`);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed.');
  }
  return data;
}

// Authentication
export async function apiLogin(credentials: { email: string; password: string }) {
  return fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function apiGetCurrentUser() {
  return fetchJson('/auth/me');
}

// Kiosk
export async function apiGetKioskData(tenantSlug: string) {
  return fetchJson(`/kiosk/${tenantSlug}/data`);
}

export async function apiIssueToken(payload: { tenantSlug: string; serviceTypeId: string; customerName?: string }) {
  return fetchJson('/kiosk/tokens', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Admin / Business Staff
export async function apiGetLiveQueue() {
  return fetchJson('/admin/queue');
}

export async function apiAdvanceQueue(counterId: string) {
  return fetchJson('/admin/queue/next', {
    method: 'POST',
    body: JSON.stringify({ counterId }),
  });
}

export async function apiToggleCounter(counterId: string, isActive: boolean) {
  return fetchJson('/admin/counters/status', {
    method: 'PATCH',
    body: JSON.stringify({ counterId, isActive }),
  });
}

export async function apiTokenAction(tokenId: string, action: string, counterId?: string) {
  return fetchJson('/admin/tokens/action', {
    method: 'POST',
    body: JSON.stringify({ tokenId, action, counterId }),
  });
}

export async function apiGetAnalytics() {
  return fetchJson('/admin/analytics');
}

// Customer Public Portal
export async function apiGetPublicTokenStatus(tenantSlug: string, tokenId: string) {
  return fetchJson(`/public/tokens/${tenantSlug}/${tokenId}`);
}

export async function apiAskAi(tokenId: string, question: string) {
  return fetchJson('/public/tokens/ask-ai', {
    method: 'POST',
    body: JSON.stringify({ tokenId, question }),
  });
}
