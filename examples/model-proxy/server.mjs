import http from 'node:http';

const port = Number(process.env.PORT || 8787);
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const allowedOrigin = process.env.ALLOWED_ORIGIN || '';

function json(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': allowedOrigin || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    json(res, 204, {});
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/model-session') {
    json(res, 404, { error: 'Not found' });
    return;
  }

  if (allowedOrigin && req.headers.origin !== allowedOrigin) {
    json(res, 403, { error: 'Origin is not allowed' });
    return;
  }

  if (!apiKey) {
    json(res, 500, { error: 'OPENAI_API_KEY is not configured' });
    return;
  }

  try {
    const payload = JSON.parse(await readBody(req));
    const system = String(payload.system || '').slice(0, 4000);
    const messages = Array.isArray(payload.messages) ? payload.messages.slice(-12) : [];
    const page = payload.page || {};

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `${system}\n\nCurrent page: ${page.title || ''} ${page.url || ''}`.trim() },
          ...messages.map((item) => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: String(item.content || '').slice(0, 6000)
          }))
        ]
      })
    });

    if (!response.ok) {
      json(res, response.status, { error: 'Model provider request failed' });
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    json(res, 200, { message: { role: 'assistant', content } });
  } catch (error) {
    json(res, 400, { error: error.message || 'Invalid request' });
  }
});

server.listen(port, () => {
  console.log(`Model proxy listening on http://127.0.0.1:${port}/api/model-session`);
});
