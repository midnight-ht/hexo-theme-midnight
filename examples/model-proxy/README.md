# Model Session Proxy Example

This sample lives outside the theme runtime. It shows the request and response shape expected by `model_session.endpoint`.

```bash
OPENAI_API_KEY=sk-... \
ALLOWED_ORIGIN=https://your-site.example \
node server.mjs
```

Theme config:

```yaml
model_session:
  enabled: true
  endpoint: https://your-proxy.example/api/model-session
```

Production notes:

- Keep provider API keys on the server.
- Add real rate limiting and abuse controls.
- Lock CORS to your published site.
- Log enough for reliability, but avoid storing private conversations unless users consent.
