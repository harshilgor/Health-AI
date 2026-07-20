import { handlePlans } from '../../server-lib/handlers/plans.js';

export default function handler(req, res) {
  const action = req.query.action;
  return handlePlans(req, res, action ? [action] : []);
}
