import { handleMeals } from '../../server-lib/handlers/meals.js';

export default function handler(req, res) {
  const mealId = req.query.mealId;
  return handleMeals(req, res, mealId ? [mealId] : []);
}
