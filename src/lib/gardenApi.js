function apiBase() {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
    ? ''
    : window.location.origin;
}

export async function fetchGarden(accessToken) {
  const res = await fetch(`${apiBase()}/api/garden`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Garden load failed (${res.status})`);
  }
  return data;
}
