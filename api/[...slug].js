import { dispatchApi } from '../server-lib/dispatchApi.js';

export default async function handler(req, res) {
  return dispatchApi(req, res, req.query.slug);
}
