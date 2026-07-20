import { handleProfile } from '../../server-lib/handlers/profile.js';

export default function handler(req, res) {
  return handleProfile(req, res);
}
