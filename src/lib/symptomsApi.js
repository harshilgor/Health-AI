function apiBase() {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
    ? ''
    : window.location.origin;
}

export async function listSymptoms(accessToken) {
  const res = await fetch(`${apiBase()}/api/symptoms`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Failed to load symptoms (${res.status})`);
  }
  return data.logs || [];
}

export async function createSymptom(accessToken, symptom) {
  const res = await fetch(`${apiBase()}/api/symptoms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      energy: symptom.energy,
      mood: symptom.mood,
      digestion: symptom.digestion,
      notes: symptom.notes,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Failed to save symptom (${res.status})`);
  }
  return data.log || null;
}

