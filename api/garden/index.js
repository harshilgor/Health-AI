import { handleGarden } from '../../server-lib/handlers/garden.js';

export default function handler(req, res) {
  return handleGarden(req, res);
}
