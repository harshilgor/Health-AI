function apiBase() {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
    ? ''
    : window.location.origin;
}

export async function getProfile(accessToken) {
  const res = await fetch(`${apiBase()}/api/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(data.error || data.message || `Failed to load profile (${res.status})`);
  return data;
}

export async function saveProfile(accessToken, profile) {
  const payload = {
    goal: profile.goal,
    conditions: profile.conditions,
    age: profile.age,
    sex: profile.sex,
    activity: profile.activity,
    daily_calories: profile.daily_calories,
    protein_target: profile.protein_target,
    fat_target: profile.fat_target,
    carb_target: profile.carb_target,
    fiber_target: profile.fiber_target,
  };

  const res = await fetch(`${apiBase()}/api/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Failed to save profile (${res.status})`);
  return data;
}

