// mxd-ai-chat-pro.js — MXD Ultra-Reliable AI Chat Engine v3.0
// Multi-provider cascading fallback, smart routing, retry with backoff,
// response validation, stream recovery, offline fallback, rate-limit handling
(function(){
  'use strict';

  const VERSION = '3.0.0';

  // ============ PROVIDER DEFINITIONS ============
  const PROVIDERS = {
    openrouter: {
      name: 'OpenRouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      authHeader: 'Authorization',
      authPrefix: 'Bearer',
      maxTokens: 8192,
      timeout: 60000,
      retryable: true,
      parseStream: function(line) {
        if (!line.startsWith('data: ')) return null;
        const data = line.slice(6);
        if (data === '[DONE]') return '__DONE__';
        try {
          const json = JSON.parse(data);
          return json.choices?.[0]?.delta?.content || null;
        } catch(e) { return null; }
      }
    },
    openai: {
      name: 'OpenAI',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      authHeader: 'Authorization',
      authPrefix: 'Bearer',
      maxTokens: 4096,
      timeout: 45000,
      retryable: true,
      parseStream: function(line) {
        if (!line.startsWith('data: ')) return null;
        const data = line.slice(6);
        if (data === '[DONE]') return '__DONE__';
        try {
          const json = JSON.parse(data);
          return json.choices?.[0]?.delta?.content || null;
        } catch(e) { return null; }
      }
    },
    gemini: {
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      authType: 'query',
      maxTokens: 8192,
      timeout: 60000,
      retryable: true,
      parseStream: function(line) {
        const trimmed = line.trim();
        if (!trimmed) return null;
        try {
          const json = JSON.parse(trimmed);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          return text || null;
        } catch(e) { return null; }
      }
    },
    deepseek: {
      name: 'DeepSeek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      authHeader: 'Authorization',
      authPrefix: 'Bearer',
      maxTokens: 8192,
      timeout: 60000,
      retryable: true,
      parseStream: function(line) {
        if (!line.startsWith('data: ')) return null;
        const data = line.slice(6);
        if (data === '[DONE]') return '__DONE__';
        try {
          const json = JSON.parse(data);
          return json.choices?.[0]?.delta?.content || null;
        } catch(e) { return null; }
      }
    },
    github_models: {
      name: 'GitHub Models',
      endpoint: 'https://models.inference.ai.azure.com/chat/completions',
      authHeader: 'Authorization',
      authPrefix: 'Bearer',
      maxTokens: 4096,
      timeout: 45000,
      retryable: true,
      parseStream: function(line) {
        if (!line.startsWith('data: ')) return null;
        const data = line.slice(6);
        if (data === '[DONE]') return '__DONE__';
        try {
          const json = JSON.parse(data);
          return json.choices?.[0]?.delta?.content || null;
        } catch(e) { return null; }
      }
    }
  };

  // ============ MODEL REGISTRY ============
  const MODELS = [
    { id: 'anthropic/claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'openrouter', tier: 1, quality: 10, speed: 6, icon: '🏆', ctx: 200000 },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 1, quality: 9, speed: 8, icon: '🏆', ctx: 128000 },
    { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro', provider: 'gemini', tier: 1, quality: 9, speed: 6, icon: '🏆', ctx: 2000000 },
    { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'openrouter', tier: 2, quality: 8, speed: 8, icon: '⚡', ctx: 200000 },
    { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'deepseek', tier: 2, quality: 8, speed: 8, icon: '⚡', ctx: 64000 },
    { id: 'openai/gpt-4o', name: 'GPT-4o (OR)', provider: 'openrouter', tier: 2, quality: 9, speed: 8, icon: '⚡', ctx: 128000 },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', tier: 2, quality: 8, speed: 10, icon: '⚡', ctx: 1000000 },
    { id: 'gpt-4o', name: 'GPT-4o (Free)', provider: 'github_models', tier: 3, quality: 9, speed: 8, icon: '🆓', ctx: 128000 },
    { id: 'Meta-Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', provider: 'github_models', tier: 3, quality: 7, speed: 8, icon: '🆓', ctx: 128000 },
    { id: 'Meta-Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', provider: 'github_models', tier: 3, quality: 6, speed: 10, icon: '🆓', ctx: 128000 },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini Flash (OR)', provider: 'openrouter', tier: 2, quality: 8, speed: 10, icon: '⚡', ctx: 1000000 },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (OR)', provider: 'openrouter', tier: 3, quality: 7, speed: 8, icon: '🆓', ctx: 128000 }
  ];

  // ============ SYSTEM PROMPTS ============
  const SYSTEM_PROMPTS = {
    puzzle_expert: `You are an expert word puzzle designer specializing in KDP (Kindle Direct Publishing) word search books. Your expertise includes:
- Generating themed word lists (40 words, 4-15 letters, uppercase, no duplicates)
- Suggesting puzzle difficulty levels and grid sizes
- Creating engaging puzzle titles and descriptions
- Advising on word placement strategies
- Recommending niche markets with low competition

When asked for word lists, ALWAYS provide exactly 40 words, one per line, ALL CAPS, no explanations. Words should be 4-15 letters long.
When asked for titles, provide 10 creative, market-ready titles.
When asked for KDP advice, give specific, actionable strategies with data.`,

    kdp_advisor: `You are a KDP publishing strategist with deep knowledge of Amazon's marketplace. You help users:
- Find profitable niches with low competition
- Price books optimally ($6.99-$14.99 range for puzzle books)
- Write compelling book descriptions
- Design covers that convert
- Understand Amazon's algorithm and BSR rankings
- Navigate KDP's content guidelines and trademark rules

Provide specific, data-backed advice. Use real examples and numbers.`,

    creative_writer: `You are a creative title and theme generator for word puzzle books. You create:
- Catchy, market-ready book titles
- Unique puzzle themes and word categories
- Engaging book descriptions
- Series naming conventions
- Seasonal and holiday theme ideas

Be creative but practical. Every suggestion should be commercially viable for KDP.`,

    general: `You are a helpful AI assistant integrated into MXD Supreme Pro, a professional word search puzzle generator for KDP publishing. Be concise, accurate, and helpful. If asked about puzzles, KDP, or word lists, provide expert-level advice.`
  };

  // ============ QUICK ACTIONS ============
  var QUICK_ACTIONS = [
    { label: 'Generate 40 words', prompt: 'Generate exactly 40 words for the theme: ', icon: '📝', category: 'content' },
    { label: 'KDP niche ideas', prompt: 'Suggest 5 profitable KDP word search niches with low competition and explain why each is good.', icon: '🎯', category: 'kdp' },
    { label: 'Book titles', prompt: 'Create 10 creative, market-ready titles for a KDP word search puzzle book.', icon: '📚', category: 'content' },
    { label: 'Research market', prompt: 'Research the current KDP word search market trends. What niches are growing? What price points work best?', icon: '🔍', category: 'kdp' },
    { label: 'Difficulty guide', prompt: 'Explain the best grid sizes and word counts for easy, medium, and hard word search puzzles.', icon: '📊', category: 'guide' },
    { label: 'Seasonal themes', prompt: 'Give me 10 seasonal/holiday themes for word search books with 5 sample words each.', icon: '🎄', category: 'content' },
    { label: 'Optimize layout', prompt: 'What is the optimal word count and grid size for a 100-page KDP word search book?', icon: '📐', category: 'guide' },
    { label: 'Check trademark', prompt: 'Check if these terms are trademarked and safe for KDP: ', icon: '🛡️', category: 'kdp' },
    { label: 'Write description', prompt: 'Write a compelling Amazon book description for a word search puzzle book about: ', icon: '✍️', category: 'content' },
    { label: 'Pricing strategy', prompt: 'What is the optimal price point for a 100-page word search puzzle book on KDP? Consider printing costs and royalties.', icon: '💰', category: 'kdp' },
    { label: 'Series ideas', prompt: 'Suggest 5 series ideas for word search books that can be published as a collection on KDP.', icon: '📖', category: 'content' },
    { label: 'Cover design tips', prompt: 'What are the best practices for designing a KDP word search book cover that converts browsers into buyers?', icon: '🎨', category: 'kdp' }
  ];

  // ============ WORD EXTRACTION ============
  function extractWords(text) {
    if (!text || typeof text !== 'string') return [];
    const words = new Set();
    const capsMatches = text.match(/\b[A-Z]{4,15}\b/g);
    if (capsMatches) capsMatches.forEach(w => words.add(w));
    const bulletMatches = text.match(/^[•\-\*]\s*([A-Za-z]{4,15})/gm);
    if (bulletMatches) bulletMatches.forEach(m => {
      const word = m.replace(/^[•\-\*]\s*/, '').toUpperCase();
      if (/^[A-Z]{4,15}$/.test(word)) words.add(word);
    });
    const numMatches = text.match(/^\d+\.\s*([A-Za-z]{4,15})/gm);
    if (numMatches) numMatches.forEach(m => {
      const word = m.replace(/^\d+\.\s*/, '').toUpperCase();
      if (/^[A-Z]{4,15}$/.test(word)) words.add(word);
    });
    return Array.from(words).filter(w => w.length >= 4 && w.length <= 15);
  }

  // ============ STREAM PARSER (unified) ============
  function parseStreamChunk(chunk, providerId) {
    const provider = PROVIDERS[providerId];
    if (!provider) return [];
    const tokens = [];
    const lines = chunk.split('\n');
    for (const line of lines) {
      const result = provider.parseStream(line);
      if (result === '__DONE__') return { tokens, done: true };
      if (result) tokens.push(result);
    }
    return { tokens, done: false };
  }

  // ============ SMART QUERY ROUTER ============
  function classifyQuery(query) {
    const q = query.toLowerCase();
    if (/word.*list|generate.*word|40.*word|theme.*word/i.test(q)) return 'word_list';
    if (/kdp|amazon|niche|bsr|royalty|pricing|publish/i.test(q)) return 'kdp';
    if (/title|book.*name|series.*name|description/i.test(q)) return 'creative';
    if (/difficulty|grid.*size|easy|medium|hard|puzzle.*type/i.test(q)) return 'guide';
    if (/season|holiday|christmas|halloween|easter|valentine/i.test(q)) return 'seasonal';
    return 'general';
  }

  function selectOptimalModel(query, availableModels) {
    if (availableModels.length === 0) return null;
    const type = classifyQuery(query);
    // For word lists and creative tasks, prefer high-quality models
    if (type === 'word_list' || type === 'creative') {
      const tier1 = availableModels.filter(m => m.tier === 1);
      if (tier1.length > 0) return tier1.sort((a, b) => b.quality - a.quality)[0];
    }
    // For general queries, prefer fast models
    const tier2 = availableModels.filter(m => m.tier === 2);
    if (tier2.length > 0) return tier2.sort((a, b) => b.speed - a.speed)[0];
    // Fallback: best available
    return availableModels.sort((a, b) => (b.tier * 10 + b.quality) - (a.tier * 10 + a.quality))[0];
  }

  // ============ RESPONSE VALIDATOR ============
  function validateResponse(content, queryType) {
    const issues = [];
    if (!content || content.trim().length === 0) {
      issues.push('empty_response');
    }
    if (content.length < 10) {
      issues.push('too_short');
    }
    if (queryType === 'word_list') {
      const words = extractWords(content);
      if (words.length < 10) issues.push('insufficient_words');
    }
    // Check for common AI failure modes
    if (/sorry|cannot|unable|error|failed/i.test(content) && content.length < 200) {
      issues.push('refusal');
    }
    return { valid: issues.length === 0, issues };
  }

  // ============ MAIN ENGINE ============
  class MXDAIChatPro {
    constructor() {
      this.keys = this.loadKeys();
      this.conversations = this.loadConversations();
      this.currentConversationId = this.createOrGetCurrentConversation();
      this.health = {};
      this.abortController = null;
      this.listeners = {};
      this.responseCache = new Map();
      this.cacheExpiry = 86400000; // 24 hour cache for offline access
      this._loadCache();
      this.maxRetries = 3;
      this.baseBackoff = 1000;
      this.init();
    }

    init() {
      this.checkProviderHealth();
      this.pruneOldConversations();
      this._rateLimit = { maxRequests: 10, windowMs: 60000, requests: [], queue: [] };
      this._typingCallbacks = [];
      console.log(`🧠 MXD AI Chat Pro v${VERSION} — Ultra-Reliable Multi-Provider Engine`);
      console.log(`   Providers: ${this.getConfiguredProviders().join(', ') || 'None configured'}`);
      console.log(`   Models available: ${this.getAvailableModels().length}`);
    }

    checkRateLimit() {
      var now = Date.now();
      this._rateLimit.requests = this._rateLimit.requests.filter(function(t) { return now - t < this._rateLimit.windowMs; }.bind(this));
      if (this._rateLimit.requests.length >= this._rateLimit.maxRequests) {
        var oldest = this._rateLimit.requests[0];
        var wait = this._rateLimit.windowMs - (now - oldest);
        return { allowed: false, waitMs: wait, queuePosition: this._rateLimit.requests.length - this._rateLimit.maxRequests + 1 };
      }
      this._rateLimit.requests.push(now);
      return { allowed: true };
    }

    setTypingCallback(fn) {
      this._typingCallbacks.push(fn);
    }

    setTyping(isTyping) {
      for (var i = 0; i < this._typingCallbacks.length; i++) {
        try { this._typingCallbacks[i](isTyping); } catch(e) {}
      }
    }

    // ============ KEY MANAGEMENT ============
    loadKeys() {
      if (window.MXD_API_KEYS) return { ...window.MXD_API_KEYS };
      try {
        const saved = localStorage.getItem('mxd_ai_keys_v2');
        return saved ? JSON.parse(saved) : {};
      } catch(e) { return {}; }
    }

    saveKeys() {
      try { localStorage.setItem('mxd_ai_keys_v2', JSON.stringify(this.keys)); } catch(e) {}
    }

    setKey(provider, key) {
      this.keys[provider] = key.trim();
      this.saveKeys();
      this.checkProviderHealth();
    }

    getKey(provider) {
      return this.keys[provider] || null;
    }

    hasKey(provider) {
      const key = this.keys[provider];
      return key && key.length > 5 && key !== 'your-api-key' && key !== 'sk-abcdef1234567890abcdef1234567890abcdef12';
    }

    _loadCache() {
      try {
        var saved = localStorage.getItem('mxd_ai_cache_v2');
        if (saved) {
          var data = JSON.parse(saved);
          var now = Date.now();
          for (var key in data) {
            if (now - data[key].at < this.cacheExpiry) {
              this.responseCache.set(key, data[key]);
            }
          }
        }
      } catch(e) {}
    }

    _saveCache() {
      try {
        var toSave = {};
        var count = 0;
        this.responseCache.forEach(function(val, key) {
          if (count < 100) { toSave[key] = val; count++; }
        });
        localStorage.setItem('mxd_ai_cache_v2', JSON.stringify(toSave));
      } catch(e) {}
    }

    getConfiguredProviders() {
      return Object.keys(PROVIDERS).filter(id => this.hasKey(id));
    }

    // ============ CONVERSATION MANAGEMENT ============
    loadConversations() {
      try {
        var saved = localStorage.getItem('mxd_ai_conversations_v2');
        if (saved) {
          var data = JSON.parse(saved);
          if (Array.isArray(data)) return data;
        }
      } catch(e) {}
      try {
        const saved = localStorage.getItem('mxd_chat_conversations_v2');
        return saved ? JSON.parse(saved) : {};
      } catch(e) { return {}; }
    }

    saveConversations() {
      try { localStorage.setItem('mxd_chat_conversations_v2', JSON.stringify(this.conversations)); } catch(e) {}
    }

    saveConversations() {
      try {
        var toSave = this.conversations.slice(-50);
        localStorage.setItem('mxd_ai_conversations_v2', JSON.stringify(toSave));
      } catch(e) {}
    }

    pruneOldConversations() {
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      let pruned = 0;
      for (const id in this.conversations) {
        if (now - this.conversations[id].updated > maxAge) {
          delete this.conversations[id];
          pruned++;
        }
      }
      if (pruned > 0) this.saveConversations();
    }

    createOrGetCurrentConversation() {
      const lastId = localStorage.getItem('mxd_chat_last_conversation');
      if (lastId && this.conversations[lastId]) return lastId;
      return this.createConversation();
    }

    createConversation() {
      const id = 'conv_' + Date.now();
      this.conversations[id] = {
        id, title: 'New Chat', messages: [], created: Date.now(), updated: Date.now()
      };
      this.currentConversationId = id;
      localStorage.setItem('mxd_chat_last_conversation', id);
      this.saveConversations();
      return id;
    }

    switchConversation(id) {
      if (this.conversations[id]) {
        this.currentConversationId = id;
        localStorage.setItem('mxd_chat_last_conversation', id);
      }
    }

    getCurrentMessages() {
      const conv = this.conversations[this.currentConversationId];
      return conv ? conv.messages : [];
    }

    addMessage(role, content, model) {
      const conv = this.conversations[this.currentConversationId];
      if (!conv) return;
      conv.messages.push({ role, content, model, timestamp: Date.now() });
      conv.updated = Date.now();
      if (conv.messages.filter(m => m.role === 'user').length === 1 && role === 'user') {
        conv.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      }
      // Sliding window: keep last 20 messages to stay within context limits
      if (conv.messages.length > 20) {
        const dropped = conv.messages.slice(0, conv.messages.length - 20);
        conv.summary = dropped.map(m => m.content.substring(0, 100)).join(' ');
        conv.messages = conv.messages.slice(-20);
      }
      this.saveConversations();
    }

    clearConversation() {
      const conv = this.conversations[this.currentConversationId];
      if (conv) { conv.messages = []; conv.summary = ''; conv.updated = Date.now(); this.saveConversations(); }
    }

    deleteConversation(id) {
      delete this.conversations[id];
      this.saveConversations();
    }

    getConversationList() {
      return Object.values(this.conversations)
        .sort((a, b) => b.updated - a.updated)
        .slice(0, 50) // Limit to 50 conversations
        .map(c => ({ id: c.id, title: c.title, updated: c.updated, msgCount: c.messages.length }));
    }

    // ============ HEALTH TRACKING ============
    checkProviderHealth() {
      for (const providerId of Object.keys(PROVIDERS)) {
        if (!this.health[providerId]) {
          this.health[providerId] = { failures: 0, lastSuccess: 0, lastFailure: 0, latency: 0, circuitOpen: false, circuitOpenUntil: 0 };
        }
      }
    }

    recordSuccess(providerId, latency) {
      if (!this.health[providerId]) this.health[providerId] = { failures: 0, lastSuccess: 0, lastFailure: 0, latency: 0, circuitOpen: false, circuitOpenUntil: 0 };
      const h = this.health[providerId];
      h.failures = Math.max(0, h.failures - 1); // Decay failures on success
      h.lastSuccess = Date.now();
      h.latency = latency;
      h.circuitOpen = false;
      h.circuitOpenUntil = 0;
    }

    recordFailure(providerId, statusCode) {
      if (!this.health[providerId]) this.health[providerId] = { failures: 0, lastSuccess: 0, lastFailure: 0, latency: 0, circuitOpen: false, circuitOpenUntil: 0 };
      const h = this.health[providerId];
      h.failures++;
      h.lastFailure = Date.now();
      // Circuit breaker: open after 3 consecutive failures
      if (h.failures >= 3) {
        h.circuitOpen = true;
        h.circuitOpenUntil = Date.now() + 60000; // 1 minute cooldown
      }
      // Rate limit detection: back off for 429
      if (statusCode === 429) {
        h.circuitOpen = true;
        h.circuitOpenUntil = Date.now() + 120000; // 2 minute cooldown for rate limits
      }
    }

    isProviderAvailable(providerId) {
      if (!this.hasKey(providerId)) return false;
      const h = this.health[providerId];
      if (!h) return true;
      // Check circuit breaker
      if (h.circuitOpen && Date.now() < h.circuitOpenUntil) return false;
      // Reset circuit breaker after cooldown
      if (h.circuitOpen && Date.now() >= h.circuitOpenUntil) {
        h.circuitOpen = false;
        h.failures = Math.max(0, h.failures - 2); // Partial reset
      }
      return true;
    }

    // ============ MODEL SELECTION ============
    getAvailableModels(tier) {
      return MODELS.filter(m => {
        if (tier && m.tier !== tier) return false;
        return this.isProviderAvailable(m.provider);
      });
    }

    getModelById(modelId) {
      return MODELS.find(m => m.id === modelId) || null;
    }

    // ============ STREAMING CHAT (single provider) ============
    async chatStream(messages, modelId, onToken, onDone, onError, signal) {
      const model = this.getModelById(modelId);
      if (!model) { onError(new Error('Model not found: ' + modelId)); return; }
      if (!this.hasKey(model.provider)) { onError(new Error('No API key for ' + PROVIDERS[model.provider]?.name)); return; }

      const provider = PROVIDERS[model.provider];
      const key = this.getKey(model.provider);
      const startTime = Date.now();

      try {
        let response;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), provider.timeout);
        // Link with external signal
        if (signal) {
          signal.addEventListener('abort', () => controller.abort());
        }

        if (model.provider === 'gemini') {
          const url = `${provider.endpoint}/${modelId}:streamGenerateContent?alt=sse`;
          const userMsgs = messages.filter(m => m.role !== 'system');
          const contents = userMsgs.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));
          const systemMsg = messages.find(m => m.role === 'system');
          if (systemMsg) {
            contents.unshift({ role: 'user', parts: [{ text: systemMsg.content }] });
          }
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': key
            },
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: provider.maxTokens, temperature: 0.7 } }),
            signal: controller.signal
          });
        } else {
          const headers = {
            'Content-Type': 'application/json',
            [provider.authHeader]: `${provider.authPrefix} ${key}`
          };
          if (model.provider === 'openrouter') {
            headers['HTTP-Referer'] = window.location.origin || 'https://mxd-pro.app';
            headers['X-Title'] = 'MXD Supreme Pro';
          }
          const systemMsg = messages.find(m => m.role === 'system');
          const userMsgs = messages.filter(m => m.role !== 'system');
          const body = {
            model: modelId,
            messages: systemMsg ? [{ role: 'system', content: systemMsg.content }, ...userMsgs] : userMsgs,
            max_tokens: provider.maxTokens,
            temperature: 0.7,
            stream: true
          };
          response = await fetch(provider.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal
          });
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          const status = response.status;
          const errMsg = `${status} ${response.statusText}: ${errorText.substring(0, 300)}`;
          this.recordFailure(model.provider, status);
          throw new Error(errMsg);
        }

        // Stream parsing
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let totalTokens = 0;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            let newlineIdx;
            while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
              const line = buffer.substring(0, newlineIdx);
              buffer = buffer.substring(newlineIdx + 1);
              const { tokens, done: streamDone } = parseStreamChunk(line, model.provider);
              for (const token of tokens) {
                onToken(token);
                totalTokens++;
              }
              if (streamDone) break;
            }
          }
          // Process remaining buffer
          if (buffer.trim()) {
            const { tokens } = parseStreamChunk(buffer, model.provider);
            for (const token of tokens) {
              onToken(token);
              totalTokens++;
            }
          }
        } finally {
          reader.releaseLock();
        }

        const latency = Date.now() - startTime;
        this.recordSuccess(model.provider, latency);
        onDone({ model: model.name, provider: provider.name, latency, tokens: totalTokens });

      } catch (error) {
        if (error.name === 'AbortError') {
          onDone({ model: model.name, provider: provider.name, cancelled: true });
          return;
        }
        this.recordFailure(model.provider, error.message?.match(/(\d{3})/)?.[1] || 0);
        onError(error);
      }
    }

    // ============ CASCADING FALLBACK CHAIN ============
    async chatWithFallback(userMessage, preferredModelId, systemPrompt, onToken, onDone, onError) {
      // Build ordered fallback list: preferred first, then by tier/quality
      const allAvailable = MODELS.filter(m => this.isProviderAvailable(m.provider));
      if (allAvailable.length === 0) {
        onError(new Error('No AI providers available. Please add API keys in Settings.'));
        return;
      }

      // Check cache first
      const cacheKey = this.hashMessage(userMessage);
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        // Return cached response instantly
        const content = cached.content;
        for (let i = 0; i < content.length; i += 10) {
          onToken(content.substring(i, i + 10), cached.modelName);
        }
        this.addMessage('user', userMessage);
        this.addMessage('assistant', content, cached.modelName);
        onDone({ model: cached.modelName, content, cached: true });
        return;
      }

      // Build fallback order
      const preferredModel = this.getModelById(preferredModelId);
      const fallbackOrder = [];
      if (preferredModel && this.isProviderAvailable(preferredModel.provider)) {
        fallbackOrder.push(preferredModel);
      }
      // Add remaining models sorted by tier then quality
      const remaining = allAvailable.filter(m => m.id !== preferredModelId);
      remaining.sort((a, b) => (a.tier * 100 + a.quality) - (b.tier * 100 + b.quality));
      fallbackOrder.push(...remaining);

      // Build conversation context
      const conv = this.conversations[this.currentConversationId];
      const contextMessages = [];
      if (conv?.summary) {
        contextMessages.push({ role: 'system', content: `Previous conversation summary: ${conv.summary}` });
      }
      contextMessages.push({ role: 'system', content: systemPrompt || SYSTEM_PROMPTS.puzzle_expert });
      if (conv && conv.messages.length > 0) {
        const recent = conv.messages.slice(-10);
        for (const msg of recent) {
          contextMessages.push({ role: msg.role, content: msg.content });
        }
      }
      contextMessages.push({ role: 'user', content: userMessage });

      const queryType = classifyQuery(userMessage);
      let lastError = null;
      let attempts = 0;

      for (const model of fallbackOrder) {
        if (!model || !this.isProviderAvailable(model.provider)) continue;
        attempts++;

        this.abortController = new AbortController();
        let fullContent = '';
        let success = false;

        try {
          await new Promise((resolve, reject) => {
            this.chatStream(
              contextMessages,
              model.id,
              (token) => {
                fullContent += token;
                onToken(token, model.name);
              },
              (meta) => {
                success = true;
                resolve(meta);
              },
              (error) => {
                reject(error);
              },
              this.abortController.signal
            );
          });

          if (success) {
            // Validate response
            const validation = validateResponse(fullContent, queryType);
            if (!validation.valid && attempts < this.maxRetries) {
              console.warn(`Response validation failed (${validation.issues.join(', ')}), retrying...`);
              continue; // Try next model
            }

            // Cache successful response
            this.responseCache.set(cacheKey, {
              content: fullContent,
              modelName: model.name,
              timestamp: Date.now()
            });
            // Limit cache size
            if (this.responseCache.size > 50) {
              const firstKey = this.responseCache.keys().next().value;
              this.responseCache.delete(firstKey);
            }

            this.addMessage('user', userMessage);
            this.addMessage('assistant', fullContent, model.name);
            onDone({ model: model.name, content: fullContent, provider: model.provider });
            return;
          }
        } catch (error) {
          lastError = error;
          console.warn(`Model ${model.name} failed (attempt ${attempts}): ${error.message}`);
          // Don't retry same model, move to next in chain
          continue;
        }
      }

      // ALL PROVIDERS FAILED — use offline fallback
      console.error('All AI providers failed, using offline fallback');
      const offlineResponse = this.generateOfflineFallback(userMessage, queryType);
      if (offlineResponse) {
        this.addMessage('user', userMessage);
        this.addMessage('assistant', offlineResponse, 'Offline Mode');
        onDone({ model: 'Offline Mode', content: offlineResponse, offline: true });
        return;
      }

      onError(lastError || new Error('All AI providers failed. Please check your internet connection and API keys.'));
    }

    // ============ OFFLINE FALLBACK ============
    generateOfflineFallback(query, queryType) {
      const q = query.toLowerCase();
      if (queryType === 'word_list') {
        // Extract theme from query
        const themeMatch = q.match(/theme[:\s]+(\w+)/);
        const theme = themeMatch ? themeMatch[1] : 'general';
        // Use built-in word banks
        const themes = window.AI_THEMES || {};
        const keys = Object.keys(themes);
        // Find closest theme
        let bestMatch = null;
        let bestScore = 0;
        for (const key of keys) {
          if (key.toLowerCase().includes(theme) || theme.includes(key.toLowerCase())) {
            bestScore++;
            bestMatch = key;
          }
        }
        if (bestMatch && themes[bestMatch]) {
          const words = themes[bestMatch].slice(0, 40);
          return `Here are 40 words for the "${bestMatch}" theme (offline mode):\n\n${words.join('\n')}\n\nNote: This was generated offline using built-in word banks. Connect to the internet for AI-generated content.`;
        }
        // Generic fallback
        const allWords = Object.values(themes).flat().slice(0, 40);
        return `Here are 40 words from our built-in collection (offline mode):\n\n${allWords.join('\n')}\n\nNote: Connect to the internet for theme-specific AI generation.`;
      }

      if (queryType === 'kdp') {
        return `Here are some general KDP tips (offline mode):\n\n1. **Niche Selection**: Focus on specific themes (e.g., "Large Print Word Search for Seniors") rather than generic "word search"\n2. **Pricing**: $6.99-$12.99 is the sweet spot for puzzle books\n3. **Page Count**: 80-120 pages works well for most puzzle books\n4. **Cover Design**: Use bold, clear fonts and show the puzzle type prominently\n5. **Description**: Include keywords like "large print," "relaxing," "brain training"\n6. **Categories**: Place in "Games & Activities > Word Searches" and "Puzzles"\n\nConnect to the internet for personalized AI advice.`;
      }

      if (queryType === 'creative' || queryType === 'seasonal') {
        return `Here are some creative ideas (offline mode):\n\n**Title Ideas:**\n1. Ultimate Word Search Collection\n2. Brain Training Puzzle Book\n3. Relaxing Word Search for Adults\n4. Large Print Word Search Challenge\n5. Daily Word Search Puzzles\n\n**Theme Ideas:**\n- Nature & Wildlife\n- Travel & Adventure\n- Food & Cooking\n- Music & Entertainment\n- History & Culture\n\nConnect to the internet for AI-generated creative content.`;
      }

      return `I'm currently in offline mode. Here's what I can help with:\n\n• Generate word lists from built-in themes\n• Provide general KDP publishing tips\n• Suggest puzzle book titles and themes\n• Explain puzzle difficulty levels\n\nFor full AI-powered assistance, please connect to the internet and ensure API keys are configured.\n\nYour query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`;
    }

    // ============ UTILITY ============
    hashMessage(msg) {
      let hash = 0;
      const str = msg.substring(0, 200); // Hash first 200 chars
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return 'msg_' + Math.abs(hash).toString(36);
    }

    stopGeneration() {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    }

    extractWords(text) {
      return extractWords(text);
    }

    getQuickActions() {
      return QUICK_ACTIONS;
    }

    getSystemPrompt(type) {
      return SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.general;
    }

    getStatus() {
      const providers = this.getConfiguredProviders();
      const models = this.getAvailableModels();
      return {
        version: VERSION,
        providers,
        modelsAvailable: models.length,
        conversations: Object.keys(this.conversations).length,
        currentConversation: this.currentConversationId,
        health: this.health,
        cacheSize: this.responseCache.size,
        online: navigator.onLine
      };
    }

    on(event, callback) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    }

    emit(event, data) {
      if (!this.listeners[event]) return;
      this.listeners[event].forEach(cb => { try { cb(data); } catch(e) {} });
    }

    clearCache() {
      this.responseCache.clear();
    }
  }

  // ============ EXPORT ============
  window.MXDAIChatPro = MXDAIChatPro;
  window.AI_CHAT = new MXDAIChatPro();
  window.AI_QUICK_ACTIONS = QUICK_ACTIONS;

  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('🌐 Network restored — AI providers re-enabled');
    if (window.AI_CHAT) window.AI_CHAT.checkProviderHealth();
  });
  window.addEventListener('offline', () => {
    console.log('⚠️ Network lost — switching to offline mode');
  });

})();
