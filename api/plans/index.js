import { handlePlans } from '../../server-lib/handlers/plans.js';

export default function handler(req, res) {
  return handlePlans(req, res, []);
}
