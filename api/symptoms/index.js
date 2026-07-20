import { handleSymptoms } from '../../server-lib/handlers/symptoms.js';

export default function handler(req, res) {
  return handleSymptoms(req, res);
}
