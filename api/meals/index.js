import { handleMeals } from '../../server-lib/handlers/meals.js';

export default function handler(req, res) {
  return handleMeals(req, res, []);
}
