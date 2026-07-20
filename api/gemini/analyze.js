import { handleGeminiAnalyze } from '../../server-lib/handlers/geminiAnalyze.js';

export default function handler(req, res) {
  return handleGeminiAnalyze(req, res);
}
