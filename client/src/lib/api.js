/** API client — JSON, cookies, auto-refresh sekali pada 401 (docs/API.md §1). */
const BASE = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body, formData } = {}, allowRetry = true) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: formData ? undefined : body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 401 && allowRetry && !path.startsWith('/auth/')) {
    const refreshed = await fetch(BASE + '/auth/refresh', { method: 'POST', credentials: 'include' });
    if (refreshed.ok) return request(path, { method, body, formData }, false);
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) throw new ApiError(data.message || 'Terjadi kesalahan. Coba lagi.', res.status, data.errors);
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', formData }),
};
