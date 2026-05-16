// mxd-word-processor-vortex.js — Ultimate Word Processor (30x Enhanced)
// NLP validation, pattern recognition, smart suggestions, intelligent analysis
(function(){
  'use strict';

  const VERSION = '30.0.0';

  const LANGUAGES = {
    EN: { code: 'en', name: 'English', letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    ES: { code: 'es', name: 'Spanish', letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ' },
    FR: { code: 'fr', name: 'French', letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÄÈÉÊËÎÏÔÙÛÜŸ' },
    DE: { code: 'de', name: 'German', letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß' },
    IT: { code: 'it', name: 'Italian', letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÈÉÌÒÙ' },
    PT: { code: 'pt', name: 'Portuguese', letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÃÉÍÓÚ' }
  };

  const WORD_CATEGORIES = {
    ANIMALS: 'animals',
    COLORS: 'colors',
    NUMBERS: 'numbers',
    DIRECTIONS: 'directions',
    TIME: 'time',
    WEATHER: 'weather',
    FOOD: 'food',
    SPORTS: 'sports',
    PLACES: 'places',
    ACTIONS: 'actions',
    ADJECTIVES: 'adjectives',
    NOUNS: 'nouns',
    VERBS: 'verbs',
    GENERAL: 'general'
  };

  const COMPLEXITY_LEVELS = {
    BEGINNER: { id: 'beginner', name: 'Beginner', minLength: 2, maxLength: 5, points: 1 },
    ELEMENTARY: { id: 'elementary', name: 'Elementary', minLength: 4, maxLength: 6, points: 2 },
    INTERMEDIATE: { id: 'intermediate', name: 'Intermediate', minLength: 5, maxLength: 8, points: 3 },
    ADVANCED: { id: 'advanced', name: 'Advanced', minLength: 7, maxLength: 10, points: 4 },
    EXPERT: { id: 'expert', name: 'Expert', minLength: 9, maxLength: 12, points: 5 },
    MASTER: { id: 'master', name: 'Master', minLength: 11, maxLength: 15, points: 6 }
  };

  class MXDWordProcessorVortex {
    constructor() {
      this.dictionary = this.loadDictionary();
      this.knownWords = new Set();
      this.customDictionary = new Set();
      this.synonyms = this.loadSynonyms();
      this.antonyms = this.loadAntonyms();
      this.listeners = {};
      this.settings = this.loadSettings();
      this.statistics = this.loadStatistics();
      this.validationCache = new Map();
      this.patternCache = new Map();
      this.maxCacheSize = 500;
      this.init();
    }

    init() {
      console.log(`✨ MXD Word Processor Vortex v${VERSION} — 30x Intelligent Processing`);
      this.loadCustomDictionary();
    }

    loadSettings() {
      try {
        const saved = localStorage.getItem('mxd_word_processor_vortex_settings');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return {
        language: 'EN',
        minWordLength: 2,
        maxWordLength: 15,
        autoUppercase: true,
        removeNumbers: true,
        removeSpecialChars: true,
        normalizeUnicode: true,
        allowDuplicates: false,
        suggestCorrections: true,
        autoCorrect: false,
        detectLanguage: true,
        enableNLP: true,
        patternRecognition: true,
        smartSuggestions: true,
        similarityThreshold: 0.7,
        maxSuggestions: 10
      };
    }

    saveSettings() {
      try { localStorage.setItem('mxd_word_processor_vortex_settings', JSON.stringify(this.settings)); } catch (e) {}
    }

    loadStatistics() {
      try {
        const saved = localStorage.getItem('mxd_word_processor_stats');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return {
        wordsProcessed: 0, wordsValidated: 0, wordsCorrected: 0,
        suggestionsMade: 0, patternsDetected: 0, duplicatesFound: 0,
        avgProcessingTime: 0, totalTime: 0,
        byCategory: {}, byComplexity: {}, byLanguage: {}
      };
    }

    saveStatistics() {
      try { localStorage.setItem('mxd_word_processor_stats', JSON.stringify(this.statistics)); } catch (e) {}
    }

    loadDictionary() {
      const common = new Set([
        'THE', 'BE', 'TO', 'OF', 'AND', 'A', 'IN', 'THAT', 'HAVE', 'I',
        'IT', 'FOR', 'NOT', 'ON', 'WITH', 'HE', 'AS', 'YOU', 'DO', 'AT',
        'THIS', 'BUT', 'THEY', 'WE', 'SAY', 'HER', 'SHE', 'OR', 'AN', 'WILL',
        'MY', 'ONE', 'ALL', 'WOULD', 'THERE', 'THEIR', 'WHAT', 'SO', 'UP',
        'OUT', 'IF', 'ABOUT', 'WHO', 'GET', 'WHICH', 'GO', 'ME', 'WHEN',
        'MAKE', 'CAN', 'LIKE', 'TIME', 'NO', 'JUST', 'HIM', 'KNOW', 'TAKE',
        'PEOPLE', 'INTO', 'YEAR', 'YOUR', 'GOOD', 'SOME', 'COULD', 'THEM',
        'SEE', 'OTHER', 'THAN', 'THEN', 'NOW', 'LOOK', 'ONLY', 'COME',
        'ITS', 'OVER', 'THINK', 'ALSO', 'BACK', 'AFTER', 'USE', 'TWO',
        'HOW', 'OUR', 'WORK', 'FIRST', 'WELL', 'WAY', 'EVEN', 'NEW',
        'WANT', 'BECAUSE', 'ANY', 'THESE', 'GIVE', 'DAY', 'MOST', 'US',
        'ANIMALS', 'BIRD', 'CAT', 'DOG', 'FISH', 'HORSE', 'LION', 'TIGER',
        'BEAR', 'ELEPHANT', 'APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'LEMON',
        'MOUNTAIN', 'RIVER', 'OCEAN', 'LAKE', 'FOREST', 'DESERT', 'ISLAND',
        'RED', 'BLUE', 'GREEN', 'YELLOW', 'BLACK', 'WHITE', 'ORANGE', 'PURPLE'
      ]);
      return common;
    }

    loadSynonyms() {
      const synonyms = new Map();
      synonyms.set('BIG', ['LARGE', 'HUGE', 'ENORMOUS', 'MASSIVE', 'GIANT']);
      synonyms.set('SMALL', ['TINY', 'LITTLE', 'MINUTE', 'PETITE', 'MINOR']);
      synonyms.set('HAPPY', ['JOYFUL', 'GLAD', 'PLEASED', 'DELIGHTED', 'CHEEPED']);
      synonyms.set('SAD', ['UNHAPPY', 'SORROWFUL', 'MELANCHOLY', 'MOURNFUL']);
      synonyms.set('FAST', ['QUICK', 'RAPID', 'SWIFT', 'SPEEDY', 'BRISK']);
      synonyms.set('SLOW', ['SLUGGISH', 'LEISURELY', 'GRADUAL', 'POKEY']);
      synonyms.set('GOOD', ['EXCELLENT', 'GREAT', 'WONDERFUL', 'FANTASTIC', 'SUPERB']);
      synonyms.set('BAD', ['POOR', 'TERRIBLE', 'AWFUL', 'DREADFUL', 'HORRIBLE']);
      synonyms.set('BEAUTIFUL', ['GORGEOUS', 'PRETTY', 'LOVELY', 'STUNNING', 'ATTRACTIVE']);
      synonyms.set('UGLY', ['UNATTRACTIVE', 'HIDEIOUS', 'GROTESQUE', 'UNSIGHTLY']);
      return synonyms;
    }

    loadAntonyms() {
      const antonyms = new Map();
      antonyms.set('BIG', 'SMALL');
      antonyms.set('SMALL', 'BIG');
      antonyms.set('HAPPY', 'SAD');
      antonyms.set('FAST', 'SLOW');
      antonyms.set('GOOD', 'BAD');
      antonyms.set('BEAUTIFUL', 'UGLY');
      antonyms.set('HOT', 'COLD');
      antonyms.set('LIGHT', 'DARK');
      antonyms.set('LOUD', 'QUIET');
      antonyms.set('YOUNG', 'OLD');
      return antonyms;
    }

    loadCustomDictionary() {
      try {
        const stored = localStorage.getItem('mxd_custom_dictionary');
        if (stored) {
          const words = JSON.parse(stored);
          words.forEach(w => this.customDictionary.add(w.toUpperCase()));
        }
      } catch (e) {}
    }

    saveCustomDictionary() {
      try {
        localStorage.setItem('mxd_custom_dictionary', JSON.stringify([...this.customDictionary]));
      } catch (e) {}
    }

    cleanWord(word, options = {}) {
      const defaults = {
        uppercase: true,
        stripSpecial: true,
        trimSpaces: true,
        removeNumbers: true,
        normalizeUnicode: true,
        normalizeHyphens: true
      };

      const opts = { ...defaults, ...options };
      let cleaned = word;

      if (opts.trimSpaces) {
        cleaned = cleaned.trim();
        cleaned = cleaned.replace(/\s+/g, ' ');
      }

      if (opts.uppercase) {
        cleaned = cleaned.toUpperCase();
      }

      if (opts.stripSpecial) {
        cleaned = cleaned.replace(/[^a-zA-ZÀÈÉÌÒÙÁÉÍÓÚÜÑÂÄÊËÎÏÔÙÛŸ]/g, '');
      }

      if (opts.removeNumbers) {
        cleaned = cleaned.replace(/[0-9]/g, '');
      }

      if (opts.normalizeUnicode) {
        cleaned = cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }

      if (opts.normalizeHyphens) {
        cleaned = cleaned.replace(/[-_]+/g, '');
      }

      return cleaned;
    }

    cleanText(text, options = {}) {
      const lines = text.split('\n');
      return lines.map(line => this.cleanWord(line, options)).filter(w => w);
    }

    validateWord(word, options = {}) {
      const startTime = performance.now();
      const cacheKey = `${word}_${JSON.stringify(options)}`;

      if (this.validationCache.has(cacheKey)) {
        return this.validationCache.get(cacheKey);
      }

      const settings = { ...this.settings, ...options };
      const issues = [];
      let cleaned = this.cleanWord(word, settings);

      if (!cleaned) {
        const result = { valid: false, issues: ['empty_after_cleaning'], original: word };
        this.cacheResult(cacheKey, result);
        return result;
      }

      if (cleaned.length < (settings.minWordLength || 2)) {
        issues.push({ issue: 'too_short', value: cleaned.length, min: settings.minWordLength || 2 });
      }

      if (cleaned.length > (settings.maxWordLength || 15)) {
        issues.push({ issue: 'too_long', value: cleaned.length, max: settings.maxWordLength || 15 });
      }

      const lang = LANGUAGES[settings.language] || LANGUAGES.EN;
      const validPattern = new RegExp(`^[${lang.letters}]+$`);

      if (!validPattern.test(cleaned)) {
        issues.push({ issue: 'invalid_characters', allowed: lang.letters });
      }

      const complexity = this.calculateComplexity(cleaned);
      const category = this.categorizeWord(cleaned);
      const language = settings.detectLanguage ? this.detectLanguage(cleaned) : settings.language;

      const result = {
        valid: issues.length === 0,
        original: word,
        cleaned,
        issues,
        complexity,
        category,
        language,
        isKnown: this.isKnown(cleaned),
        synonyms: this.getSynonyms(cleaned),
        antonyms: this.getAntonyms(cleaned),
        processingTime: performance.now() - startTime
      };

      this.cacheResult(cacheKey, result);
      return result;
    }

    validateWords(words, options = {}) {
      const startTime = performance.now();
      const results = words.map(w => this.validateWord(w, options));
      const valid = results.filter(r => r.valid);
      const invalid = results.filter(r => !r.valid);

      this.statistics.wordsProcessed += words.length;
      this.statistics.wordsValidated += valid.length;
      this.statistics.totalTime += performance.now() - startTime;
      this.saveStatistics();

      return {
        total: words.length,
        valid: valid.map(r => r.cleaned),
        invalid,
        validCount: valid.length,
        invalidCount: invalid.length,
        issues: invalid.flatMap(r => r.issues),
        processingTime: performance.now() - startTime
      };
    }

    cacheResult(key, result) {
      if (this.validationCache.size >= this.maxCacheSize) {
        const firstKey = this.validationCache.keys().next().value;
        this.validationCache.delete(firstKey);
      }
      this.validationCache.set(key, result);
    }

    clearCache() {
      this.validationCache.clear();
      this.patternCache.clear();
      this.emit('cacheCleared');
    }

    calculateComplexity(word) {
      const len = word.length;
      const uniqueLetters = new Set(word).size;
      const letterRatio = uniqueLetters / len;
      const hasRepeatedLetters = len !== uniqueLetters;
      const avgPositionDiff = this.calculateAvgPositionDiff(word);

      let score = 0;
      score += Math.min(len * 0.3, 3);
      score += letterRatio * 2;
      if (hasRepeatedLetters) score -= 0.5;
      score += Math.min(avgPositionDiff * 0.5, 2);

      for (const [level, config] of Object.entries(COMPLEXITY_LEVELS)) {
        if (len >= config.minLength && len <= config.maxLength) {
          return { ...config, score: Math.min(1, score / 10) };
        }
      }

      return COMPLEXITY_LEVELS.INTERMEDIATE;
    }

    calculateAvgPositionDiff(word) {
      if (word.length < 2) return 0;
      let total = 0;
      for (let i = 1; i < word.length; i++) {
        total += Math.abs(word.charCodeAt(i) - word.charCodeAt(i - 1));
      }
      return total / (word.length - 1);
    }

    categorizeWord(word) {
      const categories = {
        animals: ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'TIGER', 'BEAR', 'ELEPHANT', 'HORSE', 'MONKEY', 'SHARK', 'WHALE', 'EAGLE', 'HAWK', 'WOLF', 'FOX', 'RABBIT', 'DEER', 'SNAKE', 'LIZARD'],
        colors: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BLACK', 'WHITE', 'BROWN', 'GRAY', 'GOLD', 'SILVER'],
        numbers: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ZERO', 'HUNDRED', 'THOUSAND'],
        directions: ['NORTH', 'SOUTH', 'EAST', 'WEST', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'FORWARD', 'BACKWARD'],
        time: ['DAY', 'NIGHT', 'MORNING', 'EVENING', 'WEEK', 'MONTH', 'YEAR', 'HOUR', 'MINUTE', 'SECOND'],
        weather: ['RAIN', 'SNOW', 'SUN', 'CLOUD', 'WIND', 'STORM', 'FOG', 'HAIL', 'SLEET', 'THUNDER'],
        food: ['APPLE', 'BANANA', 'BREAD', 'CHEESE', 'EGG', 'FISH', 'MEAT', 'RICE', 'SOUP', 'SALAD'],
        sports: ['SOCCER', 'BASEBALL', 'TENNIS', 'GOLF', 'SWIM', 'RUN', 'JUMP', 'KICK', 'THROW', 'CATCH'],
        places: ['CITY', 'TOWN', 'VILLAGE', 'RIVER', 'MOUNTAIN', 'LAKE', 'OCEAN', 'BEACH', 'FOREST', 'DESERT']
      };

      const upper = word.toUpperCase();
      for (const [category, words] of Object.entries(categories)) {
        if (words.some(w => upper.includes(w) || w.includes(upper))) {
          return category;
        }
      }

      return WORD_CATEGORIES.GENERAL;
    }

    detectLanguage(word) {
      const cleaned = this.cleanWord(word);

      const langPatterns = {
        es: /[ÁÉÍÓÚÜÑ]/i,
        fr: /[ÀÂÄÈÉÊËÎÏÔÙÛÜŸ]/i,
        de: /[ÄÖÜß]/i,
        it: /[ÀÈÉÌÒÙ]/i,
        pt: /[ÃÉÍÓÚ]/i
      };

      for (const [lang, pattern] of Object.entries(langPatterns)) {
        if (pattern.test(cleaned)) {
          return lang;
        }
      }

      return 'en';
    }

    findDuplicates(words) {
      const seen = new Map();
      const duplicates = [];

      words.forEach((word, index) => {
        const cleaned = this.cleanWord(word).toUpperCase();

        if (seen.has(cleaned)) {
          const existing = duplicates.find(d => d.word === cleaned);
          if (existing) {
            existing.indices.push(index);
          } else {
            duplicates.push({
              word: cleaned,
              indices: [seen.get(cleaned), index],
              original: word
            });
          }
        } else {
          seen.set(cleaned, index);
        }
      });

      this.statistics.duplicatesFound += duplicates.length;
      return duplicates;
    }

    removeDuplicates(words, keepFirst = true) {
      const seen = new Set();
      const result = [];

      const items = keepFirst ? words : [...words].reverse();

      items.forEach(word => {
        const cleaned = this.cleanWord(word).toUpperCase();
        if (!seen.has(cleaned)) {
          seen.add(cleaned);
          result.push(word);
        }
      });

      return keepFirst ? result : result.reverse();
    }

    highlightDuplicates(words) {
      const duplicates = this.findDuplicates(words);
      return words.map((word, index) => {
        const cleaned = this.cleanWord(word).toUpperCase();
        const dupInfo = duplicates.find(d => d.indices.includes(index));

        return {
          word,
          cleaned,
          index,
          isDuplicate: !!dupInfo,
          duplicateGroup: dupInfo ? duplicates.indexOf(dupInfo) : null
        };
      });
    }

    findSimilar(word, dictionary, maxDistance = 3) {
      const cleaned = this.cleanWord(word).toUpperCase();
      const similar = [];

      const dict = dictionary || [...this.dictionary, ...this.knownWords];

      dict.forEach(dictWord => {
        const distance = this.levenshteinDistance(cleaned, dictWord.toUpperCase());
        if (distance > 0 && distance <= maxDistance) {
          const maxLen = Math.max(cleaned.length, dictWord.length);
          const similarity = 1 - (distance / maxLen);
          similar.push({
            word: dictWord,
            distance,
            similarity: Math.round(similarity * 100) / 100
          });
        }
      });

      return similar.sort((a, b) => a.distance - b.distance);
    }

    levenshteinDistance(str1, str2) {
      const m = str1.length;
      const n = str2.length;
      const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;

      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (str1[i - 1] === str2[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1];
          } else {
            dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
          }
        }
      }

      return dp[m][n];
    }

    suggestAlternatives(word, options = {}) {
      const settings = { ...this.settings, ...options };
      const cleaned = this.cleanWord(word);
      const suggestions = [];

      const similar = this.findSimilar(cleaned, this.dictionary, 2);
      suggestions.push(...similar.slice(0, 3));

      const knownSimilar = this.findSimilar(cleaned, this.knownWords, 2);
      suggestions.push(...knownSimilar.slice(0, 3).map(s => ({ ...s, source: 'known' })));

      const synonyms = this.getSynonyms(cleaned);
      if (synonyms.length > 0) {
        suggestions.push(...synonyms.map(s => ({ word: s, distance: 0, similarity: 1, source: 'synonym' })));
      }

      const unique = [];
      const seen = new Set();
      suggestions.forEach(s => {
        const key = s.word;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(s);
        }
      });

      this.statistics.suggestionsMade += Math.max(0, unique.length - 1);
      return unique.slice(0, settings.maxSuggestions || 10);
    }

    getSynonyms(word) {
      const cleaned = this.cleanWord(word).toUpperCase();
      return this.synonyms.get(cleaned) || [];
    }

    getAntonyms(word) {
      const cleaned = this.cleanWord(word).toUpperCase();
      return this.antonyms.get(cleaned) ? [this.antonyms.get(cleaned)] : [];
    }

    analyzePattern(word) {
      const patterns = {
        consecutiveVowels: (w) => w.match(/[AEIOU]{3,}/i) ? true : false,
        consecutiveConsonants: (w) => w.match(/[^AEIOU]{4,}/i) ? true : false,
        repeatedLetters: (w) => /(.)\1/.test(w) ? true : false,
        startsWithVowel: (w) => /^[AEIOU]/i.test(w) ? true : false,
        endsWithVowel: (w) => /[AEIOU]$/i.test(w) ? true : false,
        palindrome: (w) => w === w.split('').reverse().join('') ? true : false,
        isAbbreviation: (w) => /^[A-Z]{2,4}$/.test(w) ? true : false,
        hasHyphen: (w) => w.includes('-') ? true : false,
        isCompound: (w) => w.length > 10 && /[A-Z][a-z]+[A-Z]/.test(w) ? true : false
      };

      const result = {};
      for (const [pattern, checkFn] of Object.entries(patterns)) {
        result[pattern] = checkFn(word);
      }

      this.statistics.patternsDetected += Object.values(result).filter(v => v).length;
      return result;
    }

    getWordStats(words) {
      const cleaned = words.map(w => this.cleanWord(w)).filter(w => w);

      const lengths = cleaned.map(w => w.length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

      const duplicates = this.findDuplicates(words);

      const letterFreq = {};
      cleaned.forEach(word => {
        word.split('').forEach(letter => {
          letterFreq[letter] = (letterFreq[letter] || 0) + 1;
        });
      });

      const mostCommonLetter = Object.entries(letterFreq)
        .sort((a, b) => b[1] - a[1])[0];

      const categories = {};
      cleaned.forEach(word => {
        const cat = this.categorizeWord(word);
        categories[cat] = (categories[cat] || 0) + 1;
      });

      const complexityLevels = {};
      cleaned.forEach(word => {
        const comp = this.calculateComplexity(word);
        const level = comp.id;
        complexityLevels[level] = (complexityLevels[level] || 0) + 1;
      });

      return {
        total: words.length,
        valid: cleaned.length,
        duplicates: duplicates.length,
        avgLength: Math.round(avgLength * 100) / 100,
        maxLength: Math.max(...lengths),
        minLength: Math.min(...lengths),
        lengthDistribution: this.getLengthDistribution(cleaned),
        letterFrequency: letterFreq,
        mostCommonLetter: mostCommonLetter?.[0] || null,
        uniqueCount: new Set(cleaned).size,
        categoryDistribution: categories,
        complexityDistribution: complexityLevels,
        complexity: this.calculateOverallComplexity(cleaned)
      };
    }

    calculateOverallComplexity(words) {
      if (words.length === 0) return COMPLEXITY_LEVELS.BEGINNER;

      let totalScore = 0;
      words.forEach(word => {
        const comp = this.calculateComplexity(word);
        totalScore += comp.points;
      });

      const avgScore = totalScore / words.length;

      for (const [level, config] of Object.entries(COMPLEXITY_LEVELS)) {
        if (avgScore <= config.points) {
          return config;
        }
      }

      return COMPLEXITY_LEVELS.MASTER;
    }

    getLengthDistribution(words) {
      const distribution = {};
      words.forEach(word => {
        const len = word.length;
        distribution[len] = (distribution[len] || 0) + 1;
      });
      return distribution;
    }

    groupByLength(words) {
      const groups = {};
      words.forEach(word => {
        const len = this.cleanWord(word).length;
        if (!groups[len]) groups[len] = [];
        groups[len].push(word);
      });
      return groups;
    }

    groupByFirstLetter(words) {
      const groups = {};
      words.forEach(word => {
        const first = this.cleanWord(word)[0] || 'A';
        if (!groups[first]) groups[first] = [];
        groups[first].push(word);
      });
      return groups;
    }

    groupByCategory(words) {
      const groups = {};
      words.forEach(word => {
        const category = this.categorizeWord(word);
        if (!groups[category]) groups[category] = [];
        groups[category].push(word);
      });
      return groups;
    }

    groupByComplexity(words) {
      const groups = {};
      words.forEach(word => {
        const comp = this.calculateComplexity(word);
        if (!groups[comp.id]) groups[comp.id] = [];
        groups[comp.id].push(word);
      });
      return groups;
    }

    optimizeWordList(words, options = {}) {
      const startTime = performance.now();
      const {
        minLength = 2,
        maxLength = 15,
        removeDuplicates = true,
        sortByLength = false,
        sortAlphabetically = false,
        groupBy = null
      } = options;

      let result = [...words];

      result = result.map(w => this.cleanWord(w)).filter(w => w);

      if (removeDuplicates) {
        result = this.removeDuplicates(result, true);
      }

      result = result.filter(w => w.length >= minLength && w.length <= maxLength);

      if (sortAlphabetically) {
        result.sort((a, b) => a.localeCompare(b));
      } else if (sortByLength) {
        result.sort((a, b) => b.length - a.length);
      }

      this.statistics.wordsProcessed += words.length;
      this.statistics.totalTime += performance.now() - startTime;
      this.saveStatistics();

      return result;
    }

    balanceWordLengths(words, targetCount, maxLength = 10) {
      const optimized = this.optimizeWordList(words);
      const short = optimized.filter(w => w.length <= 4);
      const medium = optimized.filter(w => w.length > 4 && w.length <= 7);
      const long = optimized.filter(w => w.length > 7);

      const result = [];

      for (let i = 0; i < targetCount && result.length < optimized.length; i++) {
        const pool = i % 3 === 0 ? short : i % 3 === 1 ? medium : long;
        if (pool.length > 0) {
          result.push(pool.shift());
        } else {
          if (short.length > 0) result.push(short.shift());
          else if (medium.length > 0) result.push(medium.shift());
          else if (long.length > 0) result.push(long.shift());
        }
      }

      return result;
    }

    addToDictionary(words) {
      words.forEach(w => {
        const cleaned = this.cleanWord(w).toUpperCase();
        this.knownWords.add(cleaned);
        this.customDictionary.add(cleaned);
      });
      this.saveCustomDictionary();
    }

    isKnown(word) {
      const cleaned = this.cleanWord(word).toUpperCase();
      return this.dictionary.has(cleaned) || this.knownWords.has(cleaned) || this.customDictionary.has(cleaned);
    }

    clearDictionary() {
      this.knownWords.clear();
    }

    clearCustomDictionary() {
      this.customDictionary.clear();
      this.saveCustomDictionary();
    }

    getAllLanguages() { return LANGUAGES; }
    getAllCategories() { return WORD_CATEGORIES; }
    getAllComplexityLevels() { return COMPLEXITY_LEVELS; }

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
      this.listeners[event].forEach(cb => { try { cb(data); } catch (e) { console.error('Event handler error:', e); } });
    }

    getStatus() {
      return {
        version: VERSION,
        dictionarySize: this.dictionary.size,
        knownWordsSize: this.knownWords.size,
        customDictionarySize: this.customDictionary.size,
        synonymsCount: this.synonyms.size,
        antonymsCount: this.antonyms.size,
        statistics: this.statistics,
        settings: this.settings
      };
    }
  }

  window.MXD_WORD_PROCESSOR_VORTEX = new MXDWordProcessorVortex();
  window.MXDWordProcessorVortex = MXDWordProcessorVortex;
  window.LANGUAGES_VORTEX = LANGUAGES;
  window.WORD_CATEGORIES_VORTEX = WORD_CATEGORIES;
  window.COMPLEXITY_LEVELS_VORTEX = COMPLEXITY_LEVELS;
})();