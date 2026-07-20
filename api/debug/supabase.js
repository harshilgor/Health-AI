import { handleDebugSupabase } from '../../server-lib/handlers/debugSupabase.js';

export default function handler(req, res) {
  return handleDebugSupabase(req, res);
}
