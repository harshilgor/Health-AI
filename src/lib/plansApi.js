function apiBase() {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
    ? ''
    : window.location.origin;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function listPlans(token) {
  const res = await fetch(`${apiBase()}/api/plans`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Plans load failed (${res.status})`);
  return data.plans || [];
}

export async function getPlanDetail(token, slug) {
  const res = await fetch(`${apiBase()}/api/plans/${encodeURIComponent(slug)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Plan detail failed (${res.status})`);
  return data;
}

export async function enrollInPlan(token, planId) {
  const res = await fetch(`${apiBase()}/api/plans/enroll`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ plan_id: planId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Enrollment failed (${res.status})`);
  return data;
}

export async function getActivePlan(token) {
  const res = await fetch(`${apiBase()}/api/plans/active`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Active plan load failed (${res.status})`);
  return data.active;
}

export async function getPlanProgress(token) {
  const res = await fetch(`${apiBase()}/api/plans/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Progress load failed (${res.status})`);
  return data;
}

export async function completeMealForPlan(token, mealId) {
  const res = await fetch(`${apiBase()}/api/plans/complete-meal`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ meal_id: mealId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Complete meal failed (${res.status})`);
  return data;
}

export async function suggestPlanMeal(token, mealSlot) {
  const res = await fetch(`${apiBase()}/api/plans/suggest-meal?meal_slot=${encodeURIComponent(mealSlot)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Suggestion failed (${res.status})`);
  return data;
}

export async function getAchievements(token) {
  const res = await fetch(`${apiBase()}/api/plans/achievements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Achievements load failed (${res.status})`);
  return data.badges || [];
}

export async function quitPlan(token) {
  const res = await fetch(`${apiBase()}/api/plans/quit`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Quit failed (${res.status})`);
  return data;
}
