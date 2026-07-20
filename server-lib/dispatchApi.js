import { handleGeminiAnalyze } from './handlers/geminiAnalyze.js';
import { handleDebugSupabase } from './handlers/debugSupabase.js';
import { handleLogmealAnalyze } from './handlers/logmealAnalyze.js';
import { handlePackagedAnalyze } from './handlers/packagedAnalyze.js';
import { handleProfile } from './handlers/profile.js';
import { handleGarden } from './handlers/garden.js';
import { handleSymptoms } from './handlers/symptoms.js';
import { handleMeals } from './handlers/meals.js';
import { handlePlans } from './handlers/plans.js';

function normalizeSlug(slug) {
  if (slug == null) return [];
  if (Array.isArray(slug)) return slug.map(String).filter(Boolean);
  const s = String(slug);
  return s ? [s] : [];
}

export async function dispatchApi(req, res, slug) {
  const parts = normalizeSlug(slug);

  if (parts.length === 0) {
    return res.status(404).json({ error: 'Not found' });
  }

  const [a, b] = parts;

  if (a === 'gemini' && b === 'analyze' && parts.length === 2) {
    return handleGeminiAnalyze(req, res);
  }
  if (a === 'debug' && b === 'supabase' && parts.length === 2) {
    return handleDebugSupabase(req, res);
  }
  if (a === 'logmeal' && b === 'analyze' && parts.length === 2) {
    return handleLogmealAnalyze(req, res);
  }
  if (a === 'packaged' && b === 'analyze' && parts.length === 2) {
    return handlePackagedAnalyze(req, res);
  }

  if (a === 'profile' && parts.length === 1) {
    return handleProfile(req, res);
  }
  if (a === 'garden' && parts.length === 1) {
    return handleGarden(req, res);
  }
  if (a === 'symptoms' && parts.length === 1) {
    return handleSymptoms(req, res);
  }

  if (a === 'meals') {
    return handleMeals(req, res, parts.slice(1));
  }

  if (a === 'plans') {
    return handlePlans(req, res, parts.slice(1));
  }

  return res.status(404).json({ error: 'Not found' });
}
