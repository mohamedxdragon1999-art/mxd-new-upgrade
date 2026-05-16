// mxd-api-keys.js — FREE API Keys Configuration
// All providers are 100% FREE. Get keys from the URLs below.

// ============ CLOUDFLARE WORKERS AI ============
window.MXD_API_KEYS = {
  cloudflare: { accountId: '', apiToken: '' }, // https://dash.cloudflare.com/
  groq: '', // https://console.groq.com/keys
  huggingface: '', // https://huggingface.co/settings/tokens
  replicate: '', // https://replicate.com/account/api-tokens
  gemini: '', // https://aistudio.google.com/app/apikey
  openrouter: '', // https://openrouter.ai/keys
  together: '' // https://api.together.xyz/settings/api-keys
};

// ============ PROVIDER INFO ============
/*
FREE PROVIDERS:
1. Cloudflare Workers AI - 10 req/10s, llama-3.1-8b
2. Groq - 30 req/min, llama-3.1-70b
3. Hugging Face - Free tier, llama-3.1-8b
4. Replicate - Free tier
5. Gemini - 1M tokens, 1.5-flash
6. OpenRouter - 20 req/min, claude-3-haiku
7. Together AI - Free tier, llama-3.1-70b

HOW TO GET KEYS:
- Cloudflare: https://dash.cloudflare.com/ → Workers AI
- Groq: https://console.groq.com/keys (free tier: 30 req/min)
- Hugging Face: https://huggingface.co/settings/tokens
- Gemini: https://aistudio.google.com/app/apikey (free tier: 15 req/min)
- OpenRouter: https://openrouter.ai/keys (free credits)
- Together: https://api.together.xyz/settings/api-keys

Add your keys above, then refresh the page.
*/