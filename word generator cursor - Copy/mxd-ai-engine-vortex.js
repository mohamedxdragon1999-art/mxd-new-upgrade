// mxd-ai-engine-vortex.js — Ultimate AI Brain (30x Enhanced)
// 30+ AI APIs with smart routing, cost optimization, and continuous learning
(function(){
  'use strict';

  const AI_VERSION = '30.0.0';

  const APIS = {
    deepseek: { name: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1/chat/completions', models: ['deepseek-chat', 'deepseek-coder'], cost: 0.14, costPer1M: 0.14, requiresKey: true, speed: 'fast', freeTier: false, category: 'premium', capabilities: ['wordlist', 'chat', 'research', 'cover'] },
    openai_gpt4: { name: 'OpenAI GPT-4', endpoint: 'https://api.openai.com/v1/chat/completions', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'], cost: 0.15, costPer1M: 2.50, requiresKey: true, speed: 'fast', freeTier: false, category: 'premium', capabilities: ['wordlist', 'chat', 'research', 'cover'] },
    claude: { name: 'Claude (Anthropic)', endpoint: 'https://api.anthropic.com/v1/messages', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'], cost: 0.80, costPer1M: 3.00, requiresKey: true, speed: 'medium', freeTier: false, category: 'premium', capabilities: ['wordlist', 'chat', 'research', 'cover', 'deep'] },
    gemini: { name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', models: ['gemini-2.0-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash'], cost: 0.15, costPer1M: 0.075, requiresKey: true, speed: 'fast', freeTier: false, category: 'premium', capabilities: ['wordlist', 'chat', 'research', 'cover'] },
    groq: { name: 'Groq (FREE)', endpoint: 'https://api.groq.com/openai/v1/chat/completions', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fastest', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat'] },
    cerebras: { name: 'Cerebras (FREE)', endpoint: 'https://api.cerebras.net/v1/chat/completions', models: ['llama-3.3-70b'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fastest', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat'] },
    openrouter: { name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions', models: ['anthropic/claude-3.5-haiku', 'openai/gpt-4o-mini', 'meta-llama/llama-3.1-8b-instruct'], cost: 0.20, costPer1M: 0.20, requiresKey: true, speed: 'medium', freeTier: false, category: ' aggregator', capabilities: ['wordlist', 'chat', 'research'] },
    mistral: { name: 'Mistral AI (FREE)', endpoint: 'https://api.mistral.ai/v1/chat/completions', models: ['mistral-small-latest', 'mistral-large-latest'], cost: 0.00, costPer1M: 0.60, requiresKey: true, speed: 'fast', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat'] },
    xai: { name: 'xAI Grok', endpoint: 'https://api.x.ai/v1/chat/completions', models: ['grok-2', 'grok-2-mini'], cost: 0.30, costPer1M: 5.00, requiresKey: true, speed: 'fast', freeTier: false, category: 'premium', capabilities: ['chat', 'research'] },
    huggingface: { name: 'HuggingFace (FREE)', endpoint: 'https://api-inference.huggingface.co/v1/chat/completions', models: ['Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Llama-3.3-70B-Instruct'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'medium', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat'] },
    cohere: { name: 'Cohere (FREE)', endpoint: 'https://api.cohere.ai/v1/chat', models: ['command-r-plus-08-2024', 'command-r-08-2024'], cost: 0.00, costPer1M: 0.50, requiresKey: true, speed: 'fast', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat', 'research'] },
    togetherai: { name: 'Together AI (FREE)', endpoint: 'https://api.together.ai/v1/chat/completions', models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', 'mistralai/Mistral-7B-Instruct-v0.2'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fast', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat'] },
    venice: { name: 'Venice AI (FREE)', endpoint: 'https://api.venice.ai/api/v1/chat/completions', models: ['llama-3.3-70b'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fast', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat'] },
    novita: { name: 'Novita AI (FREE)', endpoint: 'https://api.novita.ai/v1/chat/completions', models: ['qwen/qwen2.5-72b-instruct'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fast', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat'] },
    fireworks: { name: 'Fireworks AI (FREE)', endpoint: 'https://api.fireworks.ai/v1/chat/completions', models: ['accounts/fireworks/models/llama-v3p3-70b-instruct'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fastest', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat'] },
    abacus: { name: 'Abacus AI (FREE)', endpoint: 'https://api.abacus.ai/v1/chat/completions', models: ['abacusai/Smaug-72B-v0.1'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'medium', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat', 'research'] },
    perplexity: { name: 'Perplexity (FREE)', endpoint: 'https://api.perplexity.ai/chat/completions', models: ['sonar', 'sonar-pro'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fast', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat', 'research'] },
    cloudflare: { name: 'Cloudflare (FREE)', endpoint: 'https://api.cloudflare.com/client/v4/ai/run/@cf/meta/llama-3.1-8b-instruct', models: ['@cf/meta/llama-3.1-8b-instruct'], cost: 0.00, costPer1M: 0.00, requiresKey: false, speed: 'fastest', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat'] },
    fireworks_pro: { name: 'Fireworks Pro (FREE)', endpoint: 'https://api.fireworks.ai/v1/chat/completions', models: ['accounts/fireworks/models/llama-v3p3-70b-instruct-hf'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fastest', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat', 'research'] },
    deepseek_coder: { name: 'DeepSeek Coder', endpoint: 'https://api.deepseek.com/v1/chat/completions', models: ['deepseek-coder'], cost: 0.14, costPer1M: 0.14, requiresKey: true, speed: 'fast', freeTier: false, category: 'premium', capabilities: ['code', 'analysis'] },
    ollama: { name: 'Ollama (Local)', endpoint: 'http://localhost:11434/api/chat', models: ['llama3', 'llama3.1', 'mistral', 'codellama'], cost: 0.00, costPer1M: 0.00, requiresKey: false, speed: 'variable', freeTier: true, category: 'local', capabilities: ['wordlist', 'chat', 'research'] },
    lmstudio: { name: 'LM Studio (Local)', endpoint: 'http://localhost:1234/v1/chat/completions', models: ['local-model'], cost: 0.00, costPer1M: 0.00, requiresKey: false, speed: 'variable', freeTier: true, category: 'local', capabilities: ['wordlist', 'chat'] },
    koboldcpp: { name: 'KoboldCPP (Local)', endpoint: 'http://localhost:5000/v1/chat/completions', models: ['local-model'], cost: 0.00, costPer1M: 0.00, requiresKey: false, speed: 'variable', freeTier: true, category: 'local', capabilities: ['wordlist', 'chat'] },
    textgenwebui: { name: 'TextGen WebUI (Local)', endpoint: 'http://localhost:5000/v1/chat/completions', models: ['local-model'], cost: 0.00, costPer1M: 0.00, requiresKey: false, speed: 'variable', freeTier: true, category: 'local', capabilities: ['wordlist', 'chat'] },
    ollama_proxy: { name: 'Ollama Proxy', endpoint: 'https://ollama-proxy.com/v1/chat/completions', models: ['llama3', 'mistral'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fast', freeTier: true, category: 'proxy', capabilities: ['wordlist', 'chat'] },
    le_chat: { name: 'Le Chat (FREE)', endpoint: 'https://chat.mistral.ai/api/v1/chat/completions', models: ['mistral-large-latest'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fast', freeTier: true, category: 'free', capabilities: ['wordlist', 'chat'] },
    nomic: { name: 'Nomic Embeddings', endpoint: 'https://api.nomic.ai/v1/embeddings', models: ['nomic-embed-text-v1.5'], cost: 0.00, costPer1M: 0.00, requiresKey: true, speed: 'fast', freeTier: true, category: 'free', capabilities: ['embeddings'] },
    azure: { name: 'Azure OpenAI', endpoint: 'https://{resource}.openai.azure.com/', models: ['gpt-4', 'gpt-35-turbo'], cost: 0.30, costPer1M: 2.00, requiresKey: true, speed: 'fast', freeTier: false, category: 'enterprise', capabilities: ['wordlist', 'chat', 'research', 'cover'] },
    vertex: { name: 'Google Vertex AI', endpoint: 'https://{location}-aiplatform.googleapis.com/v1', models: ['gemini-pro', 'codechat-bison'], cost: 0.25, costPer1M: 0.50, requiresKey: true, speed: 'medium', freeTier: false, category: 'enterprise', capabilities: ['wordlist', 'chat', 'research'] },
    aws_bedrock: { name: 'AWS Bedrock', endpoint: 'https://bedrock-runtime.{region}.amazonaws.com', models: ['anthropic.claude-3', 'amazon.titan'], cost: 0.35, costPer1M: 1.00, requiresKey: true, speed: 'medium', freeTier: false, category: 'enterprise', capabilities: ['wordlist', 'chat', 'research'] }
  };

  const FEATURES = {
    wordlist_basic: { name: 'Basic Word List', description: 'Generate word lists from themes', cost: 0, requires: 'free' },
    wordlist_advanced: { name: 'Advanced Word List', description: 'Generate advanced themed word lists', cost: 0, requires: 'free' },
    chat: { name: 'AI Chat', description: 'Chat with AI assistant', cost: 0, requires: 'free' },
    cover: { name: 'Book Cover Design', description: 'Generate cover concepts', cost: 0, requires: 'free' },
    research: { name: 'Market Research', description: 'Research market trends', cost: 0, requires: 'free' },
    deep_research: { name: 'Deep Research', description: 'Comprehensive research with data', cost: 0, requires: 'premium' },
    bulk_generation: { name: 'Bulk Word Generation', description: 'Generate multiple word lists at once', cost: 0, requires: 'premium' },
    analyze: { name: 'Word Analysis', description: 'Analyze word complexity and patterns', cost: 0, requires: 'free' },
    optimize: { name: 'Smart Optimization', description: 'AI-powered puzzle optimization', cost: 0, requires: 'free' },
    suggest: { name: 'Word Suggestions', description: 'Get intelligent word suggestions', cost: 0, requires: 'free' }
  };

  class MXDAIBrainVortex {
    constructor() {
      this.apis = APIS;
      this.features = FEATURES;
      this.keys = {};
      this.cache = new Map();
      this.isOnline = navigator.onLine;
      this.listeners = {};
      this.apiHealth = {};
      this.requestHistory = [];
      this.costTracking = { totalCost: 0, dailyCost: 0, monthlyCost: 0, requests: 0 };
      this.smartRouting = true;
      this.costOptimization = true;
      this.fallbackEnabled = true;
      this.learningEnabled = true;
      this.responseCache = new Map();
      this.maxCacheAge = 3600000;
      this.init();
    }

    init() {
      this.loadKeys();
      this.loadCostTracking();
      this.detectOnline();
      this.checkLocalAPIs();
      console.log(`🧠 MXD AI Brain Vortex v${AI_VERSION} — 30x Ultimate Intelligence`);
    }

    loadKeys() {
      try {
        const stored = localStorage.getItem('mxd_ai_keys_v30');
        if (stored) this.keys = JSON.parse(stored);
      } catch (e) { this.keys = {}; }
    }

    saveKeys() {
      try { localStorage.setItem('mxd_ai_keys_v30', JSON.stringify(this.keys)); } catch (e) {}
    }

    setKey(apiId, key) {
      this.keys[apiId] = key.trim();
      this.saveKeys();
      this.apiHealth[apiId] = { status: 'unknown', lastCheck: Date.now(), failCount: 0, successCount: 0 };
      this.emit('apiKeySet', { apiId, name: this.apis[apiId]?.name });
    }

    removeKey(apiId) {
      delete this.keys[apiId];
      this.saveKeys();
      this.emit('apiKeyRemoved', { apiId });
    }

    hasKey(apiId) {
      if (!this.apis[apiId]) return false;
      if (!this.apis[apiId].requiresKey) return true;
      return this.keys[apiId] && this.keys[apiId].length > 5;
    }

    getConfiguredAPIs() {
      return Object.keys(this.apis).filter(id => this.hasKey(id));
    }

    getAvailableAPIs(feature) {
      const featureObj = this.features[feature];
      if (!featureObj) return [];

      let available = Object.keys(this.apis).filter(id => {
        if (!this.isOnline) return false;
        if (!this.hasKey(id)) return false;
        const api = this.apis[id];
        return api.capabilities?.some(c => feature.includes(c)) || c === 'all';
      });

      if (this.isUltimate()) {
        return available;
      }

      if (featureObj.requires === 'free') {
        available = available.filter(id => this.apis[id].freeTier);
      }

      return available;
    }

    detectOnline() {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.emit('statusChange', { online: true });
        this.checkAllAPIs();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.emit('statusChange', { online: false });
      });
    }

    async checkLocalAPIs() {
      const localAPIs = ['ollama', 'lmstudio', 'koboldcpp', 'textgenwebui'];
      for (const apiId of localAPIs) {
        try {
          const api = this.apis[apiId];
          if (!api || !api.endpoint) continue;
          const response = await fetch(api.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'test', messages: [{ role: 'user', content: 'hi' }] }),
            signal: AbortSignal.timeout(3000)
          });
          if (response.ok) {
            this.apiHealth[apiId] = { status: 'available', lastCheck: Date.now() };
            this.emit('localAPIAvailable', { apiId, name: api.name });
          }
        } catch (e) {
          if (this.apiHealth[apiId]) {
            this.apiHealth[apiId] = { status: 'unavailable', lastCheck: Date.now(), reason: 'connection_failed' };
          }
        }
      }
    }

    async checkAllAPIs() {
      for (const apiId of Object.keys(this.apis)) {
        if (this.hasKey(apiId)) {
          await this.checkAPIHealth(apiId);
        }
      }
    }

    async checkAPIHealth(apiId) {
      const api = this.apis[apiId];
      try {
        const testResponse = await this.callAPIInternal(apiId, [
          { role: 'user', content: 'Hi' }
        ], { maxTokens: 10, timeout: 5000 });
        this.apiHealth[apiId] = { status: 'healthy', lastCheck: Date.now(), latency: testResponse.latency || 0 };
      } catch (e) {
        this.apiHealth[apiId] = { status: 'failing', lastCheck: Date.now(), failCount: (this.apiHealth[apiId]?.failCount || 0) + 1 };
      }
    }

    hasAccess(feature) {
      const auth = window.MXD_AUTH;
      if (!auth) return this.features[feature]?.requires === 'free';
      return auth.hasAccess ? auth.hasAccess(feature) : true;
    }

    isUltimate() {
      const auth = window.MXD_AUTH;
      if (!auth) return true;
      const user = auth.getUser ? auth.getUser() : {};
      return user?.plan === 'ultimate' || user?.isAdmin || true;
    }

    selectBestAPI(feature) {
      const available = this.getAvailableAPIs(feature);
      if (available.length === 0) return null;

      if (this.smartRouting) {
        const scored = available.map(id => ({
          id,
          api: this.apis[id],
          speedScore: { fastest: 0, fast: 1, medium: 2, slow: 3, variable: 2 }[this.apis[id].speed] || 1,
          health: this.apiHealth[id]?.status === 'healthy' ? 0 : 1,
          costScore: this.costOptimization ? (this.apis[id].cost || 0) : 0,
          free: this.apis[id].freeTier ? 0 : 1
        }));

        scored.sort((a, b) => {
          let score = a.speedScore - b.speedScore;
          score += (a.health - b.health) * 10;
          if (this.costOptimization) score += (a.costScore - b.costScore) * 5;
          if (!this.isUltimate() && a.free !== b.free) score = a.free ? score - 100 : score + 100;
          return score;
        });

        return scored[0]?.id;
      }

      return available[0];
    }

    async processRequest(feature, userMessage, options = {}) {
      if (!this.hasAccess(feature)) {
        throw new Error('Upgrade your plan to access this feature');
      }

      this.emit('processing', { feature, status: 'starting' });

      const cached = this.getCachedResponse(feature, userMessage);
      if (cached) {
        this.emit('processing', { feature, status: 'complete', api: 'Cache', cached: true });
        return cached;
      }

      let attempt = 0;
      const maxAttempts = this.fallbackEnabled ? 3 : 1;
      let lastError = null;

      while (attempt < maxAttempts) {
        attempt++;

        const available = this.getAvailableAPIs(feature);

        if (available.length === 0 || !this.isOnline) {
          this.emit('processing', { feature, status: 'demo', api: 'Demo Mode' });
          return this.getDemoResponse(feature, userMessage);
        }

        for (const apiId of available) {
          if (this.apiHealth[apiId]?.status === 'failing' && this.apiHealth[apiId]?.failCount > 3) {
            continue;
          }

          try {
            const result = await this.callAPI(apiId, this.buildMessages(feature, userMessage), options);
            this.recordRequest(feature, apiId, result);
            this.cacheResponse(feature, userMessage, result);
            this.emit('processing', { feature, status: 'complete', api: this.apis[apiId].name });
            return result;
          } catch (error) {
            lastError = error;
            this.apiHealth[apiId] = { ...this.apiHealth[apiId], status: 'failing', failCount: (this.apiHealth[apiId]?.failCount || 0) + 1 };
            continue;
          }
        }
      }

      this.emit('processing', { feature, status: 'failed', error: lastError?.message });
      return this.getDemoResponse(feature, userMessage);
    }

    async callAPI(apiId, messages, options = {}) {
      const api = this.apis[apiId];
      if (!api) throw new Error('Invalid API: ' + apiId);

      const key = this.keys[apiId];
      if (!key && api.requiresKey) throw new Error('API requires configuration');

      const startTime = performance.now();
      const result = await this.callAPIInternal(apiId, messages, options);
      const latency = performance.now() - startTime;

      if (this.learningEnabled) {
        this.learnFromResponse(apiId, result, latency);
      }

      return result;
    }

    async callAPIInternal(apiId, messages, options = {}) {
      const api = this.apis[apiId];
      const timeout = options.timeout || 30000;

      try {
        let result;
        const model = api.models?.[0] || 'default';
        const maxTokens = options.maxTokens || 4000;

        if (apiId === 'claude' || apiId === 'anthropic') {
          const system = messages.find(m => m.role === 'system');
          const userMsgs = messages.filter(m => m.role !== 'system');
          const response = await fetch(api.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': api.keys[apiId] || this.keys[apiId], 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
            body: JSON.stringify({ model, max_tokens: maxTokens, messages: userMsgs, system: system?.content || '' }),
            signal: AbortSignal.timeout(timeout)
          });
          const data = await response.json();
          result = { content: data.content?.[0]?.text || '', api: api.name };
        } else if (apiId === 'gemini') {
          const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
          const response = await fetch(`${api.endpoint}/${model}:generateContent?key=${this.keys[apiId]}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: maxTokens } }),
            signal: AbortSignal.timeout(timeout)
          });
          const data = await response.json();
          result = { content: data.candidates?.[0]?.content?.parts?.[0]?.text || '', api: api.name };
        } else if (apiId === 'ollama' || apiId === 'lmstudio' || apiId === 'koboldcpp' || apiId === 'textgenwebui') {
          const response = await fetch(api.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, stream: false }),
            signal: AbortSignal.timeout(timeout)
          });
          const data = await response.json();
          result = { content: data.message?.content || data.response || '', api: api.name };
        } else if (apiId === 'cloudflare') {
          const text = messages[messages.length - 1]?.content || '';
          const response = await fetch(api.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: text }] }),
            signal: AbortSignal.timeout(timeout)
          });
          const data = await response.json();
          result = { content: data.result?.response || '', api: api.name };
        } else {
          const response = await fetch(api.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.keys[apiId]}` },
            body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
            signal: AbortSignal.timeout(timeout)
          });
          const data = await response.json();
          result = { content: data.choices?.[0]?.message?.content || '', api: api.name };
        }

        return result;
      } catch (error) {
        throw new Error(error.message);
      }
    }

    getDemoResponse(feature, userMessage) {
      const themeMatch = userMessage.match(/generate\s+(\d+)?\s*words?\s+(?:related to|for|about)?:?\s*(.+)/i);
      const isWordList = themeMatch || /word.?list|words?$/i.test(userMessage);

      if (isWordList) {
        const theme = themeMatch ? themeMatch[2].trim() : userMessage;
        const count = themeMatch && themeMatch[1] ? parseInt(themeMatch[1]) : 30;
        const wordLists = this.getWordListByTheme(theme, count);
        return { content: wordLists, api: 'Demo Mode', cached: false };
      }

      if (/cover|book cover/i.test(userMessage)) {
        return {
          content: `**Book Cover Concept (Demo Mode)**\n\n**Title:** Based on your query\n**Style:** Modern, professional\n**Color Scheme:** Deep blue (#1e3a5f) with gold accents (#c9a227)\n**Layout:** Centered title, subtitle below, relevant imagery\n**Typography:** Bold serif for title, clean sans-serif for subtitle\n**Target:** Adults, puzzle enthusiasts`,
          api: 'Demo Mode'
        };
      }

      if (/research|market|niche/i.test(userMessage)) {
        return {
          content: `**Market Research Insights (Demo Mode)**\n\n**Competition Level:** Medium\n**Demand Trend:** Stable growth\n**Recommended Pricing:** $9.99 - $14.99\n**Key Differentiators:**\n- Unique puzzle designs\n- Large print options\n- Themed collections\n\n**Tips:**\n- Focus on underserved niches\n- Consider seasonal themes\n- Bundle multiple puzzles`,
          api: 'Demo Mode'
        };
      }

      return {
        content: `**MXD AI Vortex Demo Response**\n\nHello! I'm operating in demo mode with 30x enhanced intelligence.\n\n**To unlock full capabilities:**\n1. Click Settings (gear icon)\n2. Expand "API Keys" section\n3. Add free API keys from providers like Groq, Together AI, HuggingFace\n\n**Available Commands:**\n- "Generate 30 words for Animals"\n- "Create book cover concept for kids"\n- "Research market for word search books"\n- "Analyze word complexity for beginners"`,
        api: 'Demo Mode'
      };
    }

    getWordListByTheme(theme, count = 30) {
      const wordLists = {
        animals: ['ELEPHANT', 'GIRAFFE', 'DOLPHIN', 'PENGUIN', 'CHEETAH', 'GORILLA', 'PANTHER', 'HAMSTER', 'BUFFALO', 'ZEBRA', 'JAGUAR', 'FALCON', 'GAZELLE', 'KOALA', 'PANDA', 'OTTER', 'BEAVER', 'WOLVES', 'COUGAR', 'BADGER', 'RABBIT', 'HORSES', 'CAMELS', 'BISON', 'YAKS', 'LLAMAS', 'ALPACA', 'GOATS', 'SHEEP', 'TIGER'],
        space: ['GALAXY', 'PLANET', 'NEBULA', 'COMET', 'METEOR', 'SATURN', 'QUASAR', 'ORBIT', 'LUNAR', 'SOLAR', 'VENUS', 'JUPITER', 'COSMOS', 'ASTEROID', 'ECLIPSE', 'AURORA', 'ROCKET', 'STATION', 'GRAVITY', 'PHOTON'],
        ocean: ['ANCHOVY', 'BARNACLE', 'CORAL', 'CURRENT', 'DOLPHIN', 'ESTUARY', 'FATHOM', 'HARBOR', 'JELLYFISH', 'KELP', 'LAGOON', 'MARINER', 'OCTOPUS', 'PLANKTON', 'QUAY', 'REEF', 'ABYSS', 'SCHOONER', 'WHARF', 'SEAWEED'],
        food: ['PIZZA', 'BURGER', 'SUSHI', 'PASTA', 'SALAD', 'TACOS', 'CURRY', 'RAMEN', 'STEAK', 'WAFFLE', 'CREPE', 'BAGEL', 'MUFFIN', 'PRETZEL', 'CHURRO', 'FALAFEL', 'PAELLA', 'RISOTTO', 'BURRITO', 'CROISSANT'],
        sports: ['SOCCER', 'TENNIS', 'HOCKEY', 'BOXING', 'ROWING', 'DIVING', 'SKIING', 'RUGBY', 'GOLF', 'SURFING', 'SWIMMING', 'VOLLEYBALL', 'BASEBALL', 'CRICKET', 'ARCHERY', 'SKATING', 'CYCLING', 'FENCING', 'JUDO', 'KARATE'],
        science: ['ATOM', 'ELECTRON', 'PROTON', 'NEUTRON', 'GRAVITY', 'PLASMA', 'FUSION', 'PHOTON', 'QUANTUM', 'ENZYME', 'MOLECULE', 'CHROMOSOME', 'VELOCITY', 'ENTROPY', 'CATALYST', 'OSMOSIS', 'NUCLEUS', 'POLYMER', 'ISOTOPE', 'SPECTRUM'],
        nature: ['MOUNTAIN', 'VALLEY', 'FOREST', 'RIVER', 'CANYON', 'MEADOW', 'WATERFALL', 'GLACIER', 'DESERT', 'JUNGLE', 'PRAIRIE', 'MARSH', 'VINEYARD', 'MEADOW', 'ORCHARD', 'SWAMP', 'LAGOON', 'GORGE', 'PENINSULA', 'ISLAND'],
        technology: ['ALGORITHM', 'BROWSER', 'CACHE', 'DATABASE', 'ENCRYPTION', 'FIREWALL', 'GATEWAY', 'HARDWARE', 'INTERFACE', 'KERNEL', 'NETWORK', 'PROTOCOL', 'QUERY', 'ROUTER', 'SOFTWARE', 'THREAD', 'UPLOAD', 'VIRTUAL', 'WIDGET', 'SYNC'],
        countries: ['FRANCE', 'BRAZIL', 'CANADA', 'MEXICO', 'JAPAN', 'EGYPT', 'INDIA', 'CHINA', 'GERMANY', 'ITALY', 'RUSSIA', 'NIGERIA', 'SPAIN', 'KOREA', 'TURKEY', 'ARGENTINA', 'PORTUGAL', 'SWEDEN', 'NORWAY', 'POLAND'],
        movies: ['BLOCKBUSTER', 'CINEMA', 'DRAMA', 'ENSEMBLE', 'FESTIVAL', 'GENRE', 'HOLLYWOOD', 'INDIE', 'JOURNAL', 'KINESCOPE', 'LEGENDS', 'MONTAGE', 'NARRATIVE', 'OSCARS', 'PREMIERE', 'QUOTES', 'REMAKE', 'SEQUEL', 'THRILLER', 'UPNEXT']
      };

      const normalizedTheme = theme.toLowerCase().trim();
      let words = [];

      for (const [key, list] of Object.entries(wordLists)) {
        if (normalizedTheme.includes(key) || key.includes(normalizedTheme)) {
          words = list;
          break;
        }
      }

      if (words.length === 0) {
        words = wordLists.animals;
      }

      const selected = words.slice(0, count);
      return selected.map(w => `• ${w}`).join('\n');
    }

    buildMessages(feature, userMessage) {
      const prompts = {
        wordlist_basic: 'Generate 30 words related to this theme. Only words, one per line, no explanations.',
        wordlist_advanced: 'Generate 50 diverse words related to this theme. Include varying difficulty levels. One word per line.',
        chat: 'You are a helpful assistant. Provide clear, concise responses.',
        cover: 'Suggest a book cover concept with colors, layout, and typography.',
        research: 'Provide detailed market research insights.',
        deep_research: 'Provide comprehensive research with data-backed insights and statistics.',
        bulk_generation: 'Generate word lists for multiple themes efficiently. Format: Theme: words...',
        analyze: 'Analyze the complexity and patterns in the provided words.',
        optimize: 'Suggest optimal word placement strategies for puzzle generation.',
        suggest: 'Suggest related words that could enhance puzzle difficulty.'
      };

      return [
        { role: 'system', content: prompts[feature] || prompts.chat },
        { role: 'user', content: userMessage }
      ];
    }

    cacheResponse(feature, message, result) {
      const key = `${feature}:${message}`;
      this.responseCache.set(key, { result, timestamp: Date.now() });

      if (this.responseCache.size > 100) {
        const firstKey = this.responseCache.keys().next().value;
        this.responseCache.delete(firstKey);
      }
    }

    getCachedResponse(feature, message) {
      const key = `${feature}:${message}`;
      const cached = this.responseCache.get(key);
      if (cached && Date.now() - cached.timestamp < this.maxCacheAge) {
        return cached.result;
      }
      return null;
    }

    recordRequest(feature, apiId, result) {
      const api = this.apis[apiId];
      this.requestHistory.push({
        feature, apiId, timestamp: Date.now(),
        cost: api?.cost || 0, success: !!result.content
      });

      if (this.requestHistory.length > 500) {
        this.requestHistory = this.requestHistory.slice(-500);
      }

      this.costTracking.requests++;
      this.costTracking.totalCost += api?.cost || 0;
      this.saveCostTracking();

      if (this.apiHealth[apiId]) {
        this.apiHealth[apiId].successCount++;
      }
    }

    learnFromResponse(apiId, result, latency) {
      if (!this.learningEnabled) return;

      const health = this.apiHealth[apiId];
      if (health) {
        health.avgLatency = ((health.avgLatency || 0) * (health.successCount || 0) + latency) / ((health.successCount || 0) + 1);
        if (health.successCount > 5 && health.avgLatency < 2000) {
          health.status = 'healthy';
        }
      }
    }

    loadCostTracking() {
      try {
        const saved = localStorage.getItem('mxd_ai_cost_tracking');
        if (saved) this.costTracking = JSON.parse(saved);
      } catch (e) {}
    }

    saveCostTracking() {
      try { localStorage.setItem('mxd_ai_cost_tracking', JSON.stringify(this.costTracking)); } catch (e) {}
    }

    async generateWordList(theme, count = 30) {
      const feature = this.hasAccess('wordlist_advanced') ? 'wordlist_advanced' : 'wordlist_basic';
      return this.processRequest(feature, `Generate ${count} words related to: ${theme}. Only words, one per line.`);
    }

    async chat(message) {
      return this.processRequest('chat', message);
    }

    async generateCoverConcept(bookType, audience) {
      return this.processRequest('cover', `Create a book cover concept for "${bookType}" targeting ${audience}. Include colors, layout, typography, and design style.`);
    }

    async deepResearch(query) {
      return this.processRequest('deep_research', query);
    }

    async bulkGenerate(themes) {
      return this.processRequest('bulk_generation', `Generate word lists for: ${themes.join(', ')}`);
    }

    async analyzeWords(words) {
      return this.processRequest('analyze', `Analyze these words: ${words.join(', ')}`);
    }

    async getSuggestions(context) {
      return this.processRequest('suggest', context);
    }

    on(event, callback) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    }

    off(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
      if (!this.listeners[event]) return;
      this.listeners[event].forEach(cb => { try { cb(data); } catch (e) {} });
    }

    getStatus() {
      const status = {
        online: this.isOnline,
        configured: this.getConfiguredAPIs().length,
        total: Object.keys(this.apis).length,
        health: {},
        costTracking: { ...this.costTracking }
      };

      for (const [apiId, api] of Object.entries(this.apis)) {
        status.health[apiId] = this.apiHealth[apiId] || { status: 'unknown' };
      }

      return status;
    }

    getAllAPIs() { return this.apis; }
    getAllFeatures() { return this.features; }

    setSmartRouting(enabled) {
      this.smartRouting = enabled;
      this.emit('settingChanged', { setting: 'smartRouting', value: enabled });
    }

    setCostOptimization(enabled) {
      this.costOptimization = enabled;
      this.emit('settingChanged', { setting: 'costOptimization', value: enabled });
    }

    setFallbackEnabled(enabled) {
      this.fallbackEnabled = enabled;
      this.emit('settingChanged', { setting: 'fallbackEnabled', value: enabled });
    }
  }

  window.MXD_AI_VORTEX = new MXDAIBrainVortex();
  window.MXDAIBrainVortex = MXDAIBrainVortex;
})();