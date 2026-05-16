// swarm-consensus.js — MXD OMNI-NEXUS v11.0 AI Swarm Intelligence
// Multi-API validation to prevent hallucinations
(function() {
  'use strict';

  const SWARM_VERSION = '11.0.0';

  // API Endpoints configuration
  const API_ENDPOINTS = {
    groq: {
      name: 'Groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      free: true,
      speed: 'fastest'
    },
    cerebras: {
      name: 'Cerebras',
      url: 'https://api.cerebras.net/v1/chat/completions',
      model: 'llama-3.3-70b',
      free: true,
      speed: 'fastest'
    },
    togetherai: {
      name: 'Together AI',
      url: 'https://api.together.ai/v1/chat/completions',
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
      free: true,
      speed: 'fast'
    },
    mistral: {
      name: 'Mistral',
      url: 'https://api.mistral.ai/v1/chat/completions',
      model: 'mistral-small-latest',
      free: true,
      speed: 'fast'
    },
    huggingface: {
      name: 'HuggingFace',
      url: 'https://api-inference.huggingface.co/v1/chat/completions',
      model: 'Qwen/Qwen2.5-72B-Instruct',
      free: true,
      speed: 'medium'
    },
    cloudflare: {
      name: 'Cloudflare',
      url: 'https://api.cloudflare.com/client/v4/ai/run/@cf/meta/llama-3.1-8b-instruct',
      free: true,
      speed: 'fastest',
      noKey: true
    }
  };

  // Swear words and inappropriate patterns for filtering
  const FORBIDDEN_PATTERNS = [
    /\b(fuck|shit|ass|dick|piss|cunt|wank|fart|poop|damn|hell|suck)\b/i,
    /\b(kill|die|dead|bomb|gun|drug|sex|nazi|kkk|terror)\b/i,
    /\b(rape|murder|suicide|abuse|attack)\b/i
  ];

  // Hallucination patterns
  const HALLUCINATION_INDICATORS = [
    (text) => text.length < 20 && text.includes('Sure, here'),
    (text) => text.includes('[ERROR]') || text.includes('[IMPORTANT]'),
    (text) => text.match(/^(Yes|No|I can't|I will not)/i) && text.length < 50,
    (text) => text.match(/^As an AI|I'm sorry|I cannot/i)
  ];

  class SwarmConsensus {
    constructor() {
      this.keys = this.loadKeys();
      this.rateLimits = {};
      this.usageStats = {
        requests: 0,
        success: 0,
        failed: 0,
        cacheHits: 0
      };
      this.responseCache = new Map();
      this.cacheTimeout = 60000; // 1 minute cache
      this.init();
    }

    init() {
      console.log(`🧠 Swarm Consensus v${SWARM_VERSION} — AI Brain v11.0`);
      this.startRateLimitMonitor();
    }

    loadKeys() {
      try {
        const stored = localStorage.getItem('mxd_swarm_keys_v11');
        return stored ? JSON.parse(stored) : {};
      } catch (e) {
        return {};
      }
    }

    saveKeys() {
      try {
        localStorage.setItem('mxd_swarm_keys_v11', JSON.stringify(this.keys));
      } catch (e) {}
    }

    setKey(apiId, key) {
      this.keys[apiId] = key.trim();
      this.saveKeys();
    }

    hasKey(apiId) {
      const api = API_ENDPOINTS[apiId];
      if (!api) return false;
      if (api.noKey) return true;
      return this.keys[apiId] && this.keys[apiId].length > 5;
    }

    // Main swarm generation - fires 3 APIs simultaneously
    async generateWords(niche, options = {}) {
      const {
        wordCount = 20,
        difficulty = 'medium',
        language = 'en',
        onProgress
      } = options;

      // Check cache first
      const cacheKey = `words_${niche}_${wordCount}_${difficulty}_${language}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.usageStats.cacheHits++;
        return cached;
      }

      // Get available APIs
      const availableAPIs = Object.keys(API_ENDPOINTS).filter(id => this.hasKey(id));
      
      if (availableAPIs.length === 0) {
        // Use local fallback
        return this.localWordGeneration(niche, wordCount, language);
      }

      // Fire up to 3 APIs simultaneously
      const selectedAPIs = availableAPIs.slice(0, 3);
      const promises = selectedAPIs.map(apiId => this.callAPI(apiId, niche, wordCount, difficulty));

      try {
        if (onProgress) onProgress({ status: 'consulting_ai' });
        
        const results = await Promise.allSettled(promises);
        
        // Filter successful responses
        const validResponses = results
          .filter(r => r.status === 'fulfilled' && r.value && r.value.length > 0)
          .map(r => r.value);

        if (validResponses.length === 0) {
          return this.localWordGeneration(niche, wordCount, language);
        }

        // Merge and purify responses
        const mergedWords = this.mergeResponses(validResponses, niche);
        
        // Validate and filter
        const validatedWords = this.validateWords(mergedWords, wordCount);
        
        // Cache the result
        this.saveToCache(cacheKey, validatedWords);
        this.usageStats.success++;

        return validatedWords;

      } catch (error) {
        console.error('Swarm generation failed:', error);
        this.usageStats.failed++;
        return this.localWordGeneration(niche, wordCount, language);
      }
    }

    async callAPI(apiId, niche, wordCount, difficulty) {
      const api = API_ENDPOINTS[apiId];
      if (!api || !this.hasKey(apiId)) {
        throw new Error(`API ${apiId} not available`);
      }

      // Check rate limits
      if (this.rateLimits[apiId] && Date.now() < this.rateLimits[apiId]) {
        throw new Error(`Rate limited: ${apiId}`);
      }

      const prompt = this.buildPrompt(niche, wordCount, difficulty);
      
      try {
        const response = await fetch(api.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.keys[apiId]}`
          },
          body: JSON.stringify({
            model: api.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 500
          }),
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          if (response.status === 429) {
            this.rateLimits[apiId] = Date.now() + 60000;
            throw new Error('Rate limited');
          }
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Parse words from response
        return this.parseWordsFromResponse(content);

      } catch (error) {
        console.warn(`API ${apiId} failed:`, error.message);
        throw error;
      }
    }

    buildPrompt(niche, wordCount, difficulty) {
      const lengthMap = {
        easy: '3-5 letters',
        medium: '4-8 letters',
        hard: '6-12 letters'
      };

      return `Generate exactly ${wordCount} words related to "${niche}" suitable for a word search puzzle.

Requirements:
- Word length: ${lengthMap[difficulty] || '4-8 letters'}
- Only include single words, no phrases
- Do not include any explanation, just the words separated by commas or new lines
- Do not use markdown formatting, bullet points, or numbered lists
- Format: word1, word2, word3, etc.

Example output:
APPLE, BANANA, CHERRY, GRAPE, ORANGE, PEACH, PLUM, MANGO`;

    }

    parseWordsFromResponse(content) {
      if (!content) return [];
      
      // Remove markdown formatting
      let text = content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/^\s*[-*•]\s*/gm, '')
        .replace(/^\s*\d+[.)]\s*/gm, '');

      // Split by commas, newlines, or other delimiters
      const words = text
        .split(/[,;\n\r]+/)
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length >= 2 && w.length <= 15)
        .filter(w => /^[A-ZÀ-ÿ]+$/i.test(w));

      // Remove duplicates
      return [...new Set(words)];
    }

    mergeResponses(responses, niche) {
      if (responses.length === 1) return responses[0];

      // Count word frequency across responses
      const wordCounts = {};
      const allWords = responses.flat();

      for (const word of allWords) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }

      // Words appearing in multiple responses are more reliable
      const sortedWords = Object.keys(wordCounts).sort((a, b) => {
        // Primary: frequency (higher = more reliable)
        const freqDiff = wordCounts[b] - wordCounts[a];
        if (freqDiff !== 0) return freqDiff;
        // Secondary: alphabetical for consistency
        return a.localeCompare(b);
      });

      return sortedWords;
    }

    validateWords(words, targetCount) {
      if (!words || words.length === 0) return [];

      const validated = words.filter(word => {
        // Check forbidden patterns
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(word)) return false;
        }

        // Check hallucination indicators
        for (const indicator of HALLUCINATION_INDICATORS) {
          if (indicator(word)) return false;
        }

        // Check for gibberish (repeated letters, numbers, etc.)
        if (/^([A-Z])\1+$/.test(word)) return false; // AAA, BBB
        if (/[0-9]/.test(word)) return false; // Contains numbers

        return true;
      });

      // Limit to target count
      return validated.slice(0, targetCount);
    }

    // Local fallback - sophisticated word pattern generator
    localWordGeneration(niche, wordCount, language = 'en') {
      console.log('🧠 Using local word pattern generator (offline mode)');
      
      // Build word database from presets
      const database = this.buildLocalDatabase();
      
      // Find matching categories
      const nicheLower = niche.toLowerCase();
      const matchingCategories = Object.keys(database).filter(cat => 
        cat.toLowerCase().includes(nicheLower) ||
        this.calculateSimilarity(cat.toLowerCase(), nicheLower) > 0.3
      );

      let words = [];
      
      if (matchingCategories.length > 0) {
        // Get words from matching categories
        for (const cat of matchingCategories) {
          words.push(...database[cat]);
        }
      } else {
        // Use related categories
        const related = this.findRelatedCategories(nicheLower, database);
        for (const cat of related) {
          words.push(...database[cat]);
        }
      }

      // Remove duplicates and shuffle
      words = [...new Set(words)];
      this.shuffleArray(words);

      // Limit to target count
      return words.slice(0, wordCount);
    }

    buildLocalDatabase() {
      // Use MXD presets as local database
      if (window.PRESETS) {
        return window.PRESETS;
      }

      // Fallback basic database
      return {
        animals: ['DOG', 'CAT', 'BIRD', 'FISH', 'LION', 'TIGER', 'BEAR', 'WOLF', 'EAGLE', 'SHARK', 'HORSE', 'COW', 'PIG', 'SHEEP', 'RABBIT'],
        fruits: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'MANGO', 'PEACH', 'PLUM', 'CHERRY', 'LEMON', 'LIME', 'MELON', 'KIWI', 'PEAR', 'FIG', 'DATE'],
        sports: ['SOCCER', 'BASKETBALL', 'TENNIS', 'GOLF', 'HOCKEY', 'BASEBALL', 'FOOTBALL', 'SWIMMING', 'RUNNING', 'CYCLING'],
        colors: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BLACK', 'WHITE', 'BROWN', 'GRAY', 'GOLD', 'SILVER'],
        nature: ['TREE', 'FLOWER', 'GRASS', 'LEAF', 'RIVER', 'MOUNTAIN', 'OCEAN', 'BEACH', 'FOREST', 'DESERT', 'LAKE', 'VALLEY'],
        food: ['PIZZA', 'PASTA', 'RICE', 'BREAD', 'MEAT', 'FISH', 'EGG', 'CHEESE', 'MILK', 'APPLE', 'BANANA', 'ORANGE'],
        space: ['STAR', 'MOON', 'SUN', 'PLANET', 'ROCKET', 'SATELLITE', 'ASTEROID', 'COMET', 'GALAXY', 'NEBULA'],
        vehicles: ['CAR', 'TRUCK', 'BUS', 'TRAIN', 'PLANE', 'BOAT', 'BIKE', 'SHIP', 'JET', 'HELICOPTER']
      };
    }

    findRelatedCategories(niche, database) {
      const keywords = {
        animals: ['animal', 'pet', 'wild', 'zoo', 'bird', 'fish', 'dog', 'cat', 'horse', 'lion'],
        food: ['food', 'eat', 'cook', 'meal', 'fruit', 'vegetable', 'meat', 'pizza', 'cake'],
        sports: ['sport', 'game', 'play', 'ball', 'team', 'soccer', 'basketball', 'tennis'],
        nature: ['nature', 'tree', 'flower', 'plant', 'garden', 'forest', 'river', 'mountain'],
        ocean: ['ocean', 'sea', 'water', 'fish', 'beach', 'wave', 'shark', 'whale', 'dolphin'],
        space: ['space', 'star', 'planet', 'moon', 'rocket', 'galaxy', 'nasa', 'astronaut'],
        vehicles: ['car', 'truck', 'bus', 'train', 'plane', 'boat', 'bike', 'vehicle'],
        colors: ['color', 'red', 'blue', 'green', 'paint', 'rainbow', 'bright']
      };

      const related = [];
      for (const [category, terms] of Object.entries(keywords)) {
        for (const term of terms) {
          if (niche.includes(term) || term.includes(niche)) {
            if (database[category] && !related.includes(category)) {
              related.push(category);
            }
          }
        }
      }

      return related;
    }

    calculateSimilarity(str1, str2) {
      // Simple Levenshtein-based similarity
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;

      if (longer.length === 0) return 1.0;

      const costs = [];
      for (let i = 0; i <= shorter.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= longer.length; j++) {
          if (i === 0) {
            costs[j] = j;
          } else if (j > 0) {
            let newValue = costs[j - 1];
            if (shorter[i - 1] !== longer[j - 1]) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) costs[shorter.length] = lastValue;
      }

      return (longer.length - costs[shorter.length]) / longer.length;
    }

    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    // Cache management
    getFromCache(key) {
      const cached = this.responseCache.get(key);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      return null;
    }

    saveToCache(key, data) {
      this.responseCache.set(key, { data, timestamp: Date.now() });
    }

    // Rate limit monitoring
    startRateLimitMonitor() {
      setInterval(() => {
        for (const apiId of Object.keys(this.rateLimits)) {
          if (Date.now() >= this.rateLimits[apiId]) {
            delete this.rateLimits[apiId];
          }
        }
      }, 60000);
    }

    // Generate keywords for KDP
    async generateKeywords(topic, count = 30) {
      return this.generateWords(`${topic} keywords`, {
        wordCount: count,
        difficulty: 'medium'
      });
    }

    // Generate book title ideas
    async generateBookTitles(niche, count = 10) {
      const titles = await this.generateWords(`book titles about ${niche}`, {
        wordCount: count,
        difficulty: 'hard'
      });

      // Transform single words into book titles
      const patterns = [
        (w) => `The Ultimate ${w} Book`,
        (w) => `${w} Puzzle Challenge`,
        (w) => `101 ${w} Puzzles`,
        (w) => `The Complete ${w} Guide`,
        (w) => `${w} Activity Book`,
        (w) => `${w} For Kids`,
        (w) => `Master ${w} Today`,
        (w) => `${w} Learning Fun`
      ];

      return titles.map(word => {
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        return pattern(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
      });
    }

    // Get usage statistics
    getStats() {
      return {
        ...this.usageStats,
        availableAPIs: Object.keys(API_ENDPOINTS).filter(id => this.hasKey(id)).length,
        totalAPIs: Object.keys(API_ENDPOINTS).length,
        cacheSize: this.responseCache.size
      };
    }

    // Check API health
    async checkHealth(apiId) {
      if (!this.hasKey(apiId)) {
        return { status: 'no_key', latency: null };
      }

      const start = Date.now();
      try {
        await this.callAPI(apiId, 'test', 3, 'easy');
        return { status: 'healthy', latency: Date.now() - start };
      } catch (e) {
        return { status: 'error', latency: null, error: e.message };
      }
    }
  }

  // Initialize global swarm
  window.SwarmConsensus = new SwarmConsensus();
  window.MXD_SWARM = SwarmConsensus;

})();