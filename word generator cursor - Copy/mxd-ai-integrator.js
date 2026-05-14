// mxd-ai-integrator.js — MXD AI Brain: 15+ Free Providers + Continuous Learning
// Enhanced with continuous learning, smart caching, adaptive responses
(function(){
  'use strict';

  const VERSION = '5.0.0';
  const LEARNING_ENABLED = true;
  const LEARNING_INTERVAL = 60000; // 1 minute when online

  // 15+ FREE AI PROVIDERS
  const FREE_AI_PROVIDERS = {
    // Original 7
    groq: {
      name: 'Groq',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      rateLimit: '30/min',
      requiresKey: true,
      free: true,
      keyFormat: 'gsk_...',
      keyPlaceholder: 'gsk_abc123xyz789...',
      model: 'llama-3.1-70b-versatile',
      promptLimit: 128000,
      supportsStreaming: true,
      latency: 'fast',
      quality: 'high'
    },
    cloudflare: {
      name: 'Cloudflare Workers AI',
      endpoint: 'https://api.cloudflare.com/client/v4/ai/run/@cf/meta/llama-3.1-8b-instruct',
      rateLimit: '10/10s',
      requiresKey: true,
      free: true,
      keyFormat: 'AccountID:APIToken',
      keyPlaceholder: 'abc123...:xyz789...',
      model: '@cf/meta/llama-3.1-8b-instruct',
      promptLimit: 4096,
      supportsStreaming: true,
      latency: 'fast',
      quality: 'medium'
    },
    huggingface: {
      name: 'Hugging Face',
      endpoint: 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct',
      rateLimit: 'Rate limited',
      requiresKey: true,
      free: true,
      keyFormat: 'hf_...',
      keyPlaceholder: 'hf_abc123def456...',
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      promptLimit: 4096,
      supportsStreaming: false,
      latency: 'medium',
      quality: 'medium'
    },
    gemini: {
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      rateLimit: '60/min',
      requiresKey: true,
      free: true,
      keyFormat: 'AIza...',
      keyPlaceholder: 'AIzaSy...',
      model: 'gemini-1.5-flash',
      promptLimit: 1000000,
      supportsStreaming: false,
      latency: 'fast',
      quality: 'high'
    },
    openrouter: {
      name: 'OpenRouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      rateLimit: '20/min',
      requiresKey: true,
      free: true,
      keyFormat: 'sk-or-...',
      keyPlaceholder: 'sk-or-v1...',
      model: 'anthropic/claude-3-haiku',
      promptLimit: 100000,
      supportsStreaming: true,
      latency: 'fast',
      quality: 'high'
    },
    together: {
      name: 'Together AI',
      endpoint: 'https://api.together.xyz/v1/chat/completions',
      rateLimit: 'Free tier',
      requiresKey: true,
      free: true,
      keyFormat: 'tckd...',
      keyPlaceholder: 'tckd_abc123...',
      model: 'togetherai/llama-3.1-70b-instruct',
      promptLimit: 128000,
      supportsStreaming: true,
      latency: 'medium',
      quality: 'high'
    },
    replicate: {
      name: 'Replicate',
      endpoint: 'https://api.replicate.com/v1/predictions',
      rateLimit: 'Free tier',
      requiresKey: true,
      free: true,
      keyFormat: 'r8_...',
      keyPlaceholder: 'r8_abc123xyz...',
      model: 'meta/llama-3.1-70b-instruct',
      promptLimit: 128000,
      supportsStreaming: false,
      latency: 'slow',
      quality: 'high'
    },
    // NEW 8+ PROVIDERS
    ollama: {
      name: 'Ollama (Local)',
      endpoint: 'http://localhost:11434/api/generate',
      rateLimit: 'Unlimited',
      requiresKey: false,
      free: true,
      keyFormat: 'local',
      keyPlaceholder: 'localhost',
      model: 'llama3.1',
      promptLimit: 8192,
      supportsStreaming: true,
      latency: 'fast',
      quality: 'high',
      isLocal: true
    },
    perplexity: {
      name: 'Perplexity',
      endpoint: 'https://api.perplexity.ai/chat/completions',
      rateLimit: 'Free tier',
      requiresKey: true,
      free: true,
      keyFormat: 'pplx_...',
      keyPlaceholder: 'pplx_abc123...',
      model: 'llama-3.1-sonar-small-128k-online',
      promptLimit: 128000,
      supportsStreaming: true,
      latency: 'medium',
      quality: 'high',
      hasWebSearch: true
    },
    fireworks: {
      name: 'Fireworks AI',
      endpoint: 'https://api.fireworks.ai/inference/v1/chat/completions',
      rateLimit: 'Free tier',
      requiresKey: true,
      free: true,
      keyFormat: 'fw_...',
      keyPlaceholder: 'fw_abc123...',
      model: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      promptLimit: 128000,
      supportsStreaming: true,
      latency: 'fast',
      quality: 'high'
    },
    deepseek: {
      name: 'DeepSeek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      rateLimit: 'Free tier',
      requiresKey: true,
      free: true,
      keyFormat: 'sk-...',
      keyPlaceholder: 'sk-abc123...',
      model: 'deepseek-chat',
      promptLimit: 128000,
      supportsStreaming: true,
      latency: 'fast',
      quality: 'high',
      costEffective: true
    },
    mistral: {
      name: 'Mistral AI',
      endpoint: 'https://api.mistral.ai/v1/chat/completions',
      rateLimit: 'Free tier',
      requiresKey: true,
      free: true,
      keyFormat: 'mist_...',
      keyPlaceholder: 'mist_abc123...',
      model: 'mistral-large-latest',
      promptLimit: 128000,
      supportsStreaming: true,
      latency: 'medium',
      quality: 'high'
    },
    cohere: {
      name: 'Cohere',
      endpoint: 'https://api.cohere.ai/v1/chat',
      rateLimit: 'Free tier',
      requiresKey: true,
      free: true,
      keyFormat: '...',
      keyPlaceholder: 'your-api-key',
      model: 'command-r-plus',
      promptLimit: 4096,
      supportsStreaming: true,
      latency: 'fast',
      quality: 'medium'
    },
    ai21: {
      name: 'AI21',
      endpoint: 'https://api.ai21.com/v1/chat/completions',
      rateLimit: 'Free tier',
      requiresKey: true,
      free: true,
      keyFormat: '...',
      keyPlaceholder: 'your-api-key',
      model: 'jamba-1-5-mini',
      promptLimit: 128000,
      supportsStreaming: true,
      latency: 'medium',
      quality: 'high'
    },
    xai: {
      name: 'xAI (Grok)',
      endpoint: 'https://api.x.ai/v1/chat/completions',
      rateLimit: 'Free tier',
      requiresKey: true,
      free: true,
      keyFormat: 'xai-...',
      keyPlaceholder: 'xai-abc123...',
      model: 'grok-2-1212',
      promptLimit: 128000,
      supportsStreaming: true,
      latency: 'fast',
      quality: 'high'
    },
    nomic: {
      name: 'Nomic',
      endpoint: 'https://api.nomic.ai/v1/chat/completions',
      rateLimit: 'Free tier',
      requiresKey: true,
      free: true,
      keyFormat: '...',
      keyPlaceholder: 'your-api-key',
      model: 'nomic-ai/nomic-embed-text-v1.5',
      promptLimit: 8192,
      supportsStreaming: false,
      latency: 'fast',
      quality: 'medium'
    }
  };

  const DEFAULT_CONFIGS = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    cacheResponses: true,
    cacheTTL: 3600000,
    autoFallback: true,
    adaptiveLearning: true,
    fallbackOrder: ['groq', 'gemini', 'deepseek', 'cloudflare', 'mistral', 'fireworks', 'openrouter', 'perplexity', 'ai21', 'together', 'cohere', 'xai', 'huggingface', 'ollama', 'replicate', 'nomic']
  };

  // CONTINUOUS LEARNING DATA
  const LEARNING_DATA = {
    successfulTopics: {}, // topic -> score
    wordPatterns: {}, // pattern -> count
    providerPerformance: {}, // provider -> stats
    userPreferences: {}, // preference -> value
    sessionCount: 0,
    totalWordsGenerated: 0,
    successRate: 0
  };

  class MXDAIIntegrator {
    constructor() {
      this.providers = { ...FREE_AI_PROVIDERS };
      this.keys = this.loadKeys();
      this.config = { ...DEFAULT_CONFIGS };
      this.cache = new Map();
      this.stats = { requests: 0, successes: 0, failures: 0, providerUsage: {}, avgLatency: 0 };
      this.listeners = {};
      this.currentProvider = null;
      this.isOnline = navigator.onLine;
      this.learningTimer = null;
      this.init();
    }

    init() {
      this.validateKeys();
      this.selectBestProvider();
      this.loadLearningData();
      this.setupOnlineListener();
      this.startContinuousLearning();
      console.log(`\n╔══════════════════════════════════════════════╗`);
      console.log(`║  🤖 MXD AI Brain v${VERSION} — 15+ Free APIs     ║`);
      console.log(`╠══════════════════════════════════════════════╣`);
      console.log(`║  Active Provider: ${(this.getActiveProvider()?.name || 'None').padEnd(25)}  ║`);
      console.log(`║  Available: ${String(this.getAvailableCount()).padEnd(3)}/${Object.keys(this.providers).length} providers online          ║`);
      console.log(`║  Learning: ${LEARNING_ENABLED ? 'ENABLED' : 'DISABLED'.padEnd(20)}           ║`);
      console.log(`╚══════════════════════════════════════════════╝\n`);
    }

    loadKeys() {
      if (window.MXD_API_KEYS) return window.MXD_API_KEYS;
      try {
        const saved = localStorage.getItem('mxd_ai_keys');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return { groq: '', cloudflare: { accountId: '', apiToken: '' }, huggingface: '', replicate: '', gemini: '', openrouter: '', together: '', perplexity: '', fireworks: '', deepseek: '', mistral: '', cohere: '', ai21: '', xai: '', nomic: '' };
    }

    saveKeys() {
      try {
        localStorage.setItem('mxd_ai_keys', JSON.stringify(this.keys));
        this.emit('keysUpdated');
      } catch (e) {}
    }

    setKey(provider, key) {
      if (!this.providers[provider]) return false;
      this.keys[provider] = key;
      this.saveKeys();
      this.validateProvider(provider);
      return true;
    }

    getKey(provider) {
      const key = this.keys[provider];
      if (typeof key === 'object') return key.accountId && key.apiToken ? `${key.accountId}:${key.apiToken}` : null;
      return key || null;
    }

    hasKey(provider) {
      const config = this.providers[provider];
      if (!config?.requiresKey) return true;
      const key = this.getKey(provider);
      return key && key.length > 0 && key !== config.keyPlaceholder;
    }

    validateProvider(provider) {
      if (!this.hasKey(provider)) return { valid: false, reason: 'No key' };
      const config = this.providers[provider];
      if (!config) return { valid: false, reason: 'Unknown provider' };
      return { valid: true, name: config.name };
    }

    validateKeys() {
      const validated = {};
      for (const provider of Object.keys(this.providers)) validated[provider] = this.validateProvider(provider);
      this.emit('keysValidated', validated);
      return validated;
    }

    selectBestProvider() {
      const scores = {};
      for (const provider of this.config.fallbackOrder) {
        if (!this.hasKey(provider)) continue;
        const config = this.providers[provider];
        const perf = LEARNING_DATA.providerPerformance[provider] || { success: 100, latency: 100 };
        const latencyScore = config.latency === 'fast' ? 100 : config.latency === 'medium' ? 70 : 40;
        const qualityScore = config.quality === 'high' ? 100 : 60;
        scores[provider] = (perf.success * 0.5) + (latencyScore * 0.3) + (qualityScore * 0.2);
      }
      const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      this.currentProvider = best ? best[0] : null;
      return this.currentProvider;
    }

    getActiveProvider() {
      if (!this.currentProvider || !this.hasKey(this.currentProvider)) return this.selectBestProvider() ? this.providers[this.currentProvider] : null;
      return this.providers[this.currentProvider];
    }

    getAvailableCount() { return Object.keys(this.providers).filter(p => this.hasKey(p)).length; }

    getAllProviders() {
      return Object.entries(this.providers).map(([id, config]) => ({
        id, ...config,
        hasKey: this.hasKey(id),
        valid: this.hasKey(id),
        latency: config.latency || 'unknown',
        quality: config.quality || 'medium'
      }));
    }

    // ============ CONTINUOUS LEARNING ============

    loadLearningData() {
      try {
        const saved = localStorage.getItem('mxd_ai_learning');
        if (saved) {
          const data = JSON.parse(saved);
          Object.assign(LEARNING_DATA, data);
        }
      } catch (e) {}
    }

    saveLearningData() {
      try {
        localStorage.setItem('mxd_ai_learning', JSON.stringify(LEARNING_DATA));
      } catch (e) {}
    }

    setupOnlineListener() {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('🌐 Online — AI learning resumed');
        this.emit('online');
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('📴 Offline — AI learning paused');
        this.emit('offline');
      });
    }

    startContinuousLearning() {
      if (!LEARNING_ENABLED || !this.isOnline) return;
      this.learningTimer = setInterval(() => this.collectAndLearn(), LEARNING_INTERVAL);
    }

    stopContinuousLearning() {
      if (this.learningTimer) clearInterval(this.learningTimer);
    }

    collectAndLearn() {
      if (!this.isOnline) return;
      LEARNING_DATA.sessionCount++;
      this.analyzeProviderPerformance();
      this.optimizeFallbackOrder();
      this.emit('learningUpdate', { stats: this.getLearningStats() });
    }

    analyzeProviderPerformance() {
      for (const provider of Object.keys(this.stats.providerUsage)) {
        const usage = this.stats.providerUsage[provider];
        if (!LEARNING_DATA.providerPerformance[provider]) {
          LEARNING_DATA.providerPerformance[provider] = { success: 100, latency: 0, calls: 0 };
        }
        const perf = LEARNING_DATA.providerPerformance[provider];
        perf.calls = (perf.calls || 0) + 1;
        perf.success = Math.min(100, perf.success + 0.1);
      }
      this.saveLearningData();
    }

    optimizeFallbackOrder() {
      const perf = LEARNING_DATA.providerPerformance;
      const sorted = this.config.fallbackOrder.sort((a, b) => {
        const scoreA = (perf[a]?.success || 50) * (this.providers[a]?.latency === 'fast' ? 2 : 1);
        const scoreB = (perf[b]?.success || 50) * (this.providers[b]?.latency === 'fast' ? 2 : 1);
        return scoreB - scoreA;
      });
      this.config.fallbackOrder = sorted;
    }

    recordSuccess(provider, latency) {
      LEARNING_DATA.providerPerformance[provider] = LEARNING_DATA.providerPerformance[provider] || { success: 100, latency: 0, calls: 0 };
      const perf = LEARNING_DATA.providerPerformance[provider];
      perf.calls++;
      perf.success = Math.min(100, perf.success + 0.5);
      perf.latency = ((perf.latency * (perf.calls - 1)) + latency) / perf.calls;
      this.saveLearningData();
    }

    recordFailure(provider) {
      if (!LEARNING_DATA.providerPerformance[provider]) {
        LEARNING_DATA.providerPerformance[provider] = { success: 100, latency: 0, calls: 0 };
      }
      const perf = LEARNING_DATA.providerPerformance[provider];
      perf.calls++;
      perf.success = Math.max(0, perf.success - 5);
      this.saveLearningData();
    }

    learnFromTopic(topic, words) {
      if (!topic || !words?.length) return;
      const normalized = topic.toLowerCase().trim();
      LEARNING_DATA.successfulTopics[normalized] = LEARNING_DATA.successfulTopics[normalized] || { count: 0, words: [] };
      LEARNING_DATA.successfulTopics[normalized].count++;
      LEARNING_DATA.successfulTopics[normalized].words = [...new Set([...LEARNING_DATA.successfulTopics[normalized].words, ...words])];
      LEARNING_DATA.totalWordsGenerated += words.length;
      this.saveLearningData();
    }

    getSuggestionsForTopic(topic) {
      const normalized = topic.toLowerCase().trim();
      const learned = LEARNING_DATA.successfulTopics[normalized];
      if (learned && learned.count >= 3) {
        return { suggestions: learned.words.slice(0, 20), source: 'learned', confidence: Math.min(1, learned.count / 10) };
      }
      const partial = Object.keys(LEARNING_DATA.successfulTopics).find(k => k.includes(normalized) || normalized.includes(k));
      if (partial) {
        return { suggestions: LEARNING_DATA.successfulTopics[partial].words.slice(0, 10), source: 'related', confidence: 0.5 };
      }
      return null;
    }

    getLearningStats() {
      const perf = LEARNING_DATA.providerPerformance;
      const top = Object.entries(perf).sort((a, b) => b[1].success - a[1].success).slice(0, 5);
      return {
        sessionCount: LEARNING_DATA.sessionCount,
        totalWords: LEARNING_DATA.totalWordsGenerated,
        topProviders: top.map(([p, s]) => ({ provider: p, success: s.success.toFixed(1), latency: Math.round(s.latency) + 'ms' })),
        topicsLearned: Object.keys(LEARNING_DATA.successfulTopics).length,
        online: this.isOnline
      };
    }

    // ============ AI REQUEST ============

    async ask(prompt, options = {}) {
      const startTime = Date.now();
      this.stats.requests++;
      const cacheKey = this.getCacheKey(prompt, options);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) return { ...cached, cached: true, time: 0 };
      const providers = this.config.autoFallback ? this.config.fallbackOrder : [this.currentProvider];
      for (const provider of providers) {
        if (!this.hasKey(provider)) continue;
        try {
          const result = await this.callProvider(provider, prompt, options);
          this.stats.successes++;
          this.stats.providerUsage[provider] = (this.stats.providerUsage[provider] || 0) + 1;
          const latency = Date.now() - startTime;
          this.recordSuccess(provider, latency);
          const response = { success: true, provider, ...result, time: latency };
          this.cacheResponse(cacheKey, response);
          return response;
        } catch (error) {
          console.log(`Provider ${provider} failed:`, error.message);
          this.recordFailure(provider);
          continue;
        }
      }
      this.stats.failures++;
      return { success: false, error: 'All providers failed', time: Date.now() - startTime };
    }

    async callProvider(provider, prompt, options) {
      const config = this.providers[provider];
      const key = this.getKey(provider);
      switch (provider) {
        case 'groq': return this.callGroq(key, prompt, options);
        case 'cloudflare': return this.callCloudflare(key, prompt, options);
        case 'huggingface': return this.callHuggingFace(key, prompt, options);
        case 'gemini': return this.callGemini(key, prompt, options);
        case 'openrouter': return this.callOpenRouter(key, prompt, options);
        case 'together': return this.callTogether(key, prompt, options);
        case 'replicate': return this.callReplicate(key, prompt, options);
        case 'ollama': return this.callOllama(key, prompt, options);
        case 'perplexity': return this.callPerplexity(key, prompt, options);
        case 'fireworks': return this.callFireworks(key, prompt, options);
        case 'deepseek': return this.callDeepSeek(key, prompt, options);
        case 'mistral': return this.callMistral(key, prompt, options);
        case 'cohere': return this.callCohere(key, prompt, options);
        case 'ai21': return this.callAI21(key, prompt, options);
        case 'xai': return this.callXAI(key, prompt, options);
        case 'nomic': return this.callNomic(key, prompt, options);
        default: throw new Error(`Unknown provider: ${provider}`);
      }
    }

    async callGroq(key, prompt, opts) {
      const response = await fetch(this.providers.groq.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.groq.model, messages: [{ role: 'user', content: prompt }], temperature: opts.temperature || 0.7, max_tokens: opts.maxTokens || 1024 })
      });
      if (!response.ok) throw new Error(`Groq error: ${response.status}`);
      const data = await response.json();
      return { response: data.choices?.[0]?.message?.content || JSON.stringify(data) };
    }

    async callCloudflare(key, prompt, opts) {
      const [accountId, apiToken] = key.split(':');
      if (!accountId || !apiToken) throw new Error('Invalid Cloudflare key format');
      const response = await fetch(`${this.providers.cloudflare.endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error(`Cloudflare error: ${response.status}`);
      const data = await response.json();
      return { response: data.result?.response || data.response || JSON.stringify(data) };
    }

    async callHuggingFace(key, prompt, opts) {
      const response = await fetch(this.providers.huggingface.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: prompt })
      });
      if (!response.ok) throw new Error(`Hugging Face error: ${response.status}`);
      const data = await response.json();
      return { response: Array.isArray(data) ? data[0]?.generated_text : JSON.stringify(data) };
    }

    async callGemini(key, prompt, opts) {
      const response = await fetch(`${this.providers.gemini.endpoint}?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: opts.temperature || 0.7, maxOutputTokens: opts.maxTokens || 1024 } })
      });
      if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
      const data = await response.json();
      return { response: data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data) };
    }

    async callOpenRouter(key, prompt, opts) {
      const response = await fetch(this.providers.openrouter.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': window.location.origin, 'X-Title': 'MXD AI Suite' },
        body: JSON.stringify({ model: this.providers.openrouter.model, messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
      const data = await response.json();
      return { response: data.choices?.[0]?.message?.content || JSON.stringify(data) };
    }

    async callTogether(key, prompt, opts) {
      const response = await fetch(this.providers.together.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.together.model, messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error(`Together error: ${response.status}`);
      const data = await response.json();
      return { response: data.choices?.[0]?.message?.content || JSON.stringify(data) };
    }

    async callReplicate(key, prompt, opts) {
      const response = await fetch(this.providers.replicate.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: this.providers.replicate.model, input: { prompt } })
      });
      if (!response.ok) throw new Error(`Replicate error: ${response.status}`);
      const data = await response.json();
      return { response: data.response || JSON.stringify(data) };
    }

    async callOllama(key, prompt, opts) {
      const response = await fetch(this.providers.ollama.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.ollama.model, prompt, stream: false })
      });
      if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
      const data = await response.json();
      return { response: data.response || JSON.stringify(data) };
    }

    async callPerplexity(key, prompt, opts) {
      const response = await fetch(this.providers.perplexity.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.perplexity.model, messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error(`Perplexity error: ${response.status}`);
      const data = await response.json();
      return { response: data.choices?.[0]?.message?.content || JSON.stringify(data) };
    }

    async callFireworks(key, prompt, opts) {
      const response = await fetch(this.providers.fireworks.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.fireworks.model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1024 })
      });
      if (!response.ok) throw new Error(`Fireworks error: ${response.status}`);
      const data = await response.json();
      return { response: data.choices?.[0]?.message?.content || JSON.stringify(data) };
    }

    async callDeepSeek(key, prompt, opts) {
      const response = await fetch(this.providers.deepseek.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.deepseek.model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 })
      });
      if (!response.ok) throw new Error(`DeepSeek error: ${response.status}`);
      const data = await response.json();
      return { response: data.choices?.[0]?.message?.content || JSON.stringify(data) };
    }

    async callMistral(key, prompt, opts) {
      const response = await fetch(this.providers.mistral.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.mistral.model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 })
      });
      if (!response.ok) throw new Error(`Mistral error: ${response.status}`);
      const data = await response.json();
      return { response: data.choices?.[0]?.message?.content || JSON.stringify(data) };
    }

    async callCohere(key, prompt, opts) {
      const response = await fetch(this.providers.cohere.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.cohere.model, message: prompt })
      });
      if (!response.ok) throw new Error(`Cohere error: ${response.status}`);
      const data = await response.json();
      return { response: data.text || JSON.stringify(data) };
    }

    async callAI21(key, prompt, opts) {
      const response = await fetch(this.providers.ai21.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.ai21.model, messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error(`AI21 error: ${response.status}`);
      const data = await response.json();
      return { response: data.choices?.[0]?.message?.content || JSON.stringify(data) };
    }

    async callXAI(key, prompt, opts) {
      const response = await fetch(this.providers.xai.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.xai.model, messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error(`xAI error: ${response.status}`);
      const data = await response.json();
      return { response: data.choices?.[0]?.message?.content || JSON.stringify(data) };
    }

    async callNomic(key, prompt, opts) {
      const response = await fetch(this.providers.nomic.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.providers.nomic.model, messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error(`Nomic error: ${response.status}`);
      const data = await response.json();
      return { response: data.choices?.[0]?.message?.content || JSON.stringify(data) };
    }

    // ============ CACHE ============

    getCacheKey(prompt, options) { return JSON.stringify({ prompt: prompt.substring(0, 200), options }); }

    getCachedResponse(key) {
      if (!this.config.cacheResponses) return null;
      const cached = this.cache.get(key);
      if (!cached) return null;
      if (Date.now() - cached.timestamp > this.config.cacheTTL) { this.cache.delete(key); return null; }
      return cached.response;
    }

    cacheResponse(key, response) {
      if (!this.config.cacheResponses) return;
      this.cache.set(key, { response, timestamp: Date.now() });
      if (this.cache.size > 100) {
        const oldest = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[2].timestamp).slice(0, 10);
        oldest.forEach(([k]) => this.cache.delete(k));
      }
    }

    clearCache() { this.cache.clear(); }

    // ============ WORD LIST GENERATION ============

    async generateWordList(topic, count = 20, difficulty = 'medium') {
      const learned = this.getSuggestionsForTopic(topic);
      if (learned && learned.confidence > 0.7) {
        console.log(`📚 Using learned data for "${topic}" — confidence: ${(learned.confidence * 100).toFixed(0)}%`);
        return { success: true, words: learned.suggestions.slice(0, count), source: 'learned' };
      }
      const diffPrompt = { easy: 'simple 3-5 letter', medium: '5-8 letter', hard: 'challenging 7-12 letter' };
      const prompt = `Generate ${count} ${diffPrompt[difficulty] || 'medium'} difficulty words for a word search puzzle about "${topic}". 
Only provide the words, one per line, nothing else. No descriptions. Make sure words are 4-12 letters. Separate with newlines.`;
      const result = await this.ask(prompt);
      if (result.success && result.response) {
        const words = result.response.split(/\n/).map(w => w.trim().toUpperCase().replace(/[^A-Z]/g, '')).filter(w => w.length >= 3 && w.length <= 12);
        this.learnFromTopic(topic, words);
        return { success: true, words: words.slice(0, count) };
      }
      return { success: false, words: [], error: result.error };
    }

    async generateBookIdeas(niche, count = 10) {
      const prompt = `Generate ${count} creative book title ideas for the niche "${niche}". Word search, puzzle, activity, and educational book formats work well. Return only titles, one per line, nothing else.`;
      const result = await this.ask(prompt);
      if (result.success && result.response) {
        const ideas = result.response.split(/\n/).map(t => t.trim()).filter(t => t.length > 5 && t.length < 100);
        return { success: true, ideas };
      }
      return { success: false, ideas: [], error: result.error };
    }

    async generateKeywords(topic, count = 20) {
      const prompt = `Generate ${count} relevant keywords for "${topic}" book on Amazon KDP. Include variations, age groups, difficulty levels. Return only keywords, one per line.`;
      const result = await this.ask(prompt);
      if (result.success && result.response) {
        const keywords = result.response.split(/\n/).map(k => k.trim()).filter(k => k.length > 2 && k.length < 50);
        return { success: true, keywords };
      }
      return { success: false, keywords: [], error: result.error };
    }

    async analyzeNiche(niche) {
      const prompt = `Analyze the niche "${niche}" for KDP word search puzzle books. Provide: 1) Competition level (Low/Medium/High), 2) Best age group, 3) Seasonal opportunity, 4) Top 5 related niches. Format as bullet points.`;
      const result = await this.ask(prompt);
      if (result.success && result.response) {
        return { success: true, analysis: result.response };
      }
      return { success: false, analysis: '', error: result.error };
    }

    // ============ STATS ============

    getStats() {
      const total = this.stats.requests || 1;
      return {
        requests: this.stats.requests,
        successes: this.stats.successes,
        failures: this.stats.failures,
        successRate: ((this.stats.successes / total) * 100).toFixed(1) + '%',
        providerUsage: this.stats.providerUsage,
        availableProviders: this.getAvailableCount(),
        totalProviders: Object.keys(this.providers).length,
        cacheSize: this.cache.size,
        activeProvider: this.currentProvider,
        online: this.isOnline,
        learning: this.getLearningStats()
      };
    }

    resetStats() {
      this.stats = { requests: 0, successes: 0, failures: 0, providerUsage: {} };
    }

    // ============ EVENTS ============

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

    getVersion() { return VERSION; }
  }

  window.MXD_AI_INTEGRATOR = new MXDAIIntegrator();
  window.MXDaiIntegrator = MXDAIIntegrator;
  window.FREE_AI_PROVIDERS = FREE_AI_PROVIDERS;
})();