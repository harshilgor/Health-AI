export function getAuthRedirectUrl() {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL || '').trim();
  if (configured) return configured;
  return window.location.origin;
}

