// hybrid-grid-engine.js — MXD OMNI-NEXUS v11.0 Hybrid Puzzle Engine
// Blends Word Search + Word Fill + Crossword into unified system
(function() {
  'use strict';

  const HYBRID_VERSION = '11.0.0';

  // Hybrid puzzle types
  const PUZZLE_TYPES = {
    WORD_SEARCH: 'word_search',
    WORD_FILL: 'word_fill',
    CROSSWORD: 'crossword',
    HYBRID_SEARCH_FILL: 'hybrid_search_fill',
    HYBRID_ALL: 'hybrid_all'
  };

  class HybridGridEngine {
    constructor() {
      this.currentType = PUZZLE_TYPES.WORD_SEARCH;
      this.crosswordGrid = null;
      this.wordFillData = null;
      this.connections = [];
      this.init();
    }

    init() {
      console.log(`🔗 Hybrid Grid Engine v${HYBRID_VERSION} — Multi-Puzzle Integration`);
    }

    // Generate hybrid puzzle with Word Search + Word Fill
    async generateHybridSearchFill(params) {
      const {
        rows,
        cols,
        words,
        fillClues = [],
        directions,
        mask,
        seed
      } = params;

      this.currentType = PUZZLE_TYPES.HYBRID_SEARCH_FILL;

      // Step 1: Generate Word Search grid
      const wordSearchResult = await this.generateWordSearch(params);
      
      // Step 2: Create Word Fill clues from placed words
      const wordFillData = this.createWordFillFromWords(words, wordSearchResult.placements);
      
      // Step 3: Link solutions - Word Fill answer populates Word Search
      const linkedResult = this.linkSolutions(wordSearchResult, wordFillData);
      
      return {
        ...linkedResult,
        type: PUZZLE_TYPES.HYBRID_SEARCH_FILL,
        wordSearch: wordSearchResult,
        wordFill: wordFillData
      };
    }

    // Generate Word Search puzzle
    async generateWordSearch(params) {
      const {
        rows,
        cols,
        words,
        directions = [
          { dr: 0, dc: 1 },  // horizontal
          { dr: 1, dc: 0 },  // vertical
          { dr: 1, dc: 1 },  // diagonal down-right
          { dr: 1, dc: -1 }, // diagonal down-left
          { dr: 0, dc: -1 }, // backward horizontal
          { dr: -1, dc: 0 }, // backward vertical
          { dr: -1, dc: -1 },// backward diagonal
          { dr: -1, dc: 1 }  // backward diagonal
        ],
        mask,
        seed
      } = params;

      // Use Quantum Grid Engine for generation
      if (window.QuantumGridEngine) {
        return await window.QuantumGridEngine.generate({
          rows, cols, words, mask,
          directions, overlapPolicy: 'matchOnly', seed
        });
      }

      // Fallback to original generation
      return this.generateWordSearchOriginal(params);
    }

    // Original Word Search generation
    generateWordSearchOriginal(params) {
      const { rows, cols, words, directions, mask, seed } = params;
      const grid = this.createEmptyGrid(rows, cols);
      const placements = {};
      const sortedWords = [...words].sort((a, b) => b.length - a.length);
      const rng = this.createSeededRandom(seed || Date.now());

      for (const word of sortedWords) {
        const cells = this.placeWord(grid, word, rows, cols, directions, mask, rng);
        if (cells) {
          cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
          placements[word] = cells;
        }
      }

      this.fillGridRandom(grid, mask, rng);
      return { grid, placements, success: true };
    }

    // Generate Crossword puzzle
    generateCrossword(params) {
      const { words, seed } = params;
      const grid = this.createEmptyGrid(21, 21); // Standard crossword size
      const placements = {};
      const rng = this.createSeededRandom(seed || Date.now());

      // Sort words by length
      const sortedWords = [...words].sort((a, b) => b.length - a.length);

      // Place first word horizontally in center
      if (sortedWords.length > 0) {
        const centerRow = Math.floor(grid.length / 2);
        const startCol = Math.floor((grid[0].length - sortedWords[0].length) / 2);
        
        const cells = [];
        for (let i = 0; i < sortedWords[0].length; i++) {
          grid[centerRow][startCol + i] = sortedWords[0][i];
          cells.push([centerRow, startCol + i]);
        }
        placements[sortedWords[0]] = { cells, direction: 'across' };
      }

      // Place remaining words
      for (let w = 1; w < sortedWords.length; w++) {
        const word = sortedWords[w];
        const placed = this.findCrosswordIntersection(grid, word, placements);
        if (placed) {
          placements[word] = placed;
          placed.cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
        }
      }

      // Convert to crossword format (block cells)
      this.convertToCrosswordFormat(grid);

      return { grid, placements, type: 'crossword' };
    }

    // Find intersection point for crossword
    findCrosswordIntersection(grid, word, existingPlacements) {
      const letters = word.split('');
      
      // Check each letter of the word against placed words
      for (let i = 0; i < letters.length; i++) {
        for (const [placedWord, data] of Object.entries(existingPlacements)) {
          for (const [r, c] of data.cells) {
            if (placedWord[i] === letters[i]) {
              // Try to place vertically here
              const cells = [];
              let valid = true;
              
              for (let j = 0; j < word.length; j++) {
                const newR = r - i + j;
                const newC = c;
                
                if (newR < 0 || newR >= grid.length) {
                  valid = false;
                  break;
                }
                
                if (grid[newR][newC] !== '' && grid[newR][newC] !== word[j]) {
                  valid = false;
                  break;
                }
                
                cells.push([newR, newC]);
              }
              
              if (valid) {
                return { cells, direction: 'down' };
              }
            }
          }
        }
      }
      
      return null;
    }

    // Convert grid to crossword format (add blocks)
    convertToCrosswordFormat(grid) {
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c] === '') {
            // Randomly block some cells for crossword style
            if (Math.random() > 0.6) {
              grid[r][c] = '#';
            }
          }
        }
      }
    }

    // Create Word Fill clues from word list
    createWordFillFromWords(words, placements) {
      const clues = {};
      const definitions = this.generateDefinitions(words);
      
      words.forEach((word, index) => {
        clues[word] = {
          clue: definitions[word] || `Word ${index + 1}`,
          answer: word,
          row: placements[word]?.[0]?.[0] ?? index,
          col: placements[word]?.[0]?.[1] ?? index
        };
      });
      
      return {
        clues,
        words: words.map((w, i) => ({ word: w, index: i })),
        type: 'word_fill'
      };
    }

    // Generate simple definitions for words
    generateDefinitions(words) {
      const patterns = {
        animals: ['A common domestic animal', 'A wild feline predator', 'A flying creature', 'An ocean mammal'],
        fruits: ['A red fruit', 'A tropical fruit', 'A citrus fruit', 'A yellow fruit'],
        colors: ['The color of the sky', 'The color of grass', 'The color of fire', 'A warm color'],
        nature: ['A large body of water', 'A land formation', 'A type of tree', 'A natural phenomenon']
      };

      const definitions = {};
      words.forEach(word => {
        const category = this.detectCategory(word);
        const baseDef = patterns[category]?.[Math.floor(Math.random() * 4)] || `A ${word.length}-letter word`;
        definitions[word] = baseDef;
      });
      
      return definitions;
    }

    // Detect word category
    detectCategory(word) {
      const categories = {
        animals: ['DOG', 'CAT', 'BIRD', 'FISH', 'LION', 'TIGER', 'BEAR', 'WOLF', 'HORSE', 'COW', 'PIG', 'SHEEP', 'RABBIT', 'EAGLE', 'SHARK', 'WHALE'],
        fruits: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'MANGO', 'PEACH', 'PLUM', 'CHERRY', 'LEMON', 'LIME', 'MELON', 'KIWI', 'PEAR', 'FIG', 'DATE'],
        colors: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BLACK', 'WHITE', 'BROWN', 'GRAY', 'GOLD', 'SILVER'],
        nature: ['TREE', 'FLOWER', 'GRASS', 'LEAF', 'RIVER', 'MOUNTAIN', 'OCEAN', 'BEACH', 'FOREST', 'DESERT', 'LAKE', 'VALLEY']
      };

      for (const [cat, words] of Object.entries(categories)) {
        if (words.includes(word)) return cat;
      }
      
      return 'general';
    }

    // Link Word Fill answers to Word Search highlights
    linkSolutions(wordSearchResult, wordFillData) {
      // Create connection map
      const connections = [];
      
      for (const [word, data] of Object.entries(wordFillData.clues)) {
        if (wordSearchResult.placements[word]) {
          connections.push({
            word,
            searchCells: wordSearchResult.placements[word],
            fillPosition: { row: data.row, col: data.col }
          });
        }
      }

      return {
        ...wordSearchResult,
        connections,
        linkedSolutions: wordFillData
      };
    }

    // Generate hybrid all-in-one puzzle
    async generateAllHybrid(params) {
      const {
        rows,
        cols,
        words,
        directions,
        mask,
        includeCrossword = true,
        includeWordFill = true,
        seed
      } = params;

      // Generate all puzzle types
      const results = {
        type: PUZZLE_TYPES.HYBRID_ALL,
        timestamp: Date.now()
      };

      // Word Search
      results.wordSearch = await this.generateWordSearch(params);

      // Word Fill (if enabled)
      if (includeWordFill) {
        results.wordFill = this.createWordFillFromWords(words, results.wordSearch.placements);
      }

      // Crossword (if enabled)
      if (includeCrossword) {
        results.crossword = this.generateCrossword({ words, seed });
      }

      // Create unified solution map
      results.unifiedPlacements = this.createUnifiedPlacements(results);

      return results;
    }

    // Create unified placements for multi-puzzle display
    createUnifiedPlacements(results) {
      const unified = {
        wordSearch: results.wordSearch?.placements || {},
        wordFill: results.wordFill?.clues || {},
        crossword: results.crossword?.placements || {}
      };

      // Add display priority
      unified.displayOrder = [
        ...Object.keys(unified.wordSearch),
        ...Object.keys(unified.crossword).filter(w => !unified.wordSearch[w])
      ];

      return unified;
    }

    // Helper: Create empty grid
    createEmptyGrid(rows, cols) {
      const grid = [];
      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          grid[r][c] = '';
        }
      }
      return grid;
    }

    // Helper: Place word in grid
    placeWord(grid, word, rows, cols, directions, mask, rng) {
      const allPositions = [];
      
      for (const dir of directions) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            allPositions.push({ row: r, col: c, dr: dir.dr, dc: dir.dc });
          }
        }
      }

      // Shuffle
      for (let i = allPositions.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
      }

      for (const pos of allPositions) {
        const cells = [];
        let valid = true;

        for (let i = 0; i < word.length; i++) {
          const r = pos.row + pos.dr * i;
          const c = pos.col + pos.dc * i;

          if (r < 0 || r >= rows || c < 0 || c >= cols) {
            valid = false;
            break;
          }

          if (!mask || !mask[r] || !mask[r][c]) {
            valid = false;
            break;
          }

          if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
            valid = false;
            break;
          }

          cells.push([r, c]);
        }

        if (valid) return cells;
      }

      return null;
    }

    // Helper: Fill grid with random letters
    fillGridRandom(grid, mask, rng) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const common = 'ETAOINSHRDLUCUMWFGYPBVKJXQZ';

      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c] === '' && (!mask || (mask[r] && mask[r][c]))) {
            const useCommon = rng() > 0.3;
            grid[r][c] = (useCommon ? common : letters)[Math.floor(rng() * letters.length)];
          }
        }
      }
    }

    // Helper: Create seeded random
    createSeededRandom(seed) {
      let s = seed;
      return function() {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
      };
    }

    // Get current puzzle type
    getCurrentType() {
      return this.currentType;
    }

    // Set puzzle type
    setPuzzleType(type) {
      if (Object.values(PUZZLE_TYPES).includes(type)) {
        this.currentType = type;
        console.log(`🔗 Puzzle type set to: ${type}`);
      }
    }

    // Export all puzzle data
    exportAll() {
      return {
        version: HYBRID_VERSION,
        type: this.currentType,
        timestamp: Date.now(),
        connections: this.connections
      };
    }
  }

  // Initialize global hybrid engine
  window.HybridGridEngine = new HybridGridEngine();
  window.MXD_HYBRID = HybridGridEngine;

})();