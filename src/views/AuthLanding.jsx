import React from 'react';

export default function AuthLanding({ supabase }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-10">
      <div className="max-w-md w-full space-y-6 bg-card rounded-2xl border border-foreground/5 p-8 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold">Log in or sign up</h2>
          <p className="text-muted text-sm">
            Sign in to sync your meal journal, profile, and symptom history.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin },
              })
            }
            className="btn-primary w-full h-12"
          >
            Log in with Google
          </button>

          <button
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin,
                  // Hint to Google to let the user pick an account.
                  queryParams: { prompt: 'select_account' },
                },
              })
            }
            className="btn-secondary w-full h-12"
          >
            Sign up with Google
          </button>
        </div>
      </div>
    </div>
  );
}

