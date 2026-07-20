import http from 'http';
import { loadEnvFiles } from './loadEnv.mjs';
import { dispatchApi } from '../server-lib/dispatchApi.js';

loadEnvFiles();

const PORT = Number(process.env.API_PORT || 3001);

function createVercelLikeResponse(nodeRes) {
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      nodeRes.setHeader(name, value);
      return this;
    },
    json(payload) {
      if (!nodeRes.headersSent) {
        nodeRes.statusCode = this.statusCode || 200;
        nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      nodeRes.end(JSON.stringify(payload));
    },
    end(body) {
      nodeRes.statusCode = this.statusCode || 200;
      nodeRes.end(body);
    },
  };
  return response;
}

async function readBody(nodeReq) {
  const chunks = [];
  for await (const chunk of nodeReq) chunks.push(chunk);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const server = http.createServer(async (nodeReq, nodeRes) => {
  try {
    const host = nodeReq.headers.host || `localhost:${PORT}`;
    const url = new URL(nodeReq.url || '/', `http://${host}`);

    if (!url.pathname.startsWith('/api/')) {
      nodeRes.statusCode = 404;
      nodeRes.end('Not found');
      return;
    }

    const slug = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const req = {
      method: nodeReq.method,
      headers: nodeReq.headers,
      query: Object.fromEntries(url.searchParams.entries()),
      body: await readBody(nodeReq),
    };
    const res = createVercelLikeResponse(nodeRes);
    await dispatchApi(req, res, slug);
  } catch (err) {
    console.error('API server error:', err);
    if (!nodeRes.headersSent) {
      nodeRes.statusCode = 500;
      nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
      nodeRes.end(JSON.stringify({ error: err.message || 'Internal server error' }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`[dev-api] listening on http://localhost:${PORT}`);
});
