// mxd-bulk-ultimate-vortex.js — Ultimate Bulk Mode (30x Enhanced)
// Smart parsing, auto-groups, multi-format export, intelligent word management
(function(){
  'use strict';

  const VERSION = '30.0.0';

  const SEPARATION_MODES = {
    BLANK_LINES: { id: 'blank_lines', name: 'Blank Lines', description: 'Groups separated by empty lines', priority: 1 },
    COMMA: { id: 'comma', name: 'Comma Separated', description: 'Words separated by commas', priority: 2 },
    SEMICOLON: { id: 'semicolon', name: 'Semicolon Separated', description: 'Words separated by semicolons', priority: 3 },
    TAB: { id: 'tab', name: 'Tab Separated', description: 'Words separated by tabs', priority: 4 },
    NEWLINE: { id: 'newline', name: 'Line by Line', description: 'Each line is a word', priority: 5 },
    MIXED: { id: 'mixed', name: 'Mixed Mode', description: 'Auto-detect all separators', priority: 0 },
    CUSTOM: { id: 'custom', name: 'Custom Pattern', description: 'Use custom regex pattern', priority: 6 }
  };

  const GROUPING_STRATEGIES = {
    AUTO: { id: 'auto', name: 'Auto Detect', description: 'Automatically detect grouping pattern', maxGroupSize: 30, minGroupSize: 3 },
    FIXED: { id: 'fixed', name: 'Fixed Size', description: 'Groups of fixed word count', maxGroupSize: 30, minGroupSize: 3 },
    SEMANTIC: { id: 'semantic', name: 'Semantic', description: 'Group by theme/similarity', maxGroupSize: 50, minGroupSize: 3 },
    LENGTH: { id: 'length', name: 'By Length', description: 'Group by word length', maxGroupSize: 30, minGroupSize: 3 },
    ALPHABETICAL: { id: 'alphabetical', name: 'Alphabetical', description: 'Group by first letter', maxGroupSize: 50, minGroupSize: 3 },
    DIFFICULTY: { id: 'difficulty', name: 'By Difficulty', description: 'Group by complexity level', maxGroupSize: 25, minGroupSize: 3 }
  };

  const EXPORT_FORMATS = {
    CSV: { id: 'csv', name: 'CSV', extension: '.csv', mimeType: 'text/csv' },
    JSON: { id: 'json', name: 'JSON', extension: '.json', mimeType: 'application/json' },
    TEXT: { id: 'text', name: 'Plain Text', extension: '.txt', mimeType: 'text/plain' },
    HTML: { id: 'html', name: 'HTML', extension: '.html', mimeType: 'text/html' },
    MARKDOWN: { id: 'markdown', name: 'Markdown', extension: '.md', mimeType: 'text/markdown' },
    XML: { id: 'xml', name: 'XML', extension: '.xml', mimeType: 'application/xml' },
    TSV: { id: 'tsv', name: 'Tab Separated', extension: '.tsv', mimeType: 'text/tab-separated-values' }
  };

  class MXDBulkUltimateVortex {
    constructor() {
      this.listeners = {};
      this.settings = this.loadSettings();
      this.wordBank = new Set();
      this.usedWords = new Set();
      this.bannedWords = new Set();
      this.synonyms = new Map();
      this.themes = new Map();
      this.validationRules = this.getDefaultValidationRules();
      this.customPatterns = [];
      this.history = [];
      this.maxHistory = 50;
      this.statistics = this.loadStatistics();
      this.cache = new Map();
      this.init();
    }

    init() {
      console.log(`📦 MXD Bulk Ultimate Vortex v${VERSION} — 30x Smart Word Processing`);
      this.loadThemedWords();
      this.loadBannedWords();
    }

    loadSettings() {
      try {
        const saved = localStorage.getItem('mxd_bulk_vortex_settings');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return {
        separatorMode: 'mixed',
        customPattern: '',
        blankLineSeparation: true,
        autoPageCount: true,
        minWordsPerGroup: 3,
        maxWordsPerGroup: 30,
        wordsPerPage: 10,
        noRepeatMode: true,
        removePunctuation: true,
        autoUppercase: true,
        trimWhitespace: true,
        allowDuplicates: false,
        groupNaming: 'sequential',
        customGroupPrefix: 'Group',
        generateSeparately: false,
        parallelProcessing: true,
        validateWords: true,
        minWordLength: 2,
        maxWordLength: 15,
        smartGrouping: true,
        semanticClustering: true,
        difficultyBalancing: true,
        autoCorrect: true,
        suggestAlternatives: true,
        ignoreNumbers: true,
        ignoreSpecialChars: true,
        preserveOrder: false,
        shuffleWithinGroups: false,
        exportFormat: 'json'
      };
    }

    saveSettings() {
      try { localStorage.setItem('mxd_bulk_vortex_settings', JSON.stringify(this.settings)); } catch (e) {}
    }

    loadStatistics() {
      try {
        const saved = localStorage.getItem('mxd_bulk_stats');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return {
        totalProcessed: 0, totalWords: 0, totalGroups: 0,
        duplicatesRemoved: 0, invalidFiltered: 0, suggestionsMade: 0,
        autoCorrections: 0, themeDetected: 0, processingTime: 0,
        byTheme: {}, byFormat: {}
      };
    }

    saveStatistics() {
      try { localStorage.setItem('mxd_bulk_stats', JSON.stringify(this.statistics)); } catch (e) {}
    }

    getDefaultValidationRules() {
      return {
        minLength: 2,
        maxLength: 15,
        allowedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        disallowedPatterns: [/^\d+$/, /^[^a-zA-Z]+$/],
        requiredCapitalization: false,
        maxRepeats: 3,
        allowNumbers: false
      };
    }

    loadThemedWords() {
      this.themes.set('animals', ['ELEPHANT', 'GIRAFFE', 'DOLPHIN', 'PENGUIN', 'CHEETAH', 'GORILLA', 'PANTHER', 'HAMSTER', 'BUFFALO', 'ZEBRA', 'JAGUAR', 'FALCON', 'GAZELLE', 'KOALA', 'PANDA', 'OTTER', 'BEAVER', 'WOLVES', 'COUGAR', 'BADGER', 'RABBIT', 'HORSES', 'CAMELS', 'BISON', 'YAKS', 'LLAMAS', 'ALPACA', 'GOATS', 'SHEEP', 'TIGER', 'LIONS', 'BEARS', 'FOXES', 'OWLS', 'EAGLES', 'TIGERS', 'WHALES', 'SHARKS', 'TURTLES', 'RABBITS', 'MONKEYS', 'PIGEON', 'SPARROW', 'RAVEN', 'COYOTE', 'MINK', 'FERRET', 'WEASEL', 'BADGER', 'SEALS', 'MINKS', 'OTTERS']);
      this.themes.set('food', ['PIZZA', 'BURGER', 'SUSHI', 'PASTA', 'SALAD', 'TACOS', 'CURRY', 'RAMEN', 'STEAK', 'WAFFLE', 'CREPE', 'BAGEL', 'MUFFIN', 'PRETZEL', 'CHURRO', 'FALAFEL', 'PAELLA', 'RISOTTO', 'BURRITO', 'CROISSANT', 'DONUT', 'PANCAKE', 'OMELETTE', 'WAFFLE', 'BROWNIE', 'COOKIE', 'CANDY', 'CHOCOLATE', 'JELLY', 'JAM', 'HONEY', 'SYRUP', 'SAUCE', 'SPRING', 'ROLL', 'BREAD', 'CHEESE', 'BUTTER', 'CREAM', 'MILK', 'YOGURT']);
      this.themes.set('sports', ['SOCCER', 'TENNIS', 'HOCKEY', 'BOXING', 'ROWING', 'DIVING', 'SKIING', 'RUGBY', 'GOLF', 'SURFING', 'SWIMMING', 'VOLLEYBALL', 'BASEBALL', 'CRICKET', 'ARCHERY', 'SKATING', 'CYCLING', 'FENCING', 'JUDO', 'KARATE', 'BOXING', 'WEIGHTLIFTING', 'MARATHON', 'JOGGING', 'HIKING', 'CLIMBING', 'SKYDIVING', 'PARACHUTING', 'DIVING', 'PADDLE', 'BADMINTON', 'BOWLING', 'DARTS', 'BILLIARDS', 'SNOOKER', 'POOL', 'CHESS', 'CHECKERS', 'DOMINOES']);
      this.themes.set('science', ['ATOM', 'ELECTRON', 'PROTON', 'NEUTRON', 'GRAVITY', 'PLASMA', 'FUSION', 'PHOTON', 'QUANTUM', 'ENZYME', 'MOLECULE', 'CHROMOSOME', 'VELOCITY', 'ENTROPY', 'CATALYST', 'OSMOSIS', 'NUCLEUS', 'POLYMER', 'ISOTOPE', 'SPECTRUM', 'GALAXY', 'PLANET', 'NEBULA', 'COMET', 'METEOR', 'SATELLITE', 'ORBIT', 'LUNAR', 'SOLAR', 'ASTRONOMY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ECOLOGY', 'GENETICS', 'BOTANY', 'ZOLOGY']);
      this.themes.set('nature', ['MOUNTAIN', 'VALLEY', 'FOREST', 'RIVER', 'CANYON', 'MEADOW', 'WATERFALL', 'GLACIER', 'DESERT', 'JUNGLE', 'PRAIRIE', 'MARSH', 'VINEYARD', 'ORCHARD', 'SWAMP', 'LAGOON', 'GORGE', 'PENINSULA', 'ISLAND', 'OCEAN', 'SEA', 'LAKE', 'POND', 'STREAM', 'CREEK', 'FALLS', 'RAPIDS', 'DELTA', 'CANON', 'CAVE', 'CAVERN', 'GROTTO', 'DUNE', 'OASIS', 'SUMMIT', 'PEAK', 'RIDGE', 'VALLEY', 'CANYON', 'GULCH']);
      this.themes.set('technology', ['ALGORITHM', 'BROWSER', 'CACHE', 'DATABASE', 'ENCRYPTION', 'FIREWALL', 'GATEWAY', 'HARDWARE', 'INTERFACE', 'KERNEL', 'NETWORK', 'PROTOCOL', 'QUERY', 'ROUTER', 'SOFTWARE', 'THREAD', 'UPLOAD', 'VIRTUAL', 'WIDGET', 'SYNC', 'SERVER', 'CLIENT', 'CLOUD', 'BACKUP', 'DEBUG', 'COMPILE', 'DEPLOY', 'FRAMEWORK', 'LIBRARY', 'MODULE', 'PACKAGE', 'SCRIPT', 'SOURCE', 'TARGET', 'PLATFORM', 'SYSTEM']);
    }

    loadBannedWords() {
      this.bannedWords = new Set(['NULL', 'UNDEFINED', 'NAN', 'INFINITY', 'TEST', 'ASDF', 'QWERTY', 'XXX']);
    }

    parseInputText(text, options = {}) {
      const startTime = performance.now();
      const mode = options.mode || this.settings.separatorMode;
      const groups = [];

      let separators = [];
      if (mode === 'mixed' || mode === 'comma') separators.push(',');
      if (mode === 'mixed' || mode === 'semicolon') separators.push(';');
      if (mode === 'mixed' || mode === 'tab') separators.push('\t');
      if (mode === 'mixed' || mode === 'newline') separators.push('\n');

      const lines = text.split(/\r?\n/);
      let currentGroup = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed === '' || /^\s+$/.test(line)) {
          if (currentGroup.length > 0) {
            groups.push([...currentGroup]);
            currentGroup = [];
          }
          continue;
        }

        let words = this.parseLine(trimmed, separators);
        words = this.cleanWords(words);

        if (words.length > 0) {
          currentGroup.push(...words);
        }
      }

      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
      }

      let validGroups = groups.filter(g => g.length >= this.settings.minWordsPerGroup);

      if (this.settings.smartGrouping) {
        validGroups = this.applySmartGrouping(validGroups);
      }

      if (this.settings.difficultyBalancing) {
        validGroups = this.balanceDifficulty(validGroups);
      }

      const processingTime = performance.now() - startTime;
      this.statistics.totalProcessed++;
      this.statistics.totalWords += validGroups.reduce((sum, g) => sum + g.length, 0);
      this.statistics.totalGroups += validGroups.length;
      this.statistics.processingTime += processingTime;

      this.addToHistory({ action: 'parse', groups: validGroups.length, words: validGroups.reduce((sum, g) => sum + g.length, 0), time: processingTime });

      this.emit('groupsParsed', {
        totalGroups: validGroups.length,
        totalWords: validGroups.reduce((sum, g) => sum + g.length, 0),
        processingTime
      });

      return validGroups;
    }

    parseLine(line, separators) {
      if (separators.length === 0) return [line];

      let parts;
      if (separators.includes('\n')) {
        parts = line.split(/\n/).filter(p => p.trim());
      } else {
        const sepRegex = separators.map(s => {
          if (s === ' ') return '\\s+';
          return s === '\t' ? '\\t+' : '\\' + s;
        }).join('|');
        parts = line.split(new RegExp(sepRegex, 'g'));
      }

      return parts.filter(p => p && p.trim());
    }

    cleanWords(words) {
      return words.map(word => {
        let cleaned = word.trim();

        if (this.settings.removePunctuation) {
          cleaned = cleaned.replace(/[.,!?;:'"()[\]{}]/g, '');
        }

        if (this.settings.autoUppercase) {
          cleaned = cleaned.toUpperCase();
        }

        if (this.settings.ignoreNumbers) {
          cleaned = cleaned.replace(/[0-9]/g, '');
        }

        if (this.settings.ignoreSpecialChars) {
          cleaned = cleaned.replace(/[^a-zA-Z]/g, '');
        }

        if (this.settings.trimWhitespace) {
          cleaned = cleaned.trim();
        }

        return cleaned;
      }).filter(w => {
        if (w.length < this.settings.minWordLength) return false;
        if (w.length > this.settings.maxWordLength) return false;
        if (!/^[A-Z]+$/i.test(w)) return false;
        if (this.bannedWords.has(w)) return false;
        return true;
      });
    }

    applySmartGrouping(groups) {
      if (!this.settings.smartGrouping) return groups;

      const merged = [];
      let buffer = [];

      for (const group of groups) {
        if (group.length >= this.settings.minWordsPerGroup) {
          if (buffer.length > 0) {
            merged.push([...buffer]);
            buffer = [];
          }
          merged.push(group);
        } else {
          buffer.push(...group);
          if (buffer.length >= this.settings.minWordsPerGroup) {
            merged.push([...buffer]);
            buffer = [];
          }
        }
      }

      if (buffer.length > 0) {
        if (merged.length > 0) {
          merged[merged.length - 1].push(...buffer);
        } else {
          merged.push(buffer);
        }
      }

      return merged;
    }

    balanceDifficulty(groups) {
      if (!this.settings.difficultyBalancing) return groups;

      return groups.map(group => {
        const short = group.filter(w => w.length <= 4);
        const medium = group.filter(w => w.length > 4 && w.length <= 7);
        const long = group.filter(w => w.length > 7);

        const targetCount = Math.min(short.length, medium.length, long.length);
        if (targetCount === 0) return group;

        const balanced = [];
        for (let i = 0; i < targetCount; i++) {
          if (short.length > i) balanced.push(short[i]);
          if (medium.length > i) balanced.push(medium[i]);
          if (long.length > i) balanced.push(long[i]);
        }

        const remainder = group.filter(w => !balanced.includes(w));
        balanced.push(...remainder);

        return balanced;
      });
    }

    splitIntoGroups(words, options = {}) {
      const strategy = options.strategy || 'auto';
      const perGroup = options.wordsPerGroup || this.settings.wordsPerPage;
      const groups = [];

      if (strategy === 'fixed') {
        for (let i = 0; i < words.length; i += perGroup) {
          groups.push(words.slice(i, i + perGroup));
        }
      } else if (strategy === 'semantic') {
        return this.groupBySemantic(words);
      } else if (strategy === 'length') {
        return this.groupByLength(words);
      } else if (strategy === 'alphabetical') {
        return this.groupAlphabetically(words);
      } else {
        const maxSize = this.settings.maxWordsPerGroup;
        const minSize = this.settings.minWordsPerGroup;

        let buffer = [];
        for (const word of words) {
          buffer.push(word);
          if (buffer.length >= maxSize) {
            groups.push([...buffer]);
            buffer = [];
          }
        }

        if (buffer.length >= minSize) {
          groups.push(buffer);
        } else if (groups.length > 0) {
          groups[groups.length - 1].push(...buffer);
        } else {
          groups.push(buffer);
        }
      }

      return groups;
    }

    groupBySemantic(words) {
      const themeMatches = new Map();

      for (const theme of this.themes.keys()) {
        themeMatches.set(theme, []);
      }

      for (const word of words) {
        let bestMatch = 'general';
        let maxMatches = 0;

        for (const [theme, themeWords] of this.themes.entries()) {
          const matches = themeWords.filter(tw => words.includes(tw)).length;
          if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = theme;
          }
        }

        themeMatches.get(bestMatch).push(word);
      }

      const groups = [];
      for (const [theme, themeWords] of themeMatches.entries()) {
        if (themeWords.length > 0) {
          groups.push(themeWords);
        }
      }

      return groups;
    }

    groupByLength(words) {
      const groups = {};
      words.forEach(word => {
        const len = word.length;
        if (!groups[len]) groups[len] = [];
        groups[len].push(word);
      });

      return Object.entries(groups)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([_, words]) => words);
    }

    groupAlphabetically(words) {
      const groups = {};
      words.forEach(word => {
        const first = word[0] || 'A';
        if (!groups[first]) groups[first] = [];
        groups[first].push(word);
      });

      return Object.entries(groups)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([_, words]) => words);
    }

    resetWordBank() {
      this.wordBank.clear();
      this.usedWords.clear();
      this.emit('wordBankReset');
    }

    addToWordBank(words) {
      words.forEach(w => this.wordBank.add(w.toUpperCase()));
    }

    getAvailableWords() {
      return Array.from(this.wordBank).filter(w => !this.usedWords.has(w));
    }

    markWordsAsUsed(words) {
      words.forEach(w => this.usedWords.add(w.toUpperCase()));
    }

    filterDuplicates(words) {
      if (!this.settings.noRepeatMode) return words;
      const available = this.getAvailableWords();
      return words.filter(word => {
        const upper = word.toUpperCase();
        return !this.usedWords.has(upper);
      });
    }

    autoReplaceDuplicates(words) {
      if (!this.settings.noRepeatMode) return words;

      const result = [];
      const available = this.getAvailableWords();
      const usedInBatch = new Set();

      for (const word of words) {
        const upper = word.toUpperCase();

        if (this.usedWords.has(upper) || usedInBatch.has(upper)) {
          for (const avail of available) {
            if (!this.usedWords.has(avail) && !usedInBatch.has(avail)) {
              result.push(avail);
              usedInBatch.add(avail);
              this.statistics.suggestionsMade++;
              break;
            }
          }
        } else {
          result.push(word);
          usedInBatch.add(upper);
        }
      }

      this.markWordsAsUsed(result);
      return result;
    }

    getGroupName(index, words, options = {}) {
      const style = options.style || this.settings.groupNaming;
      const prefix = options.prefix || this.settings.customGroupPrefix;

      switch (style) {
        case 'firstWord':
          return words[0] || `${prefix} ${index + 1}`;
        case 'theme':
          return this.detectTheme(words) || `${prefix} ${index + 1}`;
        case 'sequential':
        default:
          return `${prefix} ${index + 1}`;
      }
    }

    detectTheme(words) {
      let bestTheme = null;
      let maxMatches = 0;

      for (const [theme, themeWords] of this.themes.entries()) {
        const matches = words.filter(w => themeWords.includes(w)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          bestTheme = theme;
        }
      }

      return maxMatches > 2 ? bestTheme : null;
    }

    validateWords(words) {
      const issues = [];
      const valid = [];

      words.forEach(word => {
        const validation = this.validateWord(word);
        if (validation.valid) {
          valid.push(validation.cleaned);
        } else {
          issues.push(validation);
        }
      });

      this.statistics.invalidFiltered += issues.length;
      return { valid, issues };
    }

    validateWord(word) {
      const issues = [];
      let cleaned = word.trim();

      if (this.settings.removePunctuation) {
        cleaned = cleaned.replace(/[.,!?;:'"()[\]{}]/g, '');
      }

      if (this.settings.autoUppercase) {
        cleaned = cleaned.toUpperCase();
      }

      cleaned = cleaned.replace(/[0-9]/g, '');
      cleaned = cleaned.replace(/[^a-zA-Z]/g, '');

      if (!cleaned) {
        return { valid: false, issues: ['empty_after_cleaning'], original: word };
      }

      if (cleaned.length < this.settings.minWordLength) {
        issues.push({ issue: 'too_short', value: cleaned.length });
      }

      if (cleaned.length > this.settings.maxWordLength) {
        issues.push({ issue: 'too_long', value: cleaned.length });
      }

      if (!/^[A-Z]+$/i.test(cleaned)) {
        issues.push({ issue: 'invalid_characters' });
      }

      if (this.bannedWords.has(cleaned.toUpperCase())) {
        issues.push({ issue: 'banned_word' });
      }

      return { valid: issues.length === 0, original: word, cleaned, issues };
    }

    findDuplicates(words) {
      const seen = new Map();
      const duplicates = [];

      words.forEach((word, index) => {
        const cleaned = this.cleanWord(word).toUpperCase();

        if (seen.has(cleaned)) {
          duplicates.push({
            word: cleaned,
            indices: [seen.get(cleaned), index],
            original: word
          });
        } else {
          seen.set(cleaned, index);
        }
      });

      return duplicates;
    }

    getPreview(text, options = {}) {
      const groups = this.parseInputText(text, options);

      return {
        groups: groups.length,
        totalWords: groups.reduce((sum, g) => sum + g.length, 0),
        smallestGroup: groups.length > 0 ? Math.min(...groups.map(g => g.length)) : 0,
        largestGroup: groups.length > 0 ? Math.max(...groups.map(g => g.length)) : 0,
        avgWordsPerGroup: groups.length > 0
          ? Math.round(groups.reduce((sum, g) => sum + g.length, 0) / groups.length)
          : 0,
        pagesEstimate: this.settings.autoPageCount ? groups.length : null,
        theme: this.detectOverallTheme(groups),
        groups: groups.map((words, i) => ({
          index: i,
          name: this.getGroupName(i, words),
          words: words.slice(0, 5),
          more: words.length > 5 ? words.length - 5 : 0,
          theme: this.detectTheme(words)
        }))
      };
    }

    detectOverallTheme(groups) {
      const allWords = groups.flat();
      let bestTheme = 'general';
      let maxScore = 0;

      for (const [theme, themeWords] of this.themes.entries()) {
        const matches = allWords.filter(w => themeWords.includes(w)).length;
        if (matches > maxScore) {
          maxScore = matches;
          bestTheme = theme;
        }
      }

      return maxScore > 5 ? bestTheme : 'mixed';
    }

    getDetailedStats(groups) {
      const allWords = groups.flat();

      const lengthDist = {};
      allWords.forEach(w => {
        const len = w.length;
        lengthDist[len] = (lengthDist[len] || 0) + 1;
      });

      return {
        totalGroups: groups.length,
        totalWords: allWords.length,
        uniqueWords: new Set(allWords).size,
        duplicateWords: allWords.length - new Set(allWords).size,
        lengthDistribution: lengthDist,
        avgLength: allWords.length > 0
          ? (allWords.reduce((sum, w) => sum + w.length, 0) / allWords.length).toFixed(1)
          : 0,
        longestWord: allWords.reduce((max, w) => w.length > max.length ? w : max, ''),
        shortestWord: allWords.reduce((min, w) => w.length < min.length ? w : min, allWords[0] || ''),
        themeDistribution: this.getThemeDistribution(groups),
        difficultyLevel: this.calculateDifficultyLevel(allWords)
      };
    }

    getThemeDistribution(groups) {
      const distribution = {};
      groups.forEach((group, i) => {
        const theme = this.detectTheme(group);
        distribution[theme] = (distribution[theme] || 0) + 1;
      });
      return distribution;
    }

    calculateDifficultyLevel(words) {
      const shortCount = words.filter(w => w.length <= 4).length;
      const mediumCount = words.filter(w => w.length > 4 && w.length <= 7).length;
      const longCount = words.filter(w => w.length > 7).length;
      const total = words.length || 1;

      const shortRatio = shortCount / total;
      const mediumRatio = mediumCount / total;
      const longRatio = longCount / total;

      const avgLength = words.reduce((sum, w) => sum + w.length, 0) / total;

      if (avgLength <= 4 && shortRatio > 0.6) return 'easy';
      if (avgLength <= 6 && mediumRatio > 0.5) return 'medium';
      if (avgLength <= 8 && longRatio > 0.3) return 'hard';
      return 'expert';
    }

    async importFromTextFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const text = e.target.result;
            const groups = this.parseInputText(text);
            this.addToWordBank(groups.flat());

            this.emit('fileImported', {
              format: 'text',
              groups: groups.length,
              words: groups.reduce((sum, g) => sum + g.length, 0)
            });

            resolve({ text, groups });
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsText(file);
      });
    }

    async importFromCSV(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const content = e.target.result;
            const lines = content.split(/\r?\n/);
            const groups = [];
            let currentGroup = [];

            for (const line of lines) {
              if (!line.trim()) {
                if (currentGroup.length > 0) {
                  groups.push([...currentGroup]);
                  currentGroup = [];
                }
                continue;
              }

              const words = line.split(/[,;\t]/).map(w =>
                w.trim().toUpperCase().replace(/[^A-Z]/g, '')
              ).filter(w => w.length >= 2);

              currentGroup.push(...words);
            }

            if (currentGroup.length > 0) {
              groups.push(currentGroup);
            }

            const validGroups = groups.filter(g => g.length > 0);
            this.addToWordBank(validGroups.flat());

            this.emit('csvImported', {
              groups: validGroups.length,
              words: validGroups.reduce((sum, g) => sum + g.length, 0)
            });

            resolve({ content, groups: validGroups });
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(new Error('CSV read failed'));
        reader.readAsText(file);
      });
    }

    exportToFormat(groups, formatId = null) {
      const format = formatId ? EXPORT_FORMATS[formatId.toUpperCase()] : EXPORT_FORMATS[this.settings.exportFormat.toUpperCase()];

      switch (format.id) {
        case 'csv':
          return this.exportToCSV(groups);
        case 'json':
          return this.exportToJSON(groups);
        case 'text':
          return this.exportToText(groups);
        case 'html':
          return this.exportToHTML(groups);
        case 'markdown':
          return this.exportToMarkdown(groups);
        case 'xml':
          return this.exportToXML(groups);
        case 'tsv':
          return this.exportToTSV(groups);
        default:
          return this.exportToJSON(groups);
      }
    }

    exportToCSV(groups) {
      return groups.map((g, i) => {
        const name = this.getGroupName(i, g);
        return `${name},${g.join(', ')}`;
      }).join('\n\n');
    }

    exportToJSON(groups) {
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        version: VERSION,
        groups: groups.map((words, i) => ({
          id: i + 1,
          name: this.getGroupName(i, words),
          words,
          theme: this.detectTheme(words),
          wordCount: words.length
        })),
        stats: this.getDetailedStats(groups)
      }, null, 2);
    }

    exportToText(groups) {
      return groups.map((g, i) => {
        const name = this.getGroupName(i, g);
        return `${name}:\n${g.join('\n')}`;
      }).join('\n\n');
    }

    exportToHTML(groups) {
      let html = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>Word Groups Export</title>\n<style>\nbody{font-family:Arial,sans-serif;padding:20px}\n.group{margin-bottom:20px;padding:15px;border:1px solid #ccc;border-radius:8px}\n.group h3{color:#333;margin:0 0 10px 0}\n.words{display:flex;flex-wrap:wrap;gap:8px}\n.word{background:#f0f0f0;padding:5px 10px;border-radius:4px;font-size:14px}\n</style>\n</head>\n<body>\n';

      groups.forEach((g, i) => {
        const name = this.getGroupName(i, g);
        html += `<div class="group">\n<h3>${name}</h3>\n<div class="words">\n`;
        g.forEach(word => {
          html += `<span class="word">${word}</span>`;
        });
        html += '\n</div>\n</div>\n';
      });

      html += '</body>\n</html>';
      return html;
    }

    exportToMarkdown(groups) {
      let md = '# Word Groups Export\n\n';
      md += `*Exported: ${new Date().toISOString()}*\n\n`;

      groups.forEach((g, i) => {
        const name = this.getGroupName(i, g);
        md += `## ${name}\n\n`;
        g.forEach(word => {
          md += `- ${word}\n`;
        });
        md += '\n';
      });

      return md;
    }

    exportToXML(groups) {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<wordGroups>\n';

      groups.forEach((g, i) => {
        const name = this.getGroupName(i, g);
        xml += `  <group id="${i + 1}" name="${name}">\n`;
        g.forEach(word => {
          xml += `    <word>${word}</word>\n`;
        });
        xml += '  </group>\n';
      });

      xml += '</wordGroups>';
      return xml;
    }

    exportToTSV(groups) {
      return groups.map((g, i) => {
        const name = this.getGroupName(i, g);
        return `${name}\t${g.join('\t')}`;
      }).join('\n');
    }

    addToHistory(action) {
      this.history.push({ ...action, timestamp: Date.now() });
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    getHistory() { return [...this.history]; }

    clearHistory() {
      this.history = [];
      this.emit('historyCleared');
    }

    getWordStats() {
      return {
        total: this.wordBank.size,
        used: this.usedWords.size,
        available: this.wordBank.size - this.usedWords.size,
        usagePercent: this.wordBank.size > 0
          ? Math.round((this.usedWords.size / this.wordBank.size) * 100)
          : 0
      };
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
      return {
        version: VERSION,
        settings: this.settings,
        stats: this.getWordStats(),
        statistics: this.statistics,
        themes: Array.from(this.themes.keys()),
        bannedWords: this.bannedWords.size
      };
    }

    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
      this.saveSettings();
    }

    getAllSeparationModes() { return SEPARATION_MODES; }
    getAllGroupingStrategies() { return GROUPING_STRATEGIES; }
    getAllExportFormats() { return EXPORT_FORMATS; }
  }

  window.MXD_BULK_VORTEX = new MXDBulkUltimateVortex();
  window.MXDBulkUltimateVortex = MXDBulkUltimateVortex;
})();