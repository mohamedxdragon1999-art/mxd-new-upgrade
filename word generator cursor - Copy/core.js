// core.js — MXD Core: Settings + Engine + Data + PDF + Quality System (Enhanced)
// Combines: settings.js, engine.js, data.js, pdf.js + MXD Hyper Roadmap v6.0
// Version: 6.0.0

// ============ QUALITY TIERS SYSTEM (MXD Hyper Roadmap) ============
window.MXD_QUALITY_TIERS = {
  highSpeed: {
    id: 'highSpeed',
    label: 'High Speed',
    description: 'Fastest generation, 300 DPI, draft quality',
    dpi: 300,
    compression: 'medium',
    antialiasing: false,
    fontEmbedding: false,
    colorProfile: 'RGB',
    generationSpeed: 'fast',
    maxRetries: 1,
    previewQuality: 'low',
    pdfOptions: {
      compress: true,
      optimizer: true,
      imageQuality: 70
    }
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    description: 'Good quality, 400 DPI, balanced speed',
    dpi: 400,
    compression: 'low',
    antialiasing: true,
    fontEmbedding: true,
    colorProfile: 'RGB',
    generationSpeed: 'normal',
    maxRetries: 3,
    previewQuality: 'medium',
    pdfOptions: {
      compress: false,
      optimizer: true,
      imageQuality: 85
    }
  },
  highQuality: {
    id: 'highQuality',
    label: 'High Quality',
    description: 'Maximum quality, 500 DPI, premium output',
    dpi: 500,
    compression: 'none',
    antialiasing: true,
    fontEmbedding: true,
    colorProfile: 'CMYK-safe',
    generationSpeed: 'slow',
    maxRetries: 5,
    previewQuality: 'high',
    pdfOptions: {
      compress: false,
      optimizer: false,
      imageQuality: 100
    }
  }
};

// ============ DIFFICULTY SETTINGS (MXD Hyper Roadmap) ============
window.MXD_DIFFICULTY_PRESETS = {
  'very-easy': {
    label: 'Very Easy',
    description: 'Beginners, seniors, memory care',
    overallDifficulty: 1,
    wordCountMin: 5,
    wordCountMax: 8,
    wordLengthMin: 3,
    wordLengthMax: 6,
    allowDiag: false,
    allowReverse: false,
    allowH: true,
    allowV: true,
    overlapPolicy: 'none',
    fillerComplexity: 'low',
    accidentalWordSensitivity: 'high',
    edgeBias: 'avoid-edges',
    clusterWords: false
  },
  easy: {
    label: 'Easy',
    description: 'Kids, ESL learners',
    overallDifficulty: 2,
    wordCountMin: 6,
    wordCountMax: 10,
    wordLengthMin: 3,
    wordLengthMax: 7,
    allowDiag: false,
    allowReverse: false,
    allowH: true,
    allowV: true,
    overlapPolicy: 'none',
    fillerComplexity: 'low',
    accidentalWordSensitivity: 'medium',
    edgeBias: 'balanced',
    clusterWords: false
  },
  medium: {
    label: 'Medium',
    description: 'Adults, general audience',
    overallDifficulty: 5,
    wordCountMin: 8,
    wordCountMax: 15,
    wordLengthMin: 4,
    wordLengthMax: 10,
    allowDiag: true,
    allowReverse: true,
    allowH: true,
    allowV: true,
    overlapPolicy: 'matchOnly',
    fillerComplexity: 'medium',
    accidentalWordSensitivity: 'medium',
    edgeBias: 'balanced',
    clusterWords: true
  },
  hard: {
    label: 'Hard',
    description: 'Teens, puzzle enthusiasts',
    overallDifficulty: 7,
    wordCountMin: 10,
    wordCountMax: 20,
    wordLengthMin: 5,
    wordLengthMax: 12,
    allowDiag: true,
    allowReverse: true,
    allowH: true,
    allowV: true,
    overlapPolicy: 'matchOnly',
    fillerComplexity: 'high',
    accidentalWordSensitivity: 'low',
    edgeBias: 'balanced',
    clusterWords: true
  },
  expert: {
    label: 'Expert',
    description: 'Puzzle masters',
    overallDifficulty: 9,
    wordCountMin: 12,
    wordCountMax: 25,
    wordLengthMin: 6,
    wordLengthMax: 15,
    allowDiag: true,
    allowReverse: true,
    allowH: true,
    allowV: true,
    overlapPolicy: 'matchOnly',
    fillerComplexity: 'adaptive',
    accidentalWordSensitivity: 'low',
    edgeBias: 'prefer-edges',
    clusterWords: true
  },
  adaptive: {
    label: 'Adaptive',
    description: 'Auto-tunes based on audience',
    overallDifficulty: 5,
    wordCountMin: 8,
    wordCountMax: 15,
    wordLengthMin: 4,
    wordLengthMax: 10,
    allowDiag: true,
    allowReverse: true,
    allowH: true,
    allowV: true,
    overlapPolicy: 'matchOnly',
    fillerComplexity: 'adaptive',
    accidentalWordSensitivity: 'medium',
    edgeBias: 'balanced',
    clusterWords: true
  },
  senior: {
    label: 'Senior Mode',
    description: 'Large print, low clutter, calm',
    overallDifficulty: 2,
    wordCountMin: 6,
    wordCountMax: 10,
    wordLengthMin: 4,
    wordLengthMax: 8,
    allowDiag: false,
    allowReverse: false,
    allowH: true,
    allowV: true,
    overlapPolicy: 'none',
    fillerComplexity: 'low',
    accidentalWordSensitivity: 'high',
    edgeBias: 'avoid-edges',
    clusterWords: false,
    largePrint: true,
    highContrast: true,
    lowClutter: true
  },
  kids: {
    label: 'Kids Mode',
    description: 'Simple, educational, playful',
    overallDifficulty: 3,
    wordCountMin: 6,
    wordCountMax: 12,
    wordLengthMin: 3,
    wordLengthMax: 8,
    allowDiag: false,
    allowReverse: false,
    allowH: true,
    allowV: true,
    overlapPolicy: 'none',
    fillerComplexity: 'low',
    accidentalWordSensitivity: 'high',
    edgeBias: 'balanced',
    clusterWords: false,
    playful: true
  },
  memoryCare: {
    label: 'Memory Care',
    description: 'Calm categories, easier flow',
    overallDifficulty: 1,
    wordCountMin: 5,
    wordCountMax: 8,
    wordLengthMin: 4,
    wordLengthMax: 7,
    allowDiag: false,
    allowReverse: false,
    allowH: true,
    allowV: true,
    overlapPolicy: 'none',
    fillerComplexity: 'low',
    accidentalWordSensitivity: 'high',
    edgeBias: 'prefer-edges',
    clusterWords: false,
    largePrint: true,
    highContrast: true,
    lowClutter: true,
    memoryCareFriendly: true
  }
};

// ============ PUZZLE QUALITY SCORING SYSTEM (MXD W5) ============
window.MXD_QualityScorer = {
  analyzePuzzle(puzzle, settings) {
    const scores = {
      readability: this.calculateReadability(puzzle, settings),
      uniqueness: this.calculateUniqueness(puzzle, settings),
      placementQuality: this.calculatePlacementQuality(puzzle, settings),
      balance: this.calculateBalance(puzzle, settings),
      density: this.calculateDensity(puzzle, settings),
      printQuality: this.calculatePrintQuality(puzzle, settings)
    };
    
    const weights = {
      readability: 0.25,
      uniqueness: 0.20,
      placementQuality: 0.20,
      balance: 0.15,
      density: 0.10,
      printQuality: 0.10
    };
    
    const overall = Object.keys(scores).reduce((sum, key) => {
      return sum + (scores[key] * weights[key]);
    }, 0);
    
    return {
      overall: Math.round(overall),
      breakdown: scores,
      grade: this.getGrade(overall),
      warnings: this.generateWarnings(puzzle, settings, scores),
      suggestions: this.generateSuggestions(puzzle, settings, scores)
    };
  },
  
  calculateReadability(puzzle, settings) {
    const { grid, placements, mask } = puzzle;
    let score = 100;
    
    const avgWordLength = Object.keys(placements).reduce((sum, w) => sum + w.length, 0) / Object.keys(placements).length;
    if (avgWordLength > 10) score -= 15;
    if (avgWordLength < 4) score -= 10;
    
    const totalCells = grid.length * grid[0].length;
    const usedCells = Object.values(placements).flat().length;
    const fillRatio = usedCells / totalCells;
    if (fillRatio < 0.3) score -= 20;
    if (fillRatio > 0.8) score -= 15;
    
    const maskCells = mask.flat().filter(Boolean).length;
    const maskRatio = usedCells / maskCells;
    if (maskRatio < 0.3) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  },
  
  calculateUniqueness(puzzle, settings) {
    const { placements } = puzzle;
    const words = Object.keys(placements);
    let score = 100;
    
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        if (this.stemSimilar(words[i], words[j])) {
          score -= 5;
        }
      }
    }
    
    return Math.max(0, Math.min(100, score));
  },
  
  stemSimilar(w1, w2) {
    if (Math.abs(w1.length - w2.length) > 3) return false;
    const minLen = Math.min(w1.length, w2.length);
    let matches = 0;
    for (let i = 0; i < minLen; i++) {
      if (w1[i] === w2[i]) matches++;
    }
    return matches / minLen > 0.8;
  },
  
  calculatePlacementQuality(puzzle, settings) {
    const { placements } = puzzle;
    let score = 100;
    const words = Object.keys(placements);
    
    const directions = new Set();
    words.forEach(w => {
      const cells = placements[w];
      if (cells.length < 2) return;
      const [r1, c1] = cells[0];
      const [r2, c2] = cells[cells.length - 1];
      const dr = Math.sign(r2 - r1);
      const dc = Math.sign(c2 - c1);
      directions.add(`${dr},${dc}`);
    });
    
    if (directions.size < 2) score -= 30;
    else if (directions.size < 4) score -= 15;
    
    const overlaps = this.countOverlaps(placements);
    if (overlaps > 5) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  },
  
  countOverlaps(placements) {
    const cellMap = {};
    let overlaps = 0;
    Object.values(placements).forEach(cells => {
      cells.forEach(([r, c]) => {
        const key = `${r},${c}`;
        if (cellMap[key]) overlaps++;
        else cellMap[key] = true;
      });
    });
    return overlaps;
  },
  
  calculateBalance(puzzle, settings) {
    const { grid, placements, mask } = puzzle;
    const rows = grid.length;
    const cols = grid[0].length;
    let score = 100;
    
    const quadrantUsage = [0, 0, 0, 0];
    Object.values(placements).forEach(cells => {
      cells.forEach(([r, c]) => {
        const q = (r < rows / 2 ? 0 : 2) + (c < cols / 2 ? 0 : 1);
        quadrantUsage[q]++;
      });
    });
    
    const avg = quadrantUsage.reduce((a, b) => a + b, 0) / 4;
    quadrantUsage.forEach(q => {
      const diff = Math.abs(q - avg) / avg;
      if (diff > 0.5) score -= 15;
    });
    
    return Math.max(0, Math.min(100, score));
  },
  
  calculateDensity(puzzle, settings) {
    const { placements, mask } = puzzle;
    const maskCells = mask.flat().filter(Boolean).length;
    const usedCells = Object.values(placements).flat().length;
    const density = usedCells / maskCells;
    
    if (density < 0.25) return 40;
    if (density < 0.4) return 70;
    if (density < 0.6) return 100;
    if (density < 0.8) return 85;
    return 60;
  },
  
  calculatePrintQuality(puzzle, settings) {
    let score = 100;
    
    const wordCount = Object.keys(puzzle.placements).length;
    if (wordCount < 5) score -= 20;
    if (wordCount > 30) score -= 15;
    
    const words = Object.keys(puzzle.placements);
    const tooLong = words.filter(w => w.length > 15);
    if (tooLong.length > 2) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  },
  
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },
  
  generateWarnings(puzzle, settings, scores) {
    const warnings = [];
    
    if (scores.readability < 60) {
      warnings.push({ severity: 'high', message: 'Low readability - consider adjusting word lengths or grid size' });
    }
    
    if (scores.uniqueness < 60) {
      warnings.push({ severity: 'medium', message: 'Similar words detected - may cause confusion' });
    }
    
    if (scores.placementQuality < 60) {
      warnings.push({ severity: 'medium', message: 'Limited word direction variety' });
    }
    
    if (scores.balance < 60) {
      warnings.push({ severity: 'medium', message: 'Unbalanced grid - words clustered in one area' });
    }
    
    return warnings;
  },
  
  generateSuggestions(puzzle, settings, scores) {
    const suggestions = [];
    
    if (scores.density < 70) {
      suggestions.push('Add more words to fill the grid better');
    }
    
    if (scores.placementQuality < 80) {
      suggestions.push('Enable diagonal placement for more variety');
    }
    
    if (scores.balance < 80) {
      suggestions.push('Try a different shape to spread words evenly');
    }
    
    return suggestions;
  }
};

// ============ ADAPTIVE DIFFICULTY ENGINE (MXD W1) ============
window.MXD_AdaptiveDifficultyEngine = {
  difficultyHistory: [],
  userProfiles: {},
  
  initializeAudienceProfile(audienceType) {
    const profiles = {
      kids: {
        learningRate: 0.15,
        targetComplexity: 0.3,
        maxWordLength: 8,
        minWordLength: 3,
        preferredGridSize: 'small',
        toleranceForFailure: 0.3,
        hintFrequency: 'high',
        reinforcementStyle: 'positive'
      },
      teens: {
        learningRate: 0.25,
        targetComplexity: 0.5,
        maxWordLength: 12,
        minWordLength: 5,
        preferredGridSize: 'medium',
        toleranceForFailure: 0.2,
        hintFrequency: 'medium',
        reinforcementStyle: 'challenging'
      },
      adults: {
        learningRate: 0.2,
        targetComplexity: 0.55,
        maxWordLength: 15,
        minWordLength: 4,
        preferredGridSize: 'medium',
        toleranceForFailure: 0.15,
        hintFrequency: 'low',
        reinforcementStyle: 'balanced'
      },
      seniors: {
        learningRate: 0.1,
        targetComplexity: 0.25,
        maxWordLength: 7,
        minWordLength: 4,
        preferredGridSize: 'large',
        toleranceForFailure: 0.4,
        hintFrequency: 'very-high',
        reinforcementStyle: 'gentle'
      },
      memoryCare: {
        learningRate: 0.08,
        targetComplexity: 0.2,
        maxWordLength: 6,
        minWordLength: 4,
        preferredGridSize: 'large',
        toleranceForFailure: 0.5,
        hintFrequency: 'very-high',
        reinforcementStyle: 'calm'
      }
    };
    
    return profiles[audienceType] || profiles.adults;
  },
  
  calculateDynamicDifficulty(sessionData) {
    const { completedPuzzles, failedPuzzles, timeSpent, hintsUsed } = sessionData;
    
    const successRate = completedPuzzles / (completedPuzzles + failedPuzzles + 1);
    const avgTime = timeSpent / (completedPuzzles + 1);
    const hintRatio = hintsUsed / (completedPuzzles + 1);
    
    const baseScore = successRate * 40;
    const timeScore = Math.max(0, 30 - (avgTime / 60) * 10);
    const hintScore = Math.max(0, 30 - (hintRatio * 50));
    
    return {
      overall: Math.min(100, baseScore + timeScore + hintScore),
      successRate: (successRate * 100).toFixed(1),
      avgTimeSeconds: Math.round(avgTime),
      hintUsage: (hintRatio * 100).toFixed(1),
      recommendedDifficulty: this.getRecommendedDifficulty(baseScore + timeScore + hintScore)
    };
  },
  
  getRecommendedDifficulty(score) {
    if (score < 30) return { level: 1, label: 'Very Easy', adjustment: -2 };
    if (score < 50) return { level: 2, label: 'Easy', adjustment: -1 };
    if (score < 70) return { level: 3, label: 'Medium', adjustment: 0 };
    if (score < 85) return { level: 4, label: 'Hard', adjustment: 1 };
    return { level: 5, label: 'Expert', adjustment: 2 };
  },
  
  applyAdaptiveAdjustment(baseDifficulty, userScore) {
    const adjustment = this.getRecommendedDifficulty(userScore).adjustment;
    const newDifficulty = Math.max(1, Math.min(10, baseDifficulty + adjustment));
    
    return {
      ...baseDifficulty,
      overallDifficulty: newDifficulty,
      wordCountMin: Math.max(5, baseDifficulty.wordCountMin + adjustment),
      wordCountMax: Math.max(8, baseDifficulty.wordCountMax + adjustment),
      wordLengthMin: Math.max(3, baseDifficulty.wordLengthMin + Math.floor(adjustment / 2)),
      wordLengthMax: Math.max(6, baseDifficulty.wordLengthMax + Math.floor(adjustment / 2))
    };
  },
  
  trackSession(puzzleId, data) {
    this.difficultyHistory.push({
      puzzleId,
      timestamp: Date.now(),
      ...data
    });
    
    if (this.difficultyHistory.length > 100) {
      this.difficultyHistory.shift();
    }
  },
  
  generateSessionReport() {
    const recent = this.difficultyHistory.slice(-20);
    
    return {
      totalSessions: this.difficultyHistory.length,
      recentSessions: recent.length,
      averageSuccess: recent.reduce((s, h) => s + (h.success ? 1 : 0), 0) / Math.max(recent.length, 1),
      averageTime: recent.reduce((s, h) => s + (h.timeSpent || 0), 0) / Math.max(recent.length, 1),
      difficultyTrend: this.analyzeTrend(),
      recommendations: this.generateRecommendations()
    };
  },
  
  analyzeTrend() {
    if (this.difficultyHistory.length < 5) return 'insufficient_data';
    
    const recent = this.difficultyHistory.slice(-10);
    const first = recent.slice(0, 5);
    const last = recent.slice(-5);
    
    const firstAvg = first.reduce((s, h) => s + (h.difficulty || 5), 0) / first.length;
    const lastAvg = last.reduce((s, h) => s + (h.difficulty || 5), 0) / last.length;
    
    if (lastAvg > firstAvg + 0.5) return 'increasing';
    if (lastAvg < firstAvg - 0.5) return 'decreasing';
    return 'stable';
  },
  
  generateRecommendations() {
    const report = this.generateSessionReport();
    const recs = [];
    
    if (report.averageSuccess < 0.6) {
      recs.push('Consider reducing difficulty or using easier presets');
    }
    if (report.averageTime > 300) {
      recs.push('Users spending too long - consider shorter puzzles or larger print');
    }
    if (report.difficultyTrend === 'increasing' && report.averageSuccess > 0.8) {
      recs.push('Users performing well - gradually increase challenge');
    }
    
    return recs;
  },
  
  createDifficultyCurve(targetPuzzles, startDifficulty, endDifficulty) {
    const curve = [];
    for (let i = 0; i < targetPuzzles; i++) {
      const progress = i / (targetPuzzles - 1);
      const difficulty = startDifficulty + (endDifficulty - startDifficulty) * this.easeInOutCurve(progress);
      
      curve.push({
        puzzleIndex: i,
        difficulty: Math.round(difficulty * 10) / 10,
        wordCount: Math.round(8 + progress * 7),
        wordLengthRange: {
          min: Math.round(4 + progress * 2),
          max: Math.round(8 + progress * 5)
        }
      });
    }
    
    return curve;
  },
  
  easeInOutCurve(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },
  
  exportDifficultyProfile() {
    return {
      history: this.difficultyHistory,
      profiles: this.userProfiles,
      exportDate: new Date().toISOString()
    };
  },
  
  importDifficultyProfile(data) {
    if (data.history) this.difficultyHistory = data.history;
    if (data.profiles) this.userProfiles = data.profiles;
  }
};

// ============ DIFFICULTY PRESET BUILDER (MXD W2) ============
window.MXD_DifficultyPresetBuilder = {
  customPresets: {},
  
  createPreset(config) {
    const preset = {
      id: config.id || `custom_${Date.now()}`,
      label: config.label || 'Custom Preset',
      description: config.description || 'User-created difficulty preset',
      overallDifficulty: config.overallDifficulty || 5,
      wordCountMin: config.wordCountMin || 8,
      wordCountMax: config.wordCountMax || 15,
      wordLengthMin: config.wordLengthMin || 4,
      wordLengthMax: config.wordLengthMax || 10,
      allowDiag: config.allowDiag ?? true,
      allowReverse: config.allowReverse ?? true,
      allowH: config.allowH ?? true,
      allowV: config.allowV ?? true,
      overlapPolicy: config.overlapPolicy || 'matchOnly',
      fillerComplexity: config.fillerComplexity || 'medium',
      accidentalWordSensitivity: config.accidentalWordSensitivity || 'medium',
      edgeBias: config.edgeBias || 'balanced',
      clusterWords: config.clusterWords ?? true,
      largePrint: config.largePrint ?? false,
      highContrast: config.highContrast ?? false,
      lowClutter: config.lowClutter ?? false
    };
    
    this.customPresets[preset.id] = preset;
    return preset;
  },
  
  buildFromKeywords(keywords) {
    const normalized = keywords.toLowerCase();
    
    let difficulty = 5;
    let fillerComplexity = 'medium';
    let accidentalSensitivity = 'medium';
    let clusterWords = true;
    
    if (normalized.includes('easy') || normalized.includes('kids') || normalized.includes('beginner')) {
      difficulty = 2;
      fillerComplexity = 'low';
      accidentalSensitivity = 'high';
      clusterWords = false;
    } else if (normalized.includes('hard') || normalized.includes('expert') || normalized.includes('master')) {
      difficulty = 8;
      fillerComplexity = 'high';
      accidentalSensitivity = 'low';
      clusterWords = true;
    } else if (normalized.includes('senior') || normalized.includes('elderly') || normalized.includes('memory')) {
      difficulty = 1;
      fillerComplexity = 'low';
      accidentalSensitivity = 'high';
      clusterWords = false;
    }
    
    const preset = {
      id: `built_${Date.now()}`,
      label: `Auto-Built: ${keywords.substring(0, 20)}`,
      description: 'Automatically generated preset based on keywords',
      overallDifficulty: difficulty,
      fillerComplexity,
      accidentalWordSensitivity: accidentalSensitivity,
      clusterWords,
      wordCountMin: Math.max(5, 10 - difficulty),
      wordCountMax: Math.max(8, 15 - difficulty),
      wordLengthMin: Math.max(3, 5 - Math.floor(difficulty / 3)),
      wordLengthMax: Math.max(6, 10 - Math.floor(difficulty / 4)),
      allowDiag: difficulty > 3,
      allowReverse: difficulty > 3,
      allowH: true,
      allowV: true,
      overlapPolicy: difficulty > 5 ? 'matchOnly' : 'none',
      edgeBias: 'balanced',
      largePrint: difficulty < 3,
      highContrast: difficulty < 3,
      lowClutter: difficulty < 3
    };
    
    this.customPresets[preset.id] = preset;
    return preset;
  },
  
  blendPresets(presets, weights) {
    const blended = {
      id: `blend_${Date.now()}`,
      label: 'Blended Preset',
      description: 'Custom blend of multiple presets',
      overallDifficulty: 0,
      wordCountMin: 0,
      wordCountMax: 0,
      wordLengthMin: 0,
      wordLengthMax: 0,
      allowDiag: false,
      allowReverse: false,
      allowH: true,
      allowV: true,
      overlapPolicy: 'matchOnly',
      fillerComplexity: 'medium',
      accidentalWordSensitivity: 'medium',
      edgeBias: 'balanced',
      clusterWords: true
    };
    
    const numericFields = ['overallDifficulty', 'wordCountMin', 'wordCountMax', 'wordLengthMin', 'wordLengthMax'];
    const booleanFields = ['allowDiag', 'allowReverse', 'allowH', 'allowV', 'clusterWords', 'largePrint', 'highContrast', 'lowClutter'];
    
    let totalWeight = 0;
    presets.forEach((preset, idx) => {
      const weight = weights[idx] || 1;
      totalWeight += weight;
      
      numericFields.forEach(field => {
        blended[field] = (blended[field] || 0) + (preset[field] || 0) * weight;
      });
      
      booleanFields.forEach(field => {
        if (preset[field]) blended[field] = true;
      });
    });
    
    numericFields.forEach(field => {
      blended[field] = Math.round(blended[field] / totalWeight);
    });
    
    this.customPresets[blended.id] = blended;
    return blended;
  },
  
  savePreset(preset) {
    this.customPresets[preset.id] = preset;
    localStorage.setItem('mxd:customPresets', JSON.stringify(this.customPresets));
    return preset;
  },
  
  loadCustomPresets() {
    try {
      const stored = localStorage.getItem('mxd:customPresets');
      if (stored) {
        this.customPresets = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load custom presets:', e);
    }
    return this.customPresets;
  },
  
  deletePreset(presetId) {
    delete this.customPresets[presetId];
    localStorage.setItem('mxd:customPresets', JSON.stringify(this.customPresets));
  },
  
  exportPresets() {
    return {
      custom: this.customPresets,
      exportDate: new Date().toISOString()
    };
  },
  
  importPresets(data) {
    if (data.custom) {
      this.customPresets = { ...this.customPresets, ...data.custom };
      localStorage.setItem('mxd:customPresets', JSON.stringify(this.customPresets));
    }
  },
  
  getAllPresets() {
    return {
      ...window.MXD_DIFFICULTY_PRESETS,
      ...this.customPresets
    };
  }
};

// ============ DIFFICULTY CURVE BUILDER (MXD W11) ============
window.MXD_DifficultyCurveBuilder = {
  curves: {},
  
  createStandardCurve(puzzleCount, startLevel, endLevel) {
    const curve = [];
    for (let i = 0; i < puzzleCount; i++) {
      const progress = i / (puzzleCount - 1);
      const eased = this.applyEasing(progress, 'smooth');
      
      curve.push({
        index: i,
        difficulty: startLevel + (endLevel - startLevel) * eased,
        description: this.getDifficultyDescription(startLevel + (endLevel - startLevel) * eased),
        estimatedTime: Math.round(5 + progress * 15)
      });
    }
    
    this.curves.standard = curve;
    return curve;
  },
  
  createPeakCurve(puzzleCount, peakPosition = 0.6) {
    const curve = [];
    for (let i = 0; i < puzzleCount; i++) {
      const progress = i / (puzzleCount - 1);
      let value;
      
      if (progress <= peakPosition) {
        value = progress / peakPosition;
      } else {
        value = 1 - ((progress - peakPosition) / (1 - peakPosition));
      }
      
      curve.push({
        index: i,
        difficulty: 1 + value * 9,
        description: this.getDifficultyDescription(1 + value * 9),
        estimatedTime: Math.round(10 - Math.abs(progress - peakPosition) * 10)
      });
    }
    
    this.curves.peak = curve;
    return curve;
  },
  
  createStaircaseCurve(puzzleCount, steps = 5) {
    const curve = [];
    const stepSize = Math.floor(puzzleCount / steps);
    
    for (let i = 0; i < puzzleCount; i++) {
      const step = Math.min(steps - 1, Math.floor(i / stepSize));
      const progress = i / (puzzleCount - 1);
      const baseDifficulty = 1 + (step / (steps - 1)) * 9;
      const jitter = (Math.random() - 0.5) * 0.5;
      
      curve.push({
        index: i,
        difficulty: Math.max(1, Math.min(10, baseDifficulty + jitter)),
        description: `Step ${step + 1} of ${steps}`,
        estimatedTime: Math.round(5 + (step / (steps - 1)) * 15)
      });
    }
    
    this.curves.staircase = curve;
    return curve;
  },
  
  createRandomCurve(puzzleCount, minLevel, maxLevel) {
    const curve = [];
    let current = minLevel + Math.random() * (maxLevel - minLevel);
    
    for (let i = 0; i < puzzleCount; i++) {
      const drift = (Math.random() - 0.5) * 0.8;
      current = Math.max(minLevel, Math.min(maxLevel, current + drift));
      
      if (i > 0 && Math.random() < 0.15) {
        current = minLevel + Math.random() * (maxLevel - minLevel);
      }
      
      curve.push({
        index: i,
        difficulty: Math.round(current * 10) / 10,
        description: this.getDifficultyDescription(current),
        estimatedTime: Math.round(8 + Math.random() * 12)
      });
    }
    
    this.curves.random = curve;
    return curve;
  },
  
  applyEasing(t, type) {
    switch (type) {
      case 'linear': return t;
      case 'smooth': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'sharp': return t < 0.5 ? t * 2 : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'expo': return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
      case 'back': return t === 0 ? 0 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
      default: return t;
    }
  },
  
  getDifficultyDescription(level) {
    if (level <= 2) return 'Very Easy';
    if (level <= 4) return 'Easy';
    if (level <= 6) return 'Medium';
    if (level <= 8) return 'Hard';
    return 'Expert';
  },
  
  getCurveStats(curve) {
    const difficulties = curve.map(c => c.difficulty);
    const sum = difficulties.reduce((a, b) => a + b, 0);
    const avg = sum / difficulties.length;
    const min = Math.min(...difficulties);
    const max = Math.max(...difficulties);
    const range = max - min;
    
    return {
      totalPuzzles: curve.length,
      averageDifficulty: avg.toFixed(2),
      minDifficulty: min,
      maxDifficulty: max,
      difficultyRange: range.toFixed(2),
      estimatedTotalTime: curve.reduce((s, c) => s + c.estimatedTime, 0)
    };
  },
  
  exportCurves() {
    return {
      curves: this.curves,
      exportDate: new Date().toISOString()
    };
  },
  
  importCurves(data) {
    if (data.curves) {
      this.curves = { ...this.curves, ...data.curves };
    }
  }
};

// ============ PUZZLE VARIETY ENGINE (MXD W12) ============
window.MXD_PuzzleVarietyEngine = {
  varietyRules: {},
  rotationHistory: [],
  
  initializeRules() {
    this.varietyRules = {
      shapeRotation: {
        enabled: true,
        minInterval: 3,
        shapes: ['square', 'circle', 'diamond', 'triangle', 'hexagon']
      },
      colorRotation: {
        enabled: true,
        minInterval: 2,
        templates: ['classic', 'ocean', 'forest', 'sunset', 'rose']
      },
      difficultyVariation: {
        enabled: true,
        maxConsecutiveSame: 2
      },
      themeVariation: {
        enabled: true,
        themes: ['animals', 'nature', 'food', 'sports', 'science', 'geography']
      }
    };
  },
  
  getNextPuzzleConfig(history = []) {
    this.rotationHistory = history;
    const config = {};
    
    if (this.varietyRules.shapeRotation.enabled) {
      config.shape = this.getNextShape();
    }
    
    if (this.varietyRules.colorRotation.enabled) {
      config.template = this.getNextTemplate();
    }
    
    if (this.varietyRules.difficultyVariation.enabled) {
      config.difficulty = this.getNextDifficulty();
    }
    
    if (this.varietyRules.themeVariation.enabled) {
      config.theme = this.getNextTheme();
    }
    
    return config;
  },
  
  getNextShape() {
    const shapes = this.varietyRules.shapeRotation.shapes;
    const recent = this.rotationHistory.slice(-this.varietyRules.shapeRotation.minInterval);
    const recentShapes = recent.map(h => h.shape).filter(Boolean);
    
    const available = shapes.filter(s => !recentShapes.includes(s));
    const pool = available.length > 0 ? available : shapes;
    
    return pool[Math.floor(Math.random() * pool.length)];
  },
  
  getNextTemplate() {
    const templates = this.varietyRules.colorRotation.templates;
    const recent = this.rotationHistory.slice(-this.varietyRules.colorRotation.minInterval);
    const recentTemplates = recent.map(h => h.template).filter(Boolean);
    
    const available = templates.filter(t => !recentTemplates.includes(t));
    const pool = available.length > 0 ? available : templates;
    
    return pool[Math.floor(Math.random() * pool.length)];
  },
  
  getNextDifficulty() {
    const recent = this.rotationHistory.slice(-this.varietyRules.difficultyVariation.maxConsecutiveSame);
    const difficulties = ['very-easy', 'easy', 'medium', 'hard', 'expert'];
    
    const grouped = {};
    difficulties.forEach(d => { grouped[d] = 0; });
    recent.forEach(h => {
      if (grouped[h.difficulty] !== undefined) {
        grouped[h.difficulty]++;
      }
    });
    
    const overused = Object.entries(grouped)
      .filter(([, count]) => count >= this.varietyRules.difficultyVariation.maxConsecutiveSame)
      .map(([d]) => d);
    
    const available = difficulties.filter(d => !overused.includes(d));
    const pool = available.length > 0 ? available : difficulties;
    
    return pool[Math.floor(Math.random() * pool.length)];
  },
  
  getNextTheme() {
    const themes = this.varietyRules.themeVariation.themes;
    const recent = this.rotationHistory.slice(-3).map(h => h.theme).filter(Boolean);
    
    const available = themes.filter(t => !recent.includes(t));
    const pool = available.length > 0 ? available : themes;
    
    return pool[Math.floor(Math.random() * pool.length)];
  },
  
  generateVarietyReport() {
    const shapes = {};
    const templates = {};
    const difficulties = {};
    const themes = {};
    
    this.rotationHistory.forEach(h => {
      if (h.shape) shapes[h.shape] = (shapes[h.shape] || 0) + 1;
      if (h.template) templates[h.template] = (templates[h.template] || 0) + 1;
      if (h.difficulty) difficulties[h.difficulty] = (difficulties[h.difficulty] || 0) + 1;
      if (h.theme) themes[h.theme] = (themes[h.theme] || 0) + 1;
    });
    
    return {
      totalPuzzles: this.rotationHistory.length,
      shapeDistribution: shapes,
      templateDistribution: templates,
      difficultyDistribution: difficulties,
      themeDistribution: themes,
      recommendations: this.generateVarietyRecommendations(shapes, templates, difficulties, themes)
    };
  },
  
  generateVarietyRecommendations(shapes, templates, difficulties, themes) {
    const recs = [];
    
    const shapeVals = Object.values(shapes);
    if (shapeVals.length > 0) {
      const maxShape = Math.max(...shapeVals);
      const maxShapeName = Object.entries(shapes).find(([, v]) => v === maxShape)?.[0];
      if (maxShape / shapeVals.reduce((a, b) => a + b, 1) > 0.4) {
        recs.push(`Shape "${maxShapeName}" is overused (${maxShape} times). Consider diversifying.`);
      }
    }
    
    const templateVals = Object.values(templates);
    if (templateVals.length > 0) {
      const maxTemplate = Math.max(...templateVals);
      const maxTemplateName = Object.entries(templates).find(([, v]) => v === maxTemplate)?.[0];
      if (maxTemplate / templateVals.reduce((a, b) => a + b, 1) > 0.4) {
        recs.push(`Template "${maxTemplateName}" appears too frequently. Try varying colors more.`);
      }
    }
    
    if (Object.keys(difficulties).length < 3) {
      recs.push('Limited difficulty variety - consider adding more diverse challenge levels.');
    }
    
    return recs;
  },
  
  exportVarietyRules() {
    return {
      rules: this.varietyRules,
      history: this.rotationHistory,
      exportDate: new Date().toISOString()
    };
  },
  
  importVarietyRules(data) {
    if (data.rules) this.varietyRules = { ...this.varietyRules, ...data.rules };
    if (data.history) this.rotationHistory = data.history;
  }
};

// ============ BOOK UNIQUENESS CONTROLLER (MXD W10) ============
window.MXD_BookUniquenessController = {
  uniqueTemplates: [],
  usedPatterns: new Set(),
  usedThemes: new Set(),
  usedShapes: new Set(),
  
  resetForNewBook() {
    this.uniqueTemplates = [];
    this.usedPatterns.clear();
    this.usedThemes.clear();
    this.usedShapes.clear();
  },
  
  generateUniquePuzzleId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `puz_${timestamp}_${random}`;
  },
  
  registerPuzzle(puzzle) {
    const id = this.generateUniquePuzzleId();
    this.uniqueTemplates.push({
      id,
      timestamp: Date.now(),
      wordCount: Object.keys(puzzle.placements || {}).length,
      gridSize: puzzle.grid ? `${puzzle.grid.length}x${puzzle.grid[0].length}` : 'unknown',
      shape: puzzle.shape || 'unknown'
    });
    
    if (puzzle.placements) {
      const patternKey = this.extractPattern(puzzle.placements);
      this.usedPatterns.add(patternKey);
    }
    
    return id;
  },
  
  extractPattern(placements) {
    const words = Object.keys(placements).sort().join('|');
    return words.substring(0, 100);
  },
  
  isDuplicate(placements) {
    const pattern = this.extractPattern(placements);
    return this.usedPatterns.has(pattern);
  },
  
  getUniquenessScore() {
    const total = this.uniqueTemplates.length;
    if (total === 0) return 100;
    
    const uniqueCount = new Set(this.uniqueTemplates.map(t => t.id)).size;
    return (uniqueCount / total) * 100;
  },
  
  analyzeUniqueness(bookPuzzles) {
    const analysis = {
      totalPuzzles: bookPuzzles.length,
      uniquePatterns: 0,
      duplicatePatterns: 0,
      averageUniqueness: 0,
      uniquenessDistribution: { high: 0, medium: 0, low: 0 },
      recommendations: []
    };
    
    const patterns = {};
    bookPuzzles.forEach(puzzle => {
      const pattern = this.extractPattern(puzzle.placements || {});
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });
    
    analysis.uniquePatterns = Object.keys(patterns).length;
    analysis.duplicatePatterns = bookPuzzles.length - analysis.uniquePatterns;
    
    Object.values(patterns).forEach(count => {
      if (count === 1) analysis.uniquenessDistribution.high++;
      else if (count <= 2) analysis.uniquenessDistribution.medium++;
      else analysis.uniquenessDistribution.low++;
    });
    
    if (analysis.duplicatePatterns > bookPuzzles.length * 0.2) {
      analysis.recommendations.push('Too many similar puzzles - consider varying word lists or shapes');
    }
    
    if (analysis.uniquenessDistribution.low > bookPuzzles.length * 0.3) {
      analysis.recommendations.push('Multiple puzzles have similar patterns - add unique word combinations');
    }
    
    analysis.averageUniqueness = (analysis.uniquePatterns / bookPuzzles.length) * 100;
    
    return analysis;
  },
  
  suggestVariations(basePuzzle, count = 5) {
    const variations = [];
    const baseWords = Object.keys(basePuzzle.placements || {});
    
    for (let i = 0; i < count; i++) {
      const shuffled = [...baseWords].sort(() => Math.random() - 0.5);
      const countVariation = Math.floor(Math.random() * 3) - 1;
      const selected = shuffled.slice(0, Math.max(5, baseWords.length + countVariation));
      
      variations.push({
        type: 'wordVariation',
        words: selected,
        variationIndex: i + 1
      });
    }
    
    return variations;
  },
  
  generateUniquenessReport() {
    const total = this.uniqueTemplates.length;
    const uniquePatterns = this.usedPatterns.size;
    
    return {
      totalPuzzles: total,
      uniquePatterns: uniquePatterns,
      duplicationRate: total > 0 ? ((total - uniquePatterns) / total * 100).toFixed(1) : 0,
      templates: this.uniqueTemplates,
      recommendations: uniquePatterns < total * 0.8 
        ? 'Consider adding more unique word combinations to increase puzzle variety'
        : 'Good puzzle variety detected'
    };
  },
  
  exportUniquenessData() {
    return {
      patterns: Array.from(this.usedPatterns),
      templates: this.uniqueTemplates,
      exportDate: new Date().toISOString()
    };
  },
  
  importUniquenessData(data) {
    if (data.patterns) {
      data.patterns.forEach(p => this.usedPatterns.add(p));
    }
    if (data.templates) {
      this.uniqueTemplates.push(...data.templates);
    }
  }
};

// ============ GRID BALANCE OPTIMIZER (MXD W6) ============
window.MXD_GridBalanceOptimizer = {
  analyzeGridBalance(placements, rows, cols) {
    const quadrants = this.getQuadrantUsage(placements, rows, cols);
    const balance = this.calculateBalanceScore(quadrants);
    const hotspots = this.findHotspots(placements, rows, cols);
    const gaps = this.findGaps(placements, rows, cols);
    
    return {
      quadrants,
      balanceScore: balance,
      hotspots,
      gaps,
      overallBalance: this.getBalanceGrade(balance)
    };
  },
  
  getQuadrantUsage(placements, rows, cols) {
    const q1 = { cells: 0, words: 0 };
    const q2 = { cells: 0, words: 0 };
    const q3 = { cells: 0, words: 0 };
    const q4 = { cells: 0, words: 0 };
    
    const midR = rows / 2;
    const midC = cols / 2;
    
    Object.values(placements).forEach(cells => {
      cells.forEach(([r, c]) => {
        const quadrant = r < midR ? (c < midC ? q1 : q2) : (c < midC ? q3 : q4);
        quadrant.cells++;
      });
    });
    
    Object.keys(placements).forEach(word => {
      const cells = placements[word];
      const r = cells[0][0];
      const c = cells[0][1];
      const quadrant = r < midR ? (c < midC ? q1 : q2) : (c < midC ? q3 : q4);
      quadrant.words++;
    });
    
    return { q1, q2, q3, q4 };
  },
  
  calculateBalanceScore(quadrants) {
    const counts = [quadrants.q1.cells, quadrants.q2.cells, quadrants.q3.cells, quadrants.q4.cells];
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    
    const avg = total / 4;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / 4;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg;
    
    return Math.max(0, Math.min(100, 100 - (cv * 100)));
  },
  
  findHotspots(placements, rows, cols) {
    const cellDensity = {};
    Object.values(placements).forEach(cells => {
      cells.forEach(([r, c]) => {
        const key = `${Math.floor(r / 3)}-${Math.floor(c / 3)}`;
        cellDensity[key] = (cellDensity[key] || 0) + 1;
      });
    });
    
    return Object.entries(cellDensity)
      .filter(([, count]) => count > 3)
      .map(([key, count]) => {
        const [gr, gc] = key.split('-').map(Number);
        return {
          region: key,
          density: count,
          gridRow: gr,
          gridCol: gc
        };
      })
      .sort((a, b) => b.density - a.density);
  },
  
  findGaps(placements, rows, cols) {
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    Object.values(placements).forEach(cells => {
      cells.forEach(([r, c]) => { grid[r][c] = 1; });
    });
    
    const gaps = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 0) {
          const neighbors = this.countNeighbors(grid, r, c, rows, cols);
          if (neighbors >= 3) {
            gaps.push({ row: r, col: c, emptyNeighbors: neighbors });
          }
        }
      }
    }
    
    return gaps;
  },
  
  countNeighbors(grid, r, c, rows, cols) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          count++;
        }
      }
    }
    return count;
  },
  
  getBalanceGrade(score) {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  },
  
  optimizeWordPlacement(placements, rows, cols, word, targetQuadrant) {
    const midR = rows / 2;
    const midC = cols / 2;
    
    const quadrantBounds = {
      q1: { rMin: 0, rMax: midR, cMin: 0, cMax: midC },
      q2: { rMin: 0, rMax: midR, cMin: midC, cMax: cols },
      q3: { rMin: midR, rMax: rows, cMin: 0, cMax: midC },
      q4: { rMin: midR, rMax: rows, cMin: midC, cMax: cols }
    };
    
    const bounds = quadrantBounds[targetQuadrant];
    const candidates = [];
    
    for (let r = Math.floor(bounds.rMin); r < Math.floor(bounds.rMax); r++) {
      for (let c = Math.floor(bounds.cMin); c < Math.floor(bounds.cMax); c++) {
        candidates.push([r, c]);
      }
    }
    
    return candidates.sort(() => Math.random() - 0.5);
  },
  
  rebalancePlacements(placements, rows, cols) {
    const analysis = this.analyzeGridBalance(placements, rows, cols);
    if (analysis.balanceScore >= 70) return placements;
    
    const sorted = Object.entries(placements)
      .map(([word, cells]) => ({ word, cells, center: this.getWordCenter(cells) }))
      .sort((a, b) => {
        const midR = rows / 2, midC = cols / 2;
        const distA = Math.abs(a.center.r - midR) + Math.abs(a.center.c - midC);
        const distB = Math.abs(b.center.r - midR) + Math.abs(b.center.c - midC);
        return distA - distB;
      });
    
    const newPlacements = {};
    const usedCells = new Set();
    
    const quadrantOrder = ['q1', 'q2', 'q3', 'q4'];
    const quadrantCounts = [0, 0, 0, 0];
    
    sorted.forEach(item => {
      const minQ = quadrantOrder[quadrantCounts.indexOf(Math.min(...quadrantCounts))];
      newPlacements[item.word] = item.cells;
      
      const center = item.center;
      const midR = rows / 2, midC = cols / 2;
      let qIndex = 0;
      if (center.r >= midR && center.c >= midC) qIndex = 3;
      else if (center.r >= midR && center.c < midC) qIndex = 2;
      else if (center.r < midR && center.c >= midC) qIndex = 1;
      
      quadrantCounts[qIndex]++;
    });
    
    return newPlacements;
  },
  
  getWordCenter(cells) {
    const sumR = cells.reduce((s, [r]) => s + r, 0);
    const sumC = cells.reduce((s, [, c]) => s + c, 0);
    return { r: sumR / cells.length, c: sumC / cells.length };
  },
  
  generateBalanceReport(placements, rows, cols) {
    const analysis = this.analyzeGridBalance(placements, rows, cols);
    
    const report = {
      summary: `Grid balance score: ${analysis.balanceScore.toFixed(1)}/100 (Grade: ${analysis.overallBalance})`,
      quadrants: [
        `Q1 (top-left): ${analysis.quadrants.q1.cells} cells, ${analysis.quadrants.q1.words} words`,
        `Q2 (top-right): ${analysis.quadrants.q2.cells} cells, ${analysis.quadrants.q2.words} words`,
        `Q3 (bottom-left): ${analysis.quadrants.q3.cells} cells, ${analysis.quadrants.q3.words} words`,
        `Q4 (bottom-right): ${analysis.quadrants.q4.cells} cells, ${analysis.quadrants.q4.words} words`
      ],
      hotspots: analysis.hotspots.length > 0 
        ? `Found ${analysis.hotspots.length} high-density regions that may need spreading`
        : 'No significant hotspots detected',
      gaps: analysis.gaps.length > 0
        ? `Found ${analysis.gaps.length} isolated empty cells that may affect playability`
        : 'Grid density is well distributed'
    };
    
    return report;
  }
};

// ============ WORD LIST ANALYZER (MXD W3) ============
window.MXD_WordAnalyzer = {
  analyzeWordList(words, settings = {}) {
    const normalized = words.map(w => w.toUpperCase().trim()).filter(w => w.length >= 2);
    const unique = [...new Set(normalized)];
    
    const analysis = {
      total: normalized.length,
      unique: unique.length,
      duplicates: normalized.length - unique.length,
      averageLength: 0,
      lengthDistribution: { short: 0, medium: 0, long: 0 },
      wordHealthScore: 100,
      issues: [],
      warnings: [],
      themeHints: [],
      profanityRisk: [],
      trademarkRisk: [],
      suggestions: []
    };
    
    if (normalized.length === 0) {
      analysis.issues.push({ type: 'empty', message: 'No valid words provided' });
      return analysis;
    }
    
    const totalLength = unique.reduce((sum, w) => sum + w.length, 0);
    analysis.averageLength = (totalLength / unique.length).toFixed(1);
    
    unique.forEach(w => {
      if (w.length <= 4) analysis.lengthDistribution.short++;
      else if (w.length <= 8) analysis.lengthDistribution.medium++;
      else analysis.lengthDistribution.long++;
    });
    
    const nearDuplicates = this.findNearDuplicates(unique);
    if (nearDuplicates.length > 0) {
      analysis.issues.push({
        type: 'near-duplicates',
        message: `${nearDuplicates.length} word pairs are very similar`,
        pairs: nearDuplicates.slice(0, 5)
      });
      analysis.wordHealthScore -= nearDuplicates.length * 3;
    }
    
    const tooLong = unique.filter(w => w.length > 15);
    if (tooLong.length > 0) {
      analysis.warnings.push({
        type: 'long-words',
        message: `${tooLong.length} words may be too difficult`,
        words: tooLong.slice(0, 5)
      });
      analysis.wordHealthScore -= 5;
    }
    
    const tooShort = unique.filter(w => w.length < 3);
    if (tooShort.length > unique.length * 0.3) {
      analysis.warnings.push({
        type: 'many-short-words',
        message: 'More than 30% of words are very short (3 letters or less)'
      });
      analysis.wordHealthScore -= 10;
    }
    
    const themeHint = this.detectTheme(unique);
    if (themeHint) {
      analysis.themeHints.push(themeHint);
    }
    
    analysis.wordHealthScore = Math.max(0, Math.min(100, analysis.wordHealthScore));
    
    return analysis;
  },
  
  findNearDuplicates(words) {
    const pairs = [];
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        if (this.areSimilar(words[i], words[j])) {
          pairs.push([words[i], words[j]]);
        }
      }
    }
    return pairs;
  },
  
  areSimilar(w1, w2) {
    if (Math.abs(w1.length - w2.length) > 2) return false;
    const maxLen = Math.max(w1.length, w2.length);
    let diff = 0;
    for (let i = 0; i < Math.min(w1.length, w2.length); i++) {
      if (w1[i] !== w2[i]) diff++;
    }
    return diff <= 2 && diff / maxLen < 0.3;
  },
  
  detectTheme(words) {
    const themeKeywords = {
      animals: ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'BEAR', 'WOLF', 'DEER', 'ELEPHANT', 'MONKEY'],
      nature: ['TREE', 'FLOWER', 'SUN', 'MOON', 'STAR', 'WIND', 'RAIN', 'RIVER', 'LAKE', 'MOUNTAIN'],
      food: ['APPLE', 'BANANA', 'ORANGE', 'BREAD', 'CAKE', 'PIZZA', 'PASTA', 'SALAD', 'SOUP', 'MEAT'],
      sports: ['BALL', 'TEAM', 'GAME', 'PLAY', 'SCORE', 'WIN', 'RACE', 'SWIM', 'RUN', 'JUMP'],
      science: ['ATOM', 'CELL', 'GENE', 'PLANT', 'WATER', 'LIGHT', 'SOUND', 'ENERGY', 'FORCE', 'MOTION'],
      colors: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'PINK', 'BROWN']
    };
    
    const scores = {};
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      scores[theme] = words.filter(w => keywords.some(k => w.includes(k) || k.includes(w))).length;
    }
    
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 3) {
      return { theme: best[0], confidence: Math.min(best[1] / words.length, 1), matches: best[1] };
    }
    return null;
  }
};

// ============ PRINT QUALITY ANALYZER (MXD W4) ============
window.MXD_PrintQualityAnalyzer = {
  analyzePrintability(grid, settings) {
    const analysis = {
      dpi: settings.dpi || 400,
      bleed: settings.bleed || false,
      margins: settings.margins || { top: 36, right: 36, bottom: 36, left: 36 },
      safeArea: settings.safeArea !== false,
      issues: [],
      score: 100,
      grade: 'A',
      recommendations: []
    };
    
    const rows = grid.length;
    const cols = grid[0].length;
    const cellSize = settings.cellSize || 30;
    
    if (cellSize < 18) {
      analysis.issues.push({ severity: 'high', message: 'Cell size too small for comfortable reading' });
      analysis.score -= 20;
    }
    
    if (cellSize > 45) {
      analysis.issues.push({ severity: 'medium', message: 'Large cell size may cause grid to span multiple pages' });
      analysis.score -= 10;
    }
    
    const totalWidth = cols * cellSize;
    const totalHeight = rows * cellSize;
    const pageWidth = 612;
    const pageHeight = 792;
    const marginTotal = analysis.margins.left + analysis.margins.right;
    const heightMarginTotal = analysis.margins.top + analysis.margins.bottom;
    
    if (totalWidth > pageWidth - marginTotal) {
      analysis.issues.push({ severity: 'high', message: 'Grid width exceeds printable area' });
      analysis.score -= 25;
    }
    
    if (totalHeight > pageHeight - heightMarginTotal - 150) {
      analysis.issues.push({ severity: 'high', message: 'Grid height too large for page with word list' });
      analysis.score -= 25;
    }
    
    if (settings.dpi && settings.dpi < 300) {
      analysis.issues.push({ severity: 'medium', message: 'Low DPI may result in blurry text when printed' });
      analysis.score -= 15;
    }
    
    if (analysis.safeArea && (totalWidth > pageWidth - marginTotal - 18 || totalHeight > pageHeight - heightMarginTotal - 150 - 18)) {
      analysis.recommendations.push('Content too close to edges - consider reducing grid size or margins');
    }
    
    analysis.score = Math.max(0, Math.min(100, analysis.score));
    analysis.grade = this.getGrade(analysis.score);
    
    return analysis;
  },
  
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },
  
  validateKdpCompliance(settings) {
    const compliance = {
      isCompliant: true,
      issues: [],
      warnings: [],
      trimSizes: ['8.5x11', '7x10', '6x9', '5.5x8.5', '5x8'],
      recommendedBleed: 0.125,
      minimumMargins: 0.375
    };
    
    const trimSize = settings.trimSize || '8.5x11';
    const [width, height] = trimSize.split('x').map(Number);
    
    if (!width || !height) {
      compliance.isCompliant = false;
      compliance.issues.push('Invalid trim size format');
    }
    
    const margins = settings.margins || {};
    const minMargin = 0.375;
    
    if ((margins.top || 36) / 72 < minMargin) {
      compliance.issues.push('Top margin below KDP minimum (0.375")');
      compliance.isCompliant = false;
    }
    if ((margins.bottom || 36) / 72 < minMargin) {
      compliance.issues.push('Bottom margin below KDP minimum (0.375")');
      compliance.isCompliant = false;
    }
    if ((margins.left || 36) / 72 < minMargin) {
      compliance.issues.push('Left margin below KDP minimum (0.375")');
      compliance.isCompliant = false;
    }
    if ((margins.right || 36) / 72 < minMargin) {
      compliance.issues.push('Right margin below KDP minimum (0.375")');
      compliance.isCompliant = false;
    }
    
    if (settings.bleed) {
      if (!settings.includeCropMarks) {
        compliance.warnings.push('Bleed enabled but crop marks not included');
      }
    }
    
    return compliance;
  },
  
  suggestOptimizations(grid, settings) {
    const suggestions = [];
    const rows = grid.length;
    const cols = grid[0].length;
    
    if (rows > 20 || cols > 20) {
      suggestions.push({
        type: 'size',
        priority: 'high',
        message: 'Grid is large - consider reducing to 15x15 or 18x18 for better print quality'
      });
    }
    
    if (settings.dpi && settings.dpi < 400) {
      suggestions.push({
        type: 'dpi',
        priority: 'medium',
        message: `Current DPI (${settings.dpi}) may produce softer text. Consider 400 or 500 DPI for crisp output.`
      });
    }
    
    const cellSize = settings.cellSize || 30;
    if (cellSize < 20) {
      suggestions.push({
        type: 'cellSize',
        priority: 'high',
        message: `Cell size (${cellSize}pt) may be difficult to read when printed. Minimum 24pt recommended.`
      });
    }
    
    if (rows > 15 && cols > 15) {
      suggestions.push({
        type: 'layout',
        priority: 'medium',
        message: 'Large grid with word list may require tighter margins or smaller font for word list'
      });
    }
    
    return suggestions;
  },
  
  generatePrintReport(grid, settings) {
    const analysis = this.analyzePrintability(grid, settings);
    const compliance = this.validateKdpCompliance(settings);
    const suggestions = this.suggestOptimizations(grid, settings);
    
    return {
      analysis,
      compliance,
      suggestions,
      summary: this.generateSummary(analysis, compliance, suggestions)
    };
  },
  
  generateSummary(analysis, compliance, suggestions) {
    const lines = [];
    
    lines.push(`Print Quality Score: ${analysis.score}/100 (Grade: ${analysis.grade})`);
    
    if (analysis.issues.length > 0) {
      lines.push(`Issues found: ${analysis.issues.length}`);
    }
    
    if (compliance.isCompliant) {
      lines.push('KDP Compliance: PASSED');
    } else {
      lines.push(`KDP Compliance: FAILED - ${compliance.issues.length} issues`);
    }
    
    if (suggestions.length > 0) {
      lines.push(`Suggestions: ${suggestions.length} optimizations available`);
    }
    
    return lines.join('\n');
  },
  
  exportPrintSettings(settings) {
    return {
      ...settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  },
  
  importPrintSettings(data) {
    return { ...data };
  }
};

// ============ ACCIDENTAL WORD DETECTOR (MXD W8) ============
window.MXD_AccidentalWordDetector = {
  forbiddenPatterns: ['FUCK', 'SHIT', 'ASS', 'DICK', 'PISS', 'CUNT', 'WANK', 'FART', 'POOP', 'DAMN', 'HELL', 'SUCK'],
  sensitivePatterns: ['KILL', 'DIE', 'DEAD', 'BOMB', 'GUN', 'DRUG', 'SEX', 'NAZI', 'KKK', 'TERROR'],
  
  scanGrid(grid, placedWords, sensitivity = 'medium') {
    const results = {
      accidentalWords: [],
      warnings: [],
      riskScore: 0
    };
    
    const allLines = this.extractAllLines(grid);
    const placedSet = new Set(placedWords);
    
    const minLength = sensitivity === 'high' ? 3 : sensitivity === 'medium' ? 4 : 5;
    
    allLines.forEach(line => {
      if (line.length < minLength) return;
      
      for (let i = minLength; i <= line.length; i++) {
        for (let j = 0; j <= line.length - i; j++) {
          const word = line.slice(j, j + i);
          const reversed = word.split('').reverse().join('');
          
          if (!placedSet.has(word) && !placedSet.has(reversed)) {
            if (this.isForbidden(word)) {
              results.accidentalWords.push({
                word,
                position: j,
                line,
                severity: 'critical',
                suggestion: 'Replace with different filler letters'
              });
              results.riskScore += 20;
            } else if (this.isSensitive(word) && sensitivity !== 'low') {
              results.warnings.push({
                word,
                position: j,
                line,
                severity: 'warning',
                suggestion: 'May want to change for target audience'
              });
              results.riskScore += 10;
            }
          }
        }
      }
    });
    
    results.riskScore = Math.min(100, results.riskScore);
    return results;
  },
  
  extractAllLines(grid) {
    const lines = [];
    const rows = grid.length;
    const cols = grid[0].length;
    
    for (let r = 0; r < rows; r++) {
      lines.push(grid[r].join(''));
    }
    
    for (let c = 0; c < cols; c++) {
      let line = '';
      for (let r = 0; r < rows; r++) {
        line += grid[r][c];
      }
      lines.push(line);
    }
    
    return lines;
  },
  
  isForbidden(word) {
    return this.forbiddenPatterns.some(p => 
      word.includes(p) || word.split('').reverse().join('').includes(p)
    );
  },
  
  isSensitive(word) {
    return this.sensitivePatterns.some(p => 
      word.includes(p) || word.split('').reverse().join('').includes(p)
    );
  }
};

// ============ FILLER LETTER INTELLIGENCE (MXD W7) ============
window.MXD_FillerIntelligence = {
  modes: {
    random: (rng) => String.fromCharCode(65 + Math.floor(rng() * 26)),
    
    frequencyBalanced: (rng, grid, r, c) => {
      const commonLetters = 'ETAOINSHRDLCUMWFGYPBVKJXQZ';
      const rareLetters = 'JXQZVKWBGYPMUCLDFHRNSIOTEA';
      if (rng() < 0.7) {
        return commonLetters[Math.floor(rng() * 12)];
      }
      return rareLetters[Math.floor(rng() * Math.min(8, rareLetters.length))];
    },
    
    themeAware: (rng, placedWords) => {
      const letters = placedWords.join('').split('').filter((c, i, arr) => arr.indexOf(c) === i);
      if (letters.length > 0 && rng() < 0.4) {
        return letters[Math.floor(rng() * letters.length)];
      }
      return String.fromCharCode(65 + Math.floor(rng() * 26));
    },
    
    antiDecoy: (rng, grid, r, c, rows, cols) => {
      const directions = [[0,1],[1,0],[1,1],[1,-1],[-1,0],[-1,1],[0,-1],[-1,-1]];
      let decoyRisk = 0;
      
      directions.forEach(([dr, dc]) => {
        let word = grid[r][c];
        for (let i = 1; i <= 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc]) {
            word += grid[nr][nc];
          }
        }
        if (this.isWordFragment(word)) decoyRisk++;
      });
      
      if (decoyRisk > 2) {
        const safeLetters = 'BCDFGHJKLMNPQRSTVWXYZ';
        return safeLetters[Math.floor(rng() * safeLetters.length)];
      }
      return String.fromCharCode(65 + Math.floor(rng() * 26));
    },
    
    kidFriendly: (rng) => {
      const kidLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      return kidLetters[Math.floor(rng() * kidLetters.length)];
    },
    
    hardMode: (rng, grid, r, c, rows, cols) => {
      const commonLetters = 'ETAOINSRHLDCUMFPGWYBVKXJQZ';
      return commonLetters[Math.floor(rng() * 10)];
    }
  },
  
  commonWords: new Set([
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HAD',
    'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS',
    'HOW', 'ITS', 'LET', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'WAY', 'WHO',
    'BOY', 'DID', 'GOT', 'MAN', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'ACT',
    'BAD', 'BIG', 'BIT', 'CAR', 'DOG', 'EAT', 'FAR', 'FAT', 'FIT', 'FLY',
    'FUN', 'GOD', 'HAT', 'HOT', 'ICE', 'INK', 'JAM', 'JET', 'JOY', 'KEY'
  ]),
  
  isWordFragment(str) {
    if (str.length < 3) return false;
    for (const word of this.commonWords) {
      if (str.includes(word) || str.split('').reverse().join('').includes(word)) {
        return true;
      }
    }
    return false;
  },
  
  getFiller(mode, rng, grid, r, c, placedWords) {
    const rows = grid.length;
    const cols = grid[0].length;
    const fillerFn = this.modes[mode] || this.modes.random;
    return fillerFn(rng, grid, r, c, rows, cols, placedWords);
  }
};

// ============ SETTINGS MODULE ============
(function(){
  const STORAGE_KEY = 'mxd:settings';
  const SCHEMA_VERSION = 6;

  const DEFAULT_CFG = {
    rows:15, cols:15, shape:'square',
    allowDiag:true, allowReverse:true, allowH:true, allowV:true,
    letterCase:'upper', fontWeight:'bold',
    showWordList:true, showPageNum:false, pageNum:1,
    wordFontSize:14, wordsPerGrid:8, wordColumns:4, cellSize:30,
    title:'Word Search Puzzle',
    highlightColor:'#c9a227', solutionStyle:'highlight',
    template:'classic', bulkMode:false, bulkPageCount:5,
    showChecks:false, playMode:true, shuffleOnGen:false, autoRegen:false,
    forceGridLines:false, cellBorders:false, quality:'high',
    
    // MXD Hyper Roadmap v6.0 - Quality Tiers
    qualityTier: 'balanced',
    
    // MXD Hyper Roadmap v6.0 - Difficulty Settings
    difficultyPreset: 'medium',
    difficultySettings: {
      overallDifficulty: 5,
      wordCountMin: 8,
      wordCountMax: 15,
      wordLengthMin: 4,
      wordLengthMax: 10,
      horizontalForward: true,
      horizontalBackward: true,
      verticalForward: true,
      verticalBackward: true,
      diagonalForward: true,
      diagonalBackward: true,
      allowOverlap: true,
      maxOverlapPerWord: 3,
      fillerComplexity: 'medium',
      accidentalWordSensitivity: 'medium',
      edgeBias: 'balanced',
      clusterWords: true,
      largePrint: false,
      highContrast: false,
      lowClutter: false
    },
    
    // Audience Settings
    audienceTarget: 'adults',
    audienceSettings: {
      largePrint: false,
      extraLargeGrid: false,
      highContrast: false,
      dyslexiaFriendly: false,
      beginnerFriendly: false,
      memoryCareFriendly: false,
      lowClutter: false,
      stressFreeMode: false
    },
    
    // Word Rules
    wordRules: {
      minWordLength: 3,
      maxWordLength: 15,
      uppercase: true,
      removeDuplicates: true,
      trimWhitespace: true,
      rejectNumbersOnly: true
    },
    
    // Fill Strategy
    fillStrategy: 'random',
    
    // KDP Print Settings
    kdpSettings: {
      trimSize: '8.5x11',
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
      bleed: false,
      safeArea: true,
      includeCropMarks: false,
      includeBleedMarks: false
    },
    
    // Readability Guard
    readabilityGuard: {
      enabled: true,
      minFontSize: 10,
      minContrastRatio: 4.5,
      maxWordsPerPage: 30
    },
    
    mxdTools: {}, 
    mxdExport: { 
      includeSolutions: true, 
      includeTOC: false, 
      includeExtras: false,
      exportFormat: 'pdf',
      dpi: 400
    },
    mxdGen: { overlapPolicy: 'matchOnly', seed: '' },
    mxdFlags: {},
    mxdBranding: { show:true, opacity:0.12, colorM:'#fbbf24', colorX:'#e5e7eb', colorXStroke:'#111827', colorD:'#dc2626', dragonBody:'#dc2626', dragonWing:'#fbbf24', dragonWingOpacity:0.92, dragonEye:'#111827', dragonPupil:'#fef08a', dragonSnout:'#111827', dragonTailFill:'#b91c1c', dragonTailStroke:'#7f1d1d', dragonAnim:'system', animDuration:22 },
    mxdUi: { compactSidebar:false, reducedMotion:'system' },
  };

  function isPlainObject(x){ return !!x && typeof x === 'object' && !Array.isArray(x); }
  function deepMerge(base, patch){
    const out = Array.isArray(base) ? base.slice() : { ...base };
    if(!isPlainObject(patch)) return out;
    for(const [k,v] of Object.entries(patch)){
      if(isPlainObject(v) && isPlainObject(out[k])) out[k] = deepMerge(out[k], v);
      else out[k] = v;
    }
    return out;
  }

  function load(){
    const raw = localStorage.getItem(STORAGE_KEY);
    try {
      const doc = JSON.parse(raw);
      if(doc && doc.cfg) return deepMerge(DEFAULT_CFG, doc.cfg);
    } catch(e) {}
    return { ...DEFAULT_CFG };
  }

  function save(cfg){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, cfg })); } catch(e) {}
  }

  const panels = [], tools = [];
  function registerPanel(p){ panels.push(p); panels.sort((a,b)=>(a.order??999)-(b.order??999)); }
  function registerTool(t){ tools.push(t); tools.sort((a,b)=>(a.order??999)-(b.order??999)); }
  function getPanels(){ return panels.slice(); }
  function getTools(){ return tools.slice(); }

  window.MXD = window.MXD || {};
  window.MXD.Settings = { SCHEMA_VERSION, DEFAULT_CFG, load, save };
  window.MXD.SettingsRegistry = { registerPanel, registerTool, getPanels, getTools };

  registerTool({ id:'wordsearch', label:'Word Search Generator', icon:'🔤', defaultEnabled:true, order:1 });
})();

// ============ ENGINE MODULE (Enhanced with MXD Hyper Roadmap v6.0) ============
window.WordSearchEngine = {
  VERSION: '6.0.0',
  DIRS:[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]],
  
  // Enhanced Empty Grid
  empty(R,C){return Array.from({length:R},()=>Array(C).fill(''))},

  // MXD Hyper Roadmap - Enhanced Generation with Quality & Diagnostics
  generateEnhanced(cfg) {
    const startTime = performance.now();
    const {
      rows = 15, cols = 15, words = [], shape = 'square',
      difficultySettings = {}, qualityTier = 'balanced'
    } = cfg;
    
    // Get quality tier settings
    const tier = window.MXD_QUALITY_TIERS[qualityTier] || window.MXD_QUALITY_TIERS.balanced;
    const maxAttempts = tier.maxRetries || 3;
    
    // Get difficulty settings
    const diff = {
      ...window.MXD_DIFFICULTY_PRESETS.medium,
      ...difficultySettings
    };
    
    // Extract directions based on difficulty
    const directions = [];
    if (diff.horizontalForward) directions.push([0, 1]);
    if (diff.verticalForward) directions.push([1, 0]);
    if (diff.horizontalBackward) directions.push([0, -1]);
    if (diff.verticalBackward) directions.push([-1, 0]);
    if (diff.diagonalForward || diff.allowDiag) {
      directions.push([1, 1], [1, -1]);
    }
    if (diff.diagonalBackward) {
      directions.push([-1, 1], [-1, -1]);
    }
    
    let lastError = null;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const grid = this.empty(rows, cols);
      const mask = this.mask(rows, cols, shape);
      const placements = {};
      let success = true;
      
      const sortedWords = [...words].sort((a, b) => b.length - a.length);
      
      for (const word of sortedWords) {
        const uw = cfg.letterCase === 'lower' ? word.toLowerCase() : word.toUpperCase();
        const cells = this.placeEnhanced(grid, mask, uw, {
          directions,
          overlapPolicy: diff.allowOverlap ? 'matchOnly' : 'none',
          maxOverlap: diff.maxOverlapPerWord || 3,
          rng: Math.random
        });
        
        if (cells) {
          placements[word] = cells;
        } else {
          success = false;
          lastError = `Could not place word: ${word}`;
        }
      }
      
      if (success) {
        // Fill with intelligent filler
        const fillerMode = diff.fillerComplexity || 'medium';
        this.fillEnhanced(grid, mask, cfg.letterCase, fillerMode, placements);
        
        // Clean up mask cells
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (!mask[r][c]) grid[r][c] = '';
          }
        }
        
        const generationTimeMs = performance.now() - startTime;
        
        // Calculate quality scores
        const puzzle = { grid, mask, placements };
        const qualityScore = window.MXD_QualityScorer ? 
          window.MXD_QualityScorer.analyzePuzzle(puzzle, diff) : null;
        
        // Check for accidental words
        const accidentalCheck = window.MXD_AccidentalWordDetector ?
          window.MXD_AccidentalWordDetector.scanGrid(grid, Object.keys(placements), diff.accidentalWordSensitivity) : null;
        
        return {
          puzzle,
          diagnostics: {
            generationTimeMs: Math.round(generationTimeMs * 100) / 100,
            attemptsUsed: attempt + 1,
            fitScore: qualityScore ? qualityScore.overall : 80,
            difficultyScore: diff.overallDifficulty * 10 || 50,
            readabilityScore: qualityScore ? qualityScore.breakdown?.readability : 80,
            qualityScore: qualityScore ? qualityScore.overall : 80,
            warnings: [
              ...(qualityScore?.warnings || []),
              ...(accidentalCheck?.warnings || [])
            ],
            repairsApplied: []
          },
          success: true,
          type: 'wordsearch'
        };
      }
    }
    
    // Return best partial result if full success not achieved
    return {
      puzzle: null,
      diagnostics: {
        generationTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
        attemptsUsed: maxAttempts,
        fitScore: 0,
        difficultyScore: diff.overallDifficulty * 10 || 50,
        readabilityScore: 0,
        qualityScore: 0,
        warnings: [{ severity: 'high', message: lastError || 'Failed to generate puzzle' }],
        repairsApplied: []
      },
      success: false,
      type: 'wordsearch'
    };
  },

  // Enhanced word placement with direction control
  placeEnhanced(grid, mask, word, opts) {
    const { directions, overlapPolicy, maxOverlap, rng } = opts;
    const R = grid.length, C = grid[0].length;
    
    // Shuffle directions and positions
    const shuffledDirs = [...directions].sort(() => rng() - 0.5);
    const positions = [];
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        positions.push([r, c]);
      }
    }
    const shuffledPos = positions.sort(() => rng() - 0.5);
    
    for (const [dr, dc] of shuffledDirs) {
      for (const [r, c] of shuffledPos) {
        if (this.canPlaceEnhanced(grid, mask, word, r, c, dr, dc, overlapPolicy, maxOverlap)) {
          const cells = [];
          for (let i = 0; i < word.length; i++) {
            grid[r + dr * i][c + dc * i] = word[i];
            cells.push([r + dr * i, c + dc * i]);
          }
          return cells;
        }
      }
    }
    return null;
  },

  // Enhanced placement validation
  canPlaceEnhanced(grid, mask, word, r, c, dr, dc, overlapPolicy, maxOverlap) {
    const R = grid.length, C = grid[0].length;
    let overlapCount = 0;
    
    for (let i = 0; i < word.length; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      
      if (nr < 0 || nr >= R || nc < 0 || nc >= C || !mask[nr][nc]) {
        return false;
      }
      
      if (grid[nr][nc] !== '') {
        if (overlapPolicy === 'none') return false;
        if (grid[nr][nc] !== word[i]) return false;
        overlapCount++;
        if (overlapCount > maxOverlap) return false;
      }
    }
    return true;
  },

  // Enhanced filler with intelligence
  fillEnhanced(grid, mask, letterCase, fillerMode, placedWords) {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const getFiller = window.MXD_FillerIntelligence?.getFiller?.bind(window.MXD_FillerIntelligence) ||
      ((mode, rng) => A[Math.floor(rng() * 26)]);
    
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (mask[r][c] && grid[r][c] === '') {
          const filler = getFiller(fillerMode, Math.random, grid, r, c, placedWords);
          grid[r][c] = letterCase === 'lower' ? filler.toLowerCase() : filler;
        }
      }
    }
  },

  // Original methods preserved
  mxpShapeCell(R,C,x,y,k){
    const cx=(C-1)/2, cy=(R-1)/2, rx=C/2, ry=R/2;
    const inE=(xx,yy,ax,ay)=>{const dx=(xx-cx)/ax,dy=(yy-cy)/ay;return dx*dx+dy*dy<=1};
    const poly=(pts,xx,yy)=>{let ins=false;for(let a=0,b=pts.length-1;a<pts.length;b=a++){const[xa,ya]=pts[a],[xb,yb]=pts[b];if((ya>yy)!==(yb>yy)&&xx<(xb-xa)*(yy-ya)/(yb-ya)+xa)ins=!ins}return ins};
    const nPts=(n,r1,r2,off)=>{const p=[];for(let i=0;i<n;i++){const t=i*2*Math.PI/n+off;p.push([cx+r1*Math.cos(t),cy+r2*Math.sin(t)])}return p};
    const rect=(x0,y0,x1,y1)=>x>=x0&&x<=x1&&y>=y0&&y<=y1;
    const fl=(v)=>Math.floor(v);
    const xu=(p)=>fl(C*p), yu=(p)=>fl(R*p);

    if(k<=10){
      const s=k;
      if(s===1)return rect(xu(.38),0,xu(.62),R-1);
      if(s===2)return rect(0,yu(.58),C-1,R-1)||rect(xu(.12),yu(.22),xu(.32),yu(.58))||rect(xu(.68),yu(.22),xu(.88),yu(.58));
      if(s===3)return rect(xu(.18),yu(.45),xu(.82),R-1)||rect(xu(.35),yu(.18),xu(.65),yu(.45));
      if(s===4){const g=Math.max(2,fl(C/9));return(x%g===0)||(y%g===0);}
      if(s===5)return poly([[cx,cy-ry*.9],[cx-rx*.35,cy+ry*.2],[cx+rx*.35,cy+ry*.2]],x,y)||rect(xu(.3),yu(.55),xu(.7),R-1);
      if(s===6){const w=Math.max(1,xu(.12));return rect(0,0,w-1,R-1)||rect(C-w,0,C-1,R-1)||rect(xu(.4),0,xu(.6),yu(.35));}
      if(s===7){const t=Math.min(R,C,12);return y>=R-t&&Math.abs(x-cx)<=(t-(R-1-y))*((rx*.95)/t);}
      if(s===8)return inE(x,y,rx*.95,ry*.55)&&y>=yu(.35);
      if(s===9)return rect(0,yu(.35),xu(.45),R-1)||rect(xu(.55),yu(.25),C-1,R-1);
      return rect(xu(.15),yu(.55),xu(.85),R-1)&&!rect(xu(.35),yu(.35),xu(.65),yu(.75));
    }
    if(k<=20){
      const s=k-10;
      if(s===1)return inE(x,y,rx*.55,ry*.42)||inE(x,y+ry*.35,rx*.35,ry*.25);
      if(s===2)return inE(x,y,rx*.45,ry*.38)||inE(x,y-ry*.25,rx*.22,ry*.18)||inE(x,y+ry*.32,rx*.2,ry*.18);
      if(s===3)return inE(x,y,rx*.5,ry*.55)||poly([[cx,cy+ry*.2],[cx-rx*.55,cy-ry*.35],[cx+rx*.55,cy-ry*.35]],x,y);
      if(s===4)return inE(x,y,rx*.65,ry*.45)||inE(x+rx*.35,y,rx*.25,ry*.22)||inE(x-rx*.35,y,rx*.25,ry*.22);
      if(s===5)return inE(x,y,rx*.7,ry*.35)||inE(x,y+ry*.25,rx*.55,ry*.2);
      if(s===6)return inE(x,y,rx*.35,ry*.35)||inE(x+rx*.28,y-ry*.12,rx*.22,ry*.22)||inE(x-rx*.28,y-ry*.12,rx*.22,ry*.22);
      if(s===7)return inE(x,y,rx*.55,ry*.38)||poly([[cx-rx*.75,cy],[cx-rx*.35,cy-ry*.45],[cx-rx*.35,cy+ry*.45]],x,y);
      if(s===8)return inE(x,y,rx*.62,ry*.32)||inE(x,y-ry*.18,rx*.9,ry*.22);
      if(s===9)return inE(x,y,rx*.75,ry*.55)||inE(x,y-ry*.35,rx*.45,ry*.28);
      return inE(x,y,rx*.55,ry*.45)||poly([[cx+rx*.55,cy],[cx+rx*.95,cy-ry*.35],[cx+rx*.95,cy+ry*.35]],x,y);
    }
    if(k<=30){
      const s=k-20;
      const aw=Math.max(1,fl(C*(0.1+s*0.02))), ah=Math.max(1,fl(R*(0.1+((s+2)%5)*0.03)));
      if(s<=3)return(x>=aw&&x<C-aw)||(y>=ah&&y<R-ah);
      if(s<=6){const t=Math.max(1,Math.min(fl(Math.min(C,R)/4),1+(s%4)));return x>=0&&x<C&&y>=0&&y<R&&!(x>=t&&x<C-t&&y>=t&&y<R-t);}
      if(s<=8){const ri=Math.max(0.22,0.32+((s%5)*0.04));return inE(x,y,rx*0.92,ry*0.92)&&!inE(x,y,rx*ri,ry*ri);}
      const ang=Math.atan2(y-cy,x-cx), dist=Math.hypot(x-cx,y-cy);
      const mod=0.55+0.45*Math.abs(Math.cos(2*ang+s*0.21));
      return dist<=Math.max(rx,ry)*mod*0.93;
    }
    if(k<=38){
      const s=k-30;
      const pow=2.05+(s/7.5)*3.1;
      const nx=Math.abs(x-cx)/(rx*0.98), ny=Math.abs(y-cy)/(ry*0.98);
      return Math.pow(nx,pow)+Math.pow(ny,pow)<=1;
    }
    if(k<=44){
      const s=k-38;
      const wide=(s%2)===1;
      const mul=0.3+(s/6)*0.55;
      return wide?inE(x,y,rx*mul,ry):inE(x,y,rx,ry*mul);
    }
    if(k<=52){
      const s=k-44;
      const pts=6+s;
      const inner=0.16+((s%5)*0.04);
      const a=Math.atan2(y-cy,x-cx), d=Math.hypot(x-cx,y-cy);
      const rMx=Math.max(rx,ry)*(inner+(1-inner)*Math.abs(Math.cos((pts/2)*a+Math.PI/2)));
      return d<=rMx*0.93;
    }
    if(k<=58){
      const s=k-52;
      const n=8+s;
      return poly(nPts(n,rx*.95,ry*.95,-Math.PI/2),x,y);
    }
    if(k===59)return poly([[0,0],[C-1,0],[cx,cy]],x,y)||poly([[0,R-1],[C-1,R-1],[cx,cy]],x,y);
    const ri=Math.max(0.26,0.38);
    return inE(x,y,rx*0.94,ry*0.94)&&!inE(x,y,rx*ri,ry*ri);
  },

  mxShapeCell(R,C,x,y,idx){
    const cx=(C-1)/2, cy=(R-1)/2, rx=C/2, ry=R/2;
    const inE=(xx,yy,ax,ay)=>{const dx=(xx-cx)/ax,dy=(yy-cy)/ay;return dx*dx+dy*dy<=1};
    const poly=(pts,xx,yy)=>{let ins=false;for(let a=0,b=pts.length-1;a<pts.length;b=a++){const[xa,ya]=pts[a],[xb,yb]=pts[b];if((ya>yy)!==(yb>yy)&&xx<(xb-xa)*(yy-ya)/(yb-ya)+xa)ins=!ins}return ins};
    const nPts=(n,r1,r2,off=0)=>{const p=[];for(let i=0;i<n;i++){const t=i*2*Math.PI/n+off;p.push([cx+r1*Math.cos(t),cy+r2*Math.sin(t)])}return p};

    const slot=idx-1;
    const region=Math.floor(slot/40);
    const j=slot%40;

    if(region===0){
      const n=7+j;
      return poly(nPts(n,rx*.95,ry*.95,-Math.PI/2),x,y);
    }
    if(region===1){
      const pts=5+(j%12);
      const inner=0.17+((Math.floor(j/12)%8)*0.042);
      const a=Math.atan2(y-cy,x-cx), d=Math.hypot(x-cx,y-cy);
      const rMx=Math.max(rx,ry)*(inner+(1-inner)*Math.abs(Math.cos((pts/2)*a+Math.PI/2)));
      return d<=rMx*0.93;
    }
    if(region===2){
      const wide=(j%2)===0;
      const mul=0.28+(j/39)*0.62;
      return wide?inE(x,y,rx*mul,ry):inE(x,y,rx,ry*mul);
    }
    if(region===3){
      const pow=2.05+(j/39)*3.35;
      const nx=Math.abs(x-cx)/(rx*0.98);
      const ny=Math.abs(y-cy)/(ry*0.98);
      return Math.pow(nx,pow)+Math.pow(ny,pow)<=1;
    }
    const bucket=Math.floor(j/10);
    const sub=j%10;
    if(bucket===0){
      const aw=Math.max(1,Math.floor(C*(0.12+sub*0.028)));
      const ah=Math.max(1,Math.floor(R*(0.11+((sub+3)%5)*0.03)));
      return (x>=aw&&x<C-aw)||(y>=ah&&y<R-ah);
    }
    if(bucket===1){
      const t=Math.max(1,Math.min(Math.floor(Math.min(C,R)/4),1+sub%4));
      return x>=0&&x<C&&y>=0&&y<R&&!(x>=t&&x<C-t&&y>=t&&y<R-t);
    }
    if(bucket===2){
      const ri=Math.max(0.22,0.34+((sub%6)*0.045));
      return inE(x,y,rx*0.92,ry*0.92)&&!inE(x,y,rx*ri,ry*ri);
    }
    const ang=Math.atan2(y-cy,x-cx), dist=Math.hypot(x-cx,y-cy);
    const mod=0.58+0.42*Math.abs(Math.cos(2*ang+sub*0.25));
    return dist<=Math.max(rx,ry)*mod*0.93;
  },

  seeded(seed){
    let a = (seed >>> 0) || 1;
    return function(){
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  mask(R,C,shape){
    const m=Array.from({length:R},()=>Array(C).fill(false));
    const cx=(C-1)/2,cy=(R-1)/2,rx=C/2,ry=R/2;
    const inE=(x,y,ax,ay)=>{const dx=(x-cx)/ax,dy=(y-cy)/ay;return dx*dx+dy*dy<=1};
    const poly=(pts,x,y)=>{let i=false;for(let a=0,b=pts.length-1;a<pts.length;b=a++){const[xa,ya]=pts[a],[xb,yb]=pts[b];if((ya>y)!==(yb>y)&&x<(xb-xa)*(y-ya)/(yb-ya)+xa)i=!i}return i};
    const nPts=(n,r1,r2,off=0)=>{const p=[];for(let i=0;i<n;i++){const a=i*2*Math.PI/n+off;p.push([cx+r1*Math.cos(a),cy+r2*Math.sin(a)])}return p};
    for(let y=0;y<R;y++)for(let x=0;x<C;x++){
      let v=false;
      switch(shape){
        case'square':v=true;break;
        case'circle':v=inE(x,y,rx,ry);break;
        case'oval':v=inE(x,y,rx,ry*0.65);break;
        case'diamond':v=Math.abs(x-cx)/rx+Math.abs(y-cy)/ry<=1;break;
        case'triangle':{const w=((y+1)/R)*C,l=(C-w)/2;v=x>=l&&x<l+w;break}
        case'tri_down':{const w=((R-y)/R)*C,l=(C-w)/2;v=x>=l&&x<l+w;break}
        case'tri_left':{const h=((x+1)/C)*R,t=(R-h)/2;v=y>=t&&y<t+h;break}
        case'tri_right':{const h=((C-x)/C)*R,t=(R-h)/2;v=y>=t&&y<t+h;break}
        case'pentagon':v=poly(nPts(5,rx*.95,ry*.95,-Math.PI/2),x,y);break;
        case'hexagon':v=poly(nPts(6,rx*.95,ry*.95,0),x,y);break;
        case'octagon':v=poly(nPts(8,rx*.95,ry*.95,0),x,y);break;
        case'star5':{const a=Math.atan2(y-cy,x-cx),d=Math.sqrt((x-cx)**2+(y-cy)**2),r=Math.max(rx,ry)*(0.38+0.62*Math.abs(Math.cos(2.5*a+Math.PI/2)));v=d<=r*.93;break}
        case'star4':{const a=Math.atan2(y-cy,x-cx),d=Math.sqrt((x-cx)**2+(y-cy)**2),r=Math.max(rx,ry)*(0.3+0.7*Math.abs(Math.cos(2*a)));v=d<=r*.93;break}
        case'star6':{const a=Math.atan2(y-cy,x-cx),d=Math.sqrt((x-cx)**2+(y-cy)**2),r=Math.max(rx,ry)*(0.4+0.6*Math.abs(Math.cos(3*a)));v=d<=r*.93;break}
        case'heart':{const nx=(x-cx)/(rx*.88),ny=(y-cy)/(ry*.88),h=nx*nx+ny*ny-1;v=h*h*h-nx*nx*ny*ny*ny<=0.06;break}
        case'cross':{const aw=Math.floor(C/3),ah=Math.floor(R/3);v=(x>=aw&&x<C-aw)||(y>=ah&&y<R-ah);break}
        case'moon':{const full=inE(x,y,rx,ry),cut=((x-(cx+rx*.22))**2/(rx*.8)**2+(y-cy)**2/(ry*.92)**2)<=1;v=full&&!cut;break}
        case'cloud':{const bs=[[cx,cy,rx*.55,ry*.55],[cx-rx*.45,cy+ry*.18,rx*.4,ry*.4],[cx+rx*.45,cy+ry*.18,rx*.4,ry*.4],[cx-rx*.22,cy-ry*.18,rx*.38,ry*.38],[cx+rx*.22,cy-ry*.18,rx*.38,ry*.38]];v=bs.some(([bx,by,bx2,by2])=>inE(x,y,bx2,by2)&&((x-bx)**2/bx2**2+(y-by)**2/by2**2)<=1);break}
        case'shield':{const top=inE(x,y,rx*.9,ry*.62)&&y<=cy+ry*.35;const bot=y>cy+ry*.3&&poly([[cx-rx*.82,cy+ry*.3],[cx+rx*.82,cy+ry*.3],[cx,R-.5]],x,y);v=top||bot;break}
        case'lightning':v=poly([[cx+rx*.2,0],[cx-rx*.5,ry],[cx+rx*.1,ry],[cx-rx*.2,R-1],[cx+rx*.5,ry*1.05],[cx,ry*1.05],[cx+rx*.2,0]],x,y);break;
        case'letter_L':{const sw=Math.floor(C*.35),bh=Math.floor(R*.28);v=(x<sw)||(y>=R-bh);break}
        case'letter_T':{const th=Math.floor(R*.28),sw=Math.floor(C*.35),sx=Math.floor((C-sw)/2);v=(y<th)||(x>=sx&&x<sx+sw);break}
        case'letter_O':{const tk=Math.max(2,Math.floor(Math.min(rx,ry)*.35));v=inE(x,y,rx,ry)&&!inE(x,y,rx-tk,ry-tk);break}
        case'letter_X':{const dx2=Math.abs(x-cx),dy2=Math.abs(y-cy),w=Math.max(2,Math.floor(Math.min(rx,ry)*.28));v=Math.abs(dx2-dy2)<w*(rx/ry)||Math.abs(dx2+dy2-Math.max(rx,ry))<w;break}
        case'letter_C':{const tk=Math.max(2,Math.floor(Math.min(rx,ry)*.35));const ring=inE(x,y,rx,ry)&&!inE(x,y,rx-tk,ry-tk);const cut=x>cx+rx*.15&&Math.abs(y-cy)<ry*.38;v=ring&&!cut;break}
        case'cat':{const body=inE(x,y,rx*.85,ry*.6),eL=poly([[cx-rx*.6,cy-ry*.35],[cx-rx*.2,cy-ry*.35],[cx-rx*.4,cy-ry*1.0]],x,y),eR=poly([[cx+rx*.2,cy-ry*.35],[cx+rx*.6,cy-ry*.35],[cx+rx*.4,cy-ry*1.0]],x,y);v=body||eL||eR;break}
        case'bird':{const body=inE(x,y,rx*.55,ry*.4),wing=poly([[cx-rx*.9,cy-.1],[cx+rx*.1,cy-ry*.5],[cx+rx*.1,cy+ry*.1]],x,y),tail=poly([[cx+rx*.45,cy-ry*.1],[cx+rx*1.0,cy-ry*.55],[cx+rx*1.0,cy+ry*.2],[cx+rx*.45,cy+ry*.1]],x,y);v=body||wing||tail;break}
        case'fish':{const body=inE(x,y,rx*.7,ry*.55),tail=poly([[cx+rx*.55,cy],[cx+rx*1.0,cy-ry*.55],[cx+rx*1.0,cy+ry*.55]],x,y);v=body||tail;break}
        case'tree':{const tw=Math.floor(C*.18),th=Math.floor(R*.28),tx=Math.floor((C-tw)/2),trunk=x>=tx&&x<tx+tw&&y>=R-th,top=y<R-th&&Math.abs(x-cx)<=(R-th-y)*((rx*.9)/(R-th));v=trunk||top;break}
        case'house':{const wh=Math.floor(R*.5),wy=Math.floor(R*.45),wall=y>=wy&&x>=Math.floor(C*.1)&&x<Math.floor(C*.9),roof=y<wy&&Math.abs(x-cx)<=((wy-y)*(rx*.85)/wy);v=wall||roof;break}
        case'arrow_r':{const mid=Math.floor(R/2),tip=Math.floor(C*.55),shaft=y>=mid-Math.floor(R*.18)&&y<=mid+Math.floor(R*.18)&&x<tip,head=Math.abs(y-mid)<=(C-x)*.65&&x>=tip;v=shaft||head;break}
        case'arrow_u':{const mid=Math.floor(C/2),tip=Math.floor(R*.45),shaft=x>=mid-Math.floor(C*.18)&&x<=mid+Math.floor(C*.18)&&y>tip,head=Math.abs(x-mid)<=(R-y)*.65&&y<=tip;v=shaft||head;break}
        case'hourglass':{const cy2=cy;const top=y<=cy2&&Math.abs(x-cx)<=((y+1)/(cy2+1))*rx*0.92;const den=Math.max(0.001,(R-1-cy2));const bot=y>=cy2&&Math.abs(x-cx)<=((R-1-y)/den)*rx*0.92;v=top||bot;break}
        case'stadium':{const pillRx=rx*0.92,pillRy=ry*0.48,halfW=Math.max(0,pillRx-pillRy),dx=Math.abs(x-cx),dyy=Math.abs(y-cy);v=(dx<=halfW&&dyy<=pillRy)||(Math.hypot(dx-halfW,dyy)<=pillRy+0.5);break}
        case'arch_up':v=inE(x,y,rx*0.95,ry*0.9)&&y<=cy+ry*0.12;break;
        case'bowtie':v=poly([[0,0],[C-1,0],[cx,cy]],x,y)||poly([[0,R-1],[C-1,R-1],[cx,cy]],x,y);break;
        case'donut':v=inE(x,y,rx*0.94,ry*0.94)&&!inE(x,y,rx*0.55,ry*0.55);break;
        default:{
          const mxdMatch = shape.match(/^mxd_(\d+)_(\d+)$/);
          if (mxdMatch) {
            const catIdx = parseInt(mxdMatch[1], 10);
            const shapeIdx = parseInt(mxdMatch[2], 10);
            if (typeof MXDShapes !== 'undefined' && MXDShapes.getShape) {
              const mxdShape = MXDShapes.getShape(catIdx, shapeIdx);
              if (mxdShape && mxdShape.path) {
                const normShape = MXDShapes.normalizeShape ? MXDShapes.normalizeShape(mxdShape, C, R) : mxdShape;
                v = MXDShapes.pointInShape ? MXDShapes.pointInShape(x, y, normShape) : false;
                break;
              }
            }
            v = true;
            break;
          }
          const mxp=/^mxp_(\d+)$/.exec(shape);
          if(mxp){
            const ik=parseInt(mxp[1],10);
            if(ik>=1&&ik<=60){ v=this.mxpShapeCell(R,C,x,y,ik); break; }
          }
          const mx=/^shape_mx_(\d+)$/.exec(shape);
          if(mx){
            const ix=parseInt(mx[1],10);
            if(ix>=1&&ix<=200){ v=this.mxShapeCell(R,C,x,y,ix); break; }
          }
          v=true;break;
        }
      }
      m[y][x]=v;
    }
    return m;
  },

  canPlace(grid,mask,word,r,c,dr,dc,overlapPolicy){
    const R=grid.length,C=grid[0].length;
    for(let i=0;i<word.length;i++){
      const nr=r+dr*i,nc=c+dc*i;
      if(nr<0||nr>=R||nc<0||nc>=C||!mask[nr][nc])return false;
      if(grid[nr][nc]!=='' ){
        if(overlapPolicy==='none') return false;
        if(grid[nr][nc]!==word[i]) return false;
      }
    }
    return true;
  },

  place(grid,mask,word,opts){
    const { diag, rev, allowH, allowV, overlapPolicy, rng } = opts;
    const dirs=[];
    if(allowH!==false) dirs.push(this.DIRS[0]);
    if(allowV!==false) dirs.push(this.DIRS[1]);
    if(rev){
      if(allowH!==false) dirs.push(this.DIRS[2]);
      if(allowV!==false) dirs.push(this.DIRS[3]);
    }
    if(diag) dirs.push(...this.DIRS.slice(4));
    dirs.sort(()=> (rng() - 0.5));
    const R=grid.length,C=grid[0].length;
    const pos=[];
    for(let r=0;r<R;r++)for(let c=0;c<C;c++)pos.push([r,c]);
    pos.sort(()=> (rng() - 0.5));
    for(const[dr,dc]of dirs)for(const[r,c]of pos)
      if(this.canPlace(grid,mask,word,r,c,dr,dc,overlapPolicy)){
        const cells=[];
        for(let i=0;i<word.length;i++){grid[r+dr*i][c+dc*i]=word[i];cells.push([r+dr*i,c+dc*i]);}
        return cells;
      }
    return null;
  },

  fill(grid,mask,lc,rng){
    const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for(let r=0;r<grid.length;r++)for(let c=0;c<grid[0].length;c++)
      if(mask[r][c]&&grid[r][c]===''){const ch=A[Math.floor(rng()*26)];grid[r][c]=lc==='lower'?ch.toLowerCase():ch;}
  },

  generate(cfg){
    const{rows,cols,words,shape,allowDiag,allowReverse,allowH=true,allowV=true,letterCase,maxAttempts=120}=cfg;
    const overlapPolicy = cfg.overlapPolicy || 'matchOnly';
    const seedVal = (cfg.seed===''||cfg.seed==null) ? null : Number(cfg.seed);
    const rng = Number.isFinite(seedVal) ? this.seeded(seedVal) : Math.random;
    for(let a=0;a<maxAttempts;a++){
      const grid=this.empty(rows,cols),mask=this.mask(rows,cols,shape),placements={};
      let ok=true;
      for(const w of [...words].sort((a,b)=>b.length-a.length)){
        const uw=letterCase==='lower'?w.toLowerCase():w.toUpperCase();
        const cells=this.place(grid,mask,uw,{diag:allowDiag,rev:allowReverse,allowH,allowV,overlapPolicy,rng});
        if(cells)placements[w]=cells;else{ok=false;break;}
      }
      if(ok){
        this.fill(grid,mask,letterCase,rng);
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(!mask[r][c])grid[r][c]='';
        return{grid,mask,placements,success:true};
      }
    }
    const grid=this.empty(rows,cols),mask=this.mask(rows,cols,shape),placements={};
    for(const w of [...words].sort((a,b)=>b.length-a.length)){
      const uw=letterCase==='lower'?w.toLowerCase():w.toUpperCase();
      const cells=this.place(grid,mask,uw,{diag:allowDiag,rev:allowReverse,allowH,allowV,overlapPolicy,rng});
      if(cells)placements[w]=cells;
    }
    this.fill(grid,mask,letterCase,rng);
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(!mask[r][c])grid[r][c]='';
    return{grid,mask,placements,success:Object.keys(placements).length===words.length};
  }
};

// ============ CROSSWORD ENGINE ============
window.CrosswordEngine = {
  DIRS:[[0,1],[1,0]],
  empty(R,C){return Array.from({length:R},()=>Array(C).fill(null));},

  findIntersections(words){
    const intersections={};
    for(let i=0;i<words.length;i++){
      for(let j=i+1;j<words.length;j++){
        const w1=words[i],w2=words[j];
        for(let c1=0;c1<w1.length;c1++){
          for(let c2=0;c2<w2.length;c2++){
            if(w1[c1]===w2[c2]){
              if(!intersections[i])intersections[i]=[];
              if(!intersections[j])intersections[j]=[];
              intersections[i].push({wordIdx:j,pos:c1,crossPos:c2});
              intersections[j].push({wordIdx:i,pos:c2,crossPos:c1});
            }
          }
        }
      }
    }
    return intersections;
  },

  generate(cfg){
    const{rows=15,cols=15,words,letterCase='upper',maxAttempts=50}=cfg;
    const uw=words.map(w=>letterCase==='lower'?w.toLowerCase():w.toUpperCase());
    for(let attempt=0;attempt<maxAttempts;attempt++){
      const grid=this.empty(rows,cols),placements={},usedCells={};
      const placed=[];
      const intersections=this.findIntersections(uw);
      const sorted=uw.slice().sort((a,b)=>{
        const ia=uw.indexOf(a),ib=uw.indexOf(b);
        const interA=(intersections[ia]||[]).length,interB=(intersections[ib]||[]).length;
        if(interA!==interB)return interB-interA;
        return b.length-a.length;
      });
      let allPlaced=true;
      for(const word of sorted){
        const idx=uw.indexOf(word);
        const inters=intersections[idx]||[];
        let best=null;
        if(inters.length>0){
          for(const inter of inters){
            const other=placed.find(p=>p.idx===inter.wordIdx);
            if(!other)continue;
            const dr=other.dir===0?0:1,dc=other.dir===1?0:1;
            const r=other.r+inter.crossPos*dr,c=other.c+inter.crossPos*dc;
            if(word[inter.pos]===other.word[other.pos]){
              const newR=r-inter.pos*dr,newC=c-inter.pos*dc;
              if(newR>=0&&newR+word.length<=rows&&newC>=0&&newC+word.length<=cols){
                let valid=true;
                for(let k=0;k<word.length;k++){
                  const nr=newR+k*dr,nc=newC+k*dc;
                  if(grid[nr][nc]!==null&&grid[nr][nc]!==word[k]){valid=false;break;}
                  if(k!==inter.pos){
                    if(nr>0&&grid[nr-1][nc]!==null&&(dr===0||(grid[nr-1][nc-1]??null)===null))valid=false;
                    if(nr<rows-1&&grid[nr+1][nc]!==null&&(dr===0||(grid[nr+1][nc+1]??null)===null))valid=false;
                    if(nc>0&&grid[nr][nc-1]!==null&&(dc===0||(grid[nr-1][nc-1]??null)===null))valid=false;
                    if(nc<cols-1&&grid[nr][nc+1]!==null&&(dc===0||(grid[nr+1][nc+1]??null)===null))valid=false;
                  }
                }
                if(valid){
                  const score=placed.length===0?1000:inters.filter(i=>placed.some(p=>p.idx===i.wordIdx)).length*10-(Math.abs(newR-rows/2)+Math.abs(newC-cols/2));
                  if(!best||score>best.score){best={r:newR,c:newC,dir:dr===0?1:0,score};}
                }
              }
            }
          }
        }
        if(!best||placed.length===0){
          const positions=[];
          for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)positions.push([r,c]);
          for(const[r,c]of positions.sort(()=>Math.random()-0.5)){
            for(const[dr,dc]of this.DIRS){
              let valid=true,cells=[];
              for(let k=0;k<word.length;k++){
                const nr=r+k*dr,nc=c+k*dc;
                if(nr<0||nr>=rows||nc<0||nc>=cols){valid=false;break;}
                if(grid[nr][nc]!==null&&grid[nr][nc]!==word[k]){valid=false;break;}
                cells.push([nr,nc]);
              }
              if(valid){
                const score=100-Math.abs(r-rows/2)-Math.abs(c-cols/2);
                if(!best||score>best.score)best={r,c,dir:dc===0?1:0,cells,score};
              }
            }
          }
        }
        if(!best)continue;
        if(!best.cells){
          best.cells=[];
          for(let k=0;k<word.length;k++)best.cells.push([best.r+k*(best.dir===0?0:1),best.c+k*(best.dir===0?1:0)]);
        }
        for(let k=0;k<word.length;k++){
          const[nr,nc]=best.cells[k];
          grid[nr][nc]=word[k];
        }
        placements[word]={r:best.r,c:best.c,dir:best.dir,cells:best.cells};
        placed.push({idx:uw.indexOf(word),word,r:best.r,c:best.c,dir:best.dir,pos:best.dir===0?0:0});
      }
      if(Object.keys(placements).length===uw.length){
        const clues=uw.map(w=>({word:w,clue:w}));
        return{grid,placements,clues,success:true,type:'crossword'};
      }
    }
    return{grid:null,placements:{},clues:[],success:false,type:'crossword',placed:Object.keys(placements).length,total:uw.length};
  }
};

// ============ WORD FILL ENGINE ============
window.WordFillEngine = {
  generate(cfg){
    const{rows=10,cols=10,words,letterCase='upper',difficulty='medium'}=cfg;
    const uw=words.map(w=>letterCase==='lower'?w.toLowerCase():w.toUpperCase());
    const totalCells=rows*cols;
    const targetFill=Math.min(uw.reduce((s,w)=>s+w.length,0),Math.floor(totalCells*(difficulty==='easy'?0.9:difficulty==='medium'?0.75:0.6)));
    let bestResult=null,bestScore=0;
    for(let attempt=0;attempt<30;attempt++){
      const grid=Array.from({length:rows},()=>Array(cols).fill(null));
      const positions=Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>({r,c}))).flat().sort(()=>Math.random()-0.5);
      let filled=0;
      const sorted=[...uw].sort((a,b)=>b.length-a.length);
      for(const word of sorted){
        let placed=false;
        for(const pos of positions){
          if(filled>=targetFill)break;
          if(Math.random()>0.5){
            if(pos.c+word.length<=cols){
              let ok=true;
              for(let i=0;i<word.length;i++){
                if(grid[pos.r][pos.c+i]!==null&&grid[pos.r][pos.c+i]!==word[i]){ok=false;break;}
              }
              if(ok){
                for(let i=0;i<word.length;i++){if(grid[pos.r][pos.c+i]===null){grid[pos.r][pos.c+i]=word[i];filled++;}}
                placed=true;
              }
            }
          }else{
            if(pos.r+word.length<=rows){
              let ok=true;
              for(let i=0;i<word.length;i++){
                if(grid[pos.r+i][pos.c]!==null&&grid[pos.r+i][pos.c]!==word[i]){ok=false;break;}
              }
              if(ok){
                for(let i=0;i<word.length;i++){if(grid[pos.r+i][pos.c]===null){grid[pos.r+i][pos.c]=word[i];filled++;}}
                placed=true;
              }
            }
          }
        }
      }
      const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const fillGrid=grid.map(row=>row.map(cell=>cell||(letterCase==='lower'?A[Math.floor(Math.random()*26)].toLowerCase():A[Math.floor(Math.random()*26)])));
      const score=filled;
      if(score>bestScore){bestScore=score;bestResult={grid:fillGrid,mask:grid,filledWords:filled,success:filled>0,type:'wordfill'};}
      if(filled===targetFill)break;
    }
    return bestResult||{grid:null,success:false,type:'wordfill'};
  }
};

// ============ DATA MODULE ============
window.TEMPLATES = {
  // ORIGINAL TEMPLATES (20)
  classic:      {n:'Classic White',      bg:'#ffffff',tc:'#1a1a2e',cc:'#2d2d44',pb:'#f3f0ff',pc:'#4a3d8f',ac:'#e8e0ff',ff:'Inter,sans-serif',   bw:false,gl:false,gb:false,sh:true},
  grid_lines:   {n:'Grid Lines',         bg:'#ffffff',tc:'#1e3a5f',cc:'#1e40af',pb:'#e8f4ff',pc:'#1e40af',ac:'#dbeafe',ff:'Inter,monospace',    bw:false,gl:true, gb:true, sh:true},
  ocean:        {n:'Ocean Blue',         bg:'#eff6ff',tc:'#1e3a5f',cc:'#1e40af',pb:'#dbeafe',pc:'#1e40af',ac:'#bfdbfe',ff:'Inter,sans-serif',   bw:false,gl:false,gb:false,sh:true},
  forest:       {n:'Forest Green',       bg:'#f0fdf4',tc:'#14532d',cc:'#166534',pb:'#dcfce7',pc:'#14532d',ac:'#bbf7d0',ff:'Inter,sans-serif',   bw:false,gl:false,gb:false,sh:true},
  sunset:       {n:'Sunset Orange',      bg:'#fff7ed',tc:'#9a3412',cc:'#c2410c',pb:'#fed7aa',pc:'#9a3412',ac:'#fdba74',ff:'Inter,sans-serif',   bw:false,gl:false,gb:false,sh:true},
  rose:         {n:'Rose Gold',          bg:'#fff1f2',tc:'#9f1239',cc:'#be123c',pb:'#ffe4e6',pc:'#9f1239',ac:'#fecdd3',ff:'Inter,sans-serif',   bw:false,gl:false,gb:false,sh:true},
  gold:         {n:'Gold Premium',       bg:'#fffbeb',tc:'#78350f',cc:'#92400e',pb:'#fef3c7',pc:'#78350f',ac:'#fde68a',ff:'Georgia,serif',      bw:false,gl:true, gb:false, sh:true},
  lavender:     {n:'Lavender Dream',     bg:'#f5f3ff',tc:'#4c1d95',cc:'#6d28d9',pb:'#ede9fe',pc:'#4c1d95',ac:'#ddd6fe',ff:'Inter,sans-serif',  bw:false,gl:false,gb:false,sh:true},
  mint:         {n:'Mint Fresh',         bg:'#f0fdfa',tc:'#134e4a',cc:'#0f766e',pb:'#ccfbf1',pc:'#134e4a',ac:'#99f6e4',ff:'Inter,sans-serif',  bw:false,gl:false,gb:false,sh:true},
  slate:        {n:'Slate Cool',         bg:'#f8fafc',tc:'#0f172a',cc:'#334155',pb:'#e2e8f0',pc:'#0f172a',ac:'#cbd5e1',ff:'Inter,sans-serif',  bw:false,gl:true, gb:false,sh:true},
  dark_purple:  {n:'Dark Purple',        bg:'#1e1b4b',tc:'#c4b5fd',cc:'#e0e7ff',pb:'rgba(139,92,246,.2)',pc:'#c4b5fd',ac:'#4c1d95',ff:'Inter,sans-serif',bw:false,gl:false,gb:false,sh:false},
  midnight:     {n:'Midnight Dark',      bg:'#0f172a',tc:'#94a3b8',cc:'#cbd5e1',pb:'rgba(148,163,184,.1)',pc:'#94a3b8',ac:'#1e293b',ff:'Inter,monospace',bw:false,gl:false,gb:false,sh:false},
  neon_dark:    {n:'Neon Dark',          bg:'#0a0a0f',tc:'#39ff14',cc:'#00ffff',pb:'rgba(57,255,20,.08)',pc:'#39ff14',ac:'rgba(57,255,20,.15)',ff:'Inter,monospace',bw:false,gl:true,gb:false,sh:false},
  deep_sea:     {n:'Deep Sea',           bg:'#0c1445',tc:'#67e8f9',cc:'#a5f3fc',pb:'rgba(103,232,249,.1)',pc:'#67e8f9',ac:'rgba(103,232,249,.15)',ff:'Inter,sans-serif',bw:false,gl:false,gb:false,sh:false},
  galaxy:       {n:'Galaxy',             bg:'#13002b',tc:'#d8b4fe',cc:'#e9d5ff',pb:'rgba(216,180,254,.1)',pc:'#d8b4fe',ac:'rgba(139,92,246,.2)',ff:'Inter,sans-serif',bw:false,gl:false,gb:false,sh:false},
  newspaper:    {n:'Newspaper',          bg:'#faf6f0',tc:'#1a1a1a',cc:'#333333',pb:'#e8e0d0',pc:'#333333',ac:'#c0b090',ff:'Georgia,serif',      bw:true, gl:false,gb:true, sh:false},
  bw_clean:     {n:'Black & White',      bg:'#ffffff',tc:'#000000',cc:'#000000',pb:'#eeeeee',pc:'#333333',ac:'#cccccc',ff:'Inter,monospace',    bw:true, gl:false,gb:false,sh:false},
  bw_grid:      {n:'B&W Grid',           bg:'#ffffff',tc:'#000000',cc:'#000000',pb:'#f0f0f0',pc:'#222222',ac:'#cccccc',ff:'Inter,monospace',    bw:true, gl:true, gb:true, sh:false},
  kids:         {n:'Kids Colorful',      bg:'#fffde7',tc:'#e65100',cc:'#1565c0',pb:'#e1f5fe',pc:'#01579b',ac:'#b3e5fc',ff:'Arial,sans-serif',  bw:false,gl:true, gb:true, sh:true},
  retro:        {n:'Retro Terminal',     bg:'#0d1117',tc:'#00ff41',cc:'#00cc33',pb:'rgba(0,255,65,.08)',pc:'#00ff41',ac:'rgba(0,255,65,.12)',ff:'Courier New,monospace',bw:false,gl:true,gb:false,sh:false},
  
  // NOTEBOOK & JOURNAL TEMPLATES (30+)
  notebook_blank:    {n:'📓 Classic Notebook',      bg:'#fefefe',tc:'#2c2c2c',cc:'#1a1a1a',pb:'#f5f5dc',pc:'#8b4513',ac:'#ddd8c4',ff:'Courier New,monospace',  bw:false,gl:false,gb:false,sh:true},
  notebook_grid:     {n:'📓 Grid Notebook',          bg:'#ffffff',tc:'#2c2c2c',cc:'#1e40af',pb:'#e3f2fd',pc:'#1565c0',ac:'#bbdefb',ff:'Consolas,monospace',     bw:false,gl:true, gb:true, sh:true},
  notebook_lined:    {n:'📝 Lined Notebook',        bg:'#fffef8',tc:'#1a1a1a',cc:'#333333',pb:'#fffde7',pc:'#795548',ac:'#d7ccc8',ff:'Times New Roman,serif', bw:false,gl:false,gb:false,sh:true},
  journal_classic:   {n:'📔 Journal Classic',        bg:'#faf8f5',tc:'#3e2723',cc:'#4e342e',pb:'#efebe9',pc:'#5d4037',ac:'#d7ccc8',ff:'Georgia,serif',         bw:false,gl:false,gb:false,sh:true},
  journal_diary:     {n:'📓 Personal Diary',          bg:'#fff0f5',tc:'#880e4f',cc:'#ad1457',pb:'#fce4ec',pc:'#c2185b',ac:'#f8bbd0',ff:'Comic Sans MS,sans-serif',bw:false,gl:false,gb:false,sh:true},
  journal_travel:    {n:'✈️ Travel Journal',         bg:'#e8f5e9',tc:'#1b5e20',cc:'#2e7d32',pb:'#c8e6c9',pc:'#388e3c',ac:'#a5d6a7',ff:'Verdana,sans-serif',    bw:false,gl:false,gb:false,sh:true},
  journal_sketch:    {n:'🎨 Sketch Journal',         bg:'#fff8e1',tc:'#e65100',cc:'#bf360c',pb:'#fff3e0',pc:'#ef6c00',ac:'#ffe0b2',ff:'Arial,sans-serif',     bw:false,gl:false,gb:false,sh:true},
  planner_weekly:    {n:'📅 Weekly Planner',          bg:'#ffffff',tc:'#1a237e',cc:'#283593',pb:'#e8eaf6',pc:'#3949ab',ac:'#c5cae9',ff:'Arial,sans-serif',     bw:false,gl:false,gb:false,sh:true},
  planner_monthly:   {n:'📆 Monthly Planner',        bg:'#f3e5f5',tc:'#4a148c',cc:'#6a1b9a',pb:'#ede7f6',pc:'#7b1fa2',ac:'#d1c4e9',ff:'Helvetica,sans-serif',  bw:false,gl:false,gb:false,sh:true},
  planner_daily:     {n:'📋 Daily Planner',          bg:'#e3f2fd',tc:'#0d47a1',cc:'#1565c0',pb:'#bbdefb',pc:'#1976d2',ac:'#90caf9',ff:'Segoe UI,sans-serif',    bw:false,gl:false,gb:false,sh:true},
  bullet_dots:       {n:'📌 Bullet Journal Dots',    bg:'#fafafa',tc:'#212121',cc:'#424242',pb:'#f5f5f5',pc:'#616161',ac:'#eeeeee',ff:'Roboto,sans-serif',     bw:false,gl:false,gb:false,sh:true},
  bullet_squares:    {n:'📐 Bullet Journal Squares', bg:'#ffffff',tc:'#1a1a1a',cc:'#212121',pb:'#f5f5f5',pc:'#424242',ac:'#e0e0e0',ff:'Arial,sans-serif',      bw:true,gl:true,gb:true,sh:false},
  recipe_book:       {n:'🍳 Recipe Book',            bg:'#fff8e1',tc:'#bf360c',cc:'#d84315',pb:'#ffe082',pc:'#ff8f00',ac:'#ffb74d',ff:'Georgia,serif',         bw:false,gl:false,gb:false,sh:true},
  gratitude_journal: {n:'🙏 Gratitude Journal',      bg:'#f3e5f5',tc:'#4a148c',cc:'#6a1b9a',pb:'#ede7f6',pc:'#7b1fa2',ac:'#d1c4e9',ff:'Comic Sans MS,sans-serif',bw:false,gl:false,gb:false,sh:true},
  fitness_log:       {n:'💪 Fitness Log',            bg:'#e8f5e9',tc:'#1b5e20',cc:'#2e7d32',pb:'#c8e6c9',pc:'#388e3c',ac:'#a5d6a7',ff:'Arial,sans-serif',     bw:false,gl:false,gb:false,sh:true},
  budget_tracker:    {n:'💰 Budget Tracker',         bg:'#fce4ec',tc:'#880e4f',cc:'#ad1457',pb:'#f8bbd0',pc:'#c2185b',ac:'#f48fb1',ff:'Courier New,monospace',  bw:false,gl:false,gb:false,sh:true},
  study_notes:       {n:'📚 Study Notes',           bg:'#e3f2fd',tc:'#0d47a1',cc:'#1565c0',pb:'#bbdefb',pc:'#1976d2',ac:'#90caf9',ff:'Times New Roman,serif', bw:false,gl:false,gb:false,sh:true},
  science_lab:       {n:'🔬 Science Lab',            bg:'#e0f7fa',tc:'#006064',cc:'#00838f',pb:'#b2ebf2',pc:'#0097a7',ac:'#80deea',ff:'Consolas,monospace',    bw:false,gl:false,gb:false,sh:true},
  math_workbook:     {n:'📐 Math Workbook',          bg:'#ffffff',tc:'#1a1a1a',cc:'#212121',pb:'#f5f5f5',pc:'#424242',ac:'#e0e0e0',ff:'Arial,sans-serif',      bw:true,gl:true,gb:true,sh:false},
  handwriting_practice: {n:'✍️ Handwriting Practice', bg:'#fffef8',tc:'#2c2c2c',cc:'#1a1a1a',pb:'#fffde7',pc:'#795548',ac:'#d7ccc8',ff:'Arial,sans-serif',     bw:false,gl:false,gb:false,sh:true},
  bible_study:       {n:'📖 Bible Study',           bg:'#f5f5dc',tc:'#3e2723',cc:'#4e342e',pb:'#efebe9',pc:'#5d4037',ac:'#d7ccc8',ff:'Georgia,serif',         bw:false,gl:false,gb:false,sh:true},
  doodle_book:       {n:'🎨 Doodle Book',           bg:'#fff8e1',tc:'#e65100',cc:'#bf360c',pb:'#fff3e0',pc:'#ef6c00',ac:'#ffe0b2',ff:'Comic Sans MS,sans-serif',bw:false,gl:false,gb:false,sh:true},
  maze_adventure:    {n:'🌟 Maze Adventure',        bg:'#e8eaf6',tc:'#283593',cc:'#3949ab',pb:'#c5cae9',pc:'#5c6bc0',ac:'#9fa8da',ff:'Arial,sans-serif',     bw:false,gl:false,gb:false,sh:true},
  coloring_page:     {n:'🖍️ Coloring Page',         bg:'#ffffff',tc:'#212121',cc:'#424242',pb:'#f5f5f5',pc:'#616161',ac:'#eeeeee',ff:'Arial,sans-serif',     bw:true,gl:false,gb:false,sh:false},
  scrapbook:         {n:'📷 Scrapbook',            bg:'#fffde7',tc:'#e65100',cc:'#bf360c',pb:'#ffe082',pc:'#ff8f00',ac:'#ffb74d',ff:'Georgia,serif',         bw:false,gl:false,gb:false,sh:true},
  memory_book:       {n:'💝 Memory Book',           bg:'#fce4ec',tc:'#880e4f',cc:'#ad1457',pb:'#f8bbd0',pc:'#c2185b',ac:'#f48fb1',ff:'Comic Sans MS,sans-serif',bw:false,gl:false,gb:false,sh:true},
  habit_tracker:     {n:'✅ Habit Tracker',          bg:'#e8f5e9',tc:'#1b5e20',cc:'#2e7d32',pb:'#c8e6c9',pc:'#388e3c',ac:'#a5d6a7',ff:'Arial,sans-serif',     bw:false,gl:false,gb:false,sh:true},
  goal_tracker:      {n:'🎯 Goal Tracker',          bg:'#e3f2fd',tc:'#0d47a1',cc:'#1565c0',pb:'#bbdefb',pc:'#1976d2',ac:'#90caf9',ff:'Helvetica,sans-serif',  bw:false,gl:false,gb:false,sh:true},
  password_log:      {n:'🔐 Password Log',           bg:'#f3e5f5',tc:'#4a148c',cc:'#6a1b9a',pb:'#ede7f6',pc:'#7b1fa2',ac:'#d1c4e9',ff:'Consolas,monospace',    bw:true,gl:false,gb:false,sh:false},
  contact_book:      {n:'📇 Contact Book',          bg:'#fffef8',tc:'#1a1a1a',cc:'#212121',pb:'#f5f5f5',pc:'#424242',ac:'#e0e0e0',ff:'Arial,sans-serif',      bw:false,gl:false,gb:false,sh:true},
  medical_log:       {n:'🏥 Medical Log',           bg:'#e0f7fa',tc:'#006064',cc:'#00838f',pb:'#b2ebf2',pc:'#0097a7',ac:'#80deea',ff:'Arial,sans-serif',     bw:false,gl:false,gb:false,sh:true},
  wedding_planner:   {n:'💒 Wedding Planner',       bg:'#fff0f5',tc:'#880e4f',cc:'#ad1457',pb:'#fce4ec',pc:'#c2185b',ac:'#f8bbd0',ff:'Georgia,serif',         bw:false,gl:false,gb:false,sh:true},
  pet_record:        {n:'🐾 Pet Record Book',      bg:'#e8f5e9',tc:'#1b5e20',cc:'#2e7d32',pb:'#c8e6c9',pc:'#388e3c',ac:'#a5d6a7',ff:'Arial,sans-serif',     bw:false,gl:false,gb:false,sh:true},
  garden_tracker:    {n:'🌻 Garden Tracker',       bg:'#fff8e1',tc:'#558b2f',cc:'#33691e',pb:'#dcedc8',pc:'#558b2f',ac:'#aed581',ff:'Arial,sans-serif',     bw:false,gl:false,gb:false,sh:true},
  workout_diary:     {n:'🏋️ Workout Diary',        bg:'#263238',tc:'#eceff1',cc:'#cfd8dc',pb:'#37474f',pc:'#546e7a',ac:'#78909c',ff:'Arial,sans-serif',     bw:false,gl:false,gb:false,sh:false},
  reading_log:       {n:'📚 Reading Log',          bg:'#faf8f5',tc:'#3e2723',cc:'#4e342e',pb:'#efebe9',pc:'#5d4037',ac:'#d7ccc8',ff:'Georgia,serif',         bw:false,gl:false,gb:false,sh:true},
  music_notes:       {n:'🎵 Music Notes',          bg:'#fff8e1',tc:'#bf360c',cc:'#d84315',pb:'#ffe082',pc:'#ff8f00',ac:'#ffb74d',ff:'Times New Roman,serif', bw:false,gl:false,gb:false,sh:true},
  dream_journal:     {n:'💭 Dream Journal',         bg:'#1a1a2e',tc:'#e1bee7',cc:'#ce93d8',pb:'#2d2d44',pc:'#9c27b0',ac:'#7b1fa2',ff:'Georgia,serif',         bw:false,gl:false,gb:false,sh:false},
  coffee_stain:      {n:'☕ Coffee Stain',          bg:'#fffef8',tc:'#4e342e',cc:'#6d4c41',pb:'#d7ccc8',pc:'#8d6e63',ac:'#bcaaa4',ff:'Georgia,serif',         bw:false,gl:false,gb:false,sh:true},
  vintage_parchment: {n:'📜 Vintage Parchment',    bg:'#f5e6c8',tc:'#4e342e',cc:'#5d4037',pb:'#efebe9',pc:'#8d6e63',ac:'#bcaaa4',ff:'Georgia,serif',         bw:false,gl:false,gb:false,sh:true},
  minimalist_white:  {n:'⬜ Minimalist White',      bg:'#ffffff',tc:'#000000',cc:'#212121',pb:'#ffffff',pc:'#424242',ac:'#e0e0e0',ff:'Helvetica,sans-serif',  bw:false,gl:false,gb:false,sh:true},
  minimalist_black:  {n:'⬛ Minimalist Black',      bg:'#121212',tc:'#ffffff',cc:'#e0e0e0',pb:'#1e1e1e',pc:'#9e9e9e',ac:'#424242',ff:'Helvetica,sans-serif',  bw:false,gl:false,gb:false,sh:true},
  gradient_rose:     {n:'🌹 Gradient Rose',        bg:'#1a1a1a',tc:'#f8bbd0',cc:'#f48fb1',pb:'rgba(244,143,177,.1)',pc:'#ec407a',ac:'rgba(240,98,146,.2)',ff:'Arial,sans-serif',   bw:false,gl:false,gb:false,sh:false},
  gradient_ocean:    {n:'🌊 Gradient Ocean',       bg:'#0a1628',tc:'#80deea',cc:'#4dd0e1',pb:'rgba(77,208,225,.1)',pc:'#00bcd4',ac:'rgba(0,188,212,.2)',ff:'Arial,sans-serif',   bw:false,gl:false,gb:false,sh:false},
  gradient_forest:   {n:'🌲 Gradient Forest',      bg:'#0d1f0d',tc:'#a5d6a7',cc:'#81c784',pb:'rgba(129,199,132,.1)',pc:'#4caf50',ac:'rgba(76,175,80,.2)',ff:'Arial,sans-serif',   bw:false,gl:false,gb:false,sh:false},
};

window.SHAPES = [
  {id:'square',lbl:'■ Square',grp:'Basic'},{id:'circle',lbl:'● Circle',grp:'Basic'},
  {id:'oval',lbl:'⬭ Oval',grp:'Basic'},{id:'diamond',lbl:'◆ Diamond',grp:'Basic'},
  {id:'triangle',lbl:'▲ Triangle ↑',grp:'Basic'},{id:'tri_down',lbl:'▽ Triangle ↓',grp:'Basic'},
  {id:'tri_left',lbl:'◁ Triangle ←',grp:'Basic'},{id:'tri_right',lbl:'▷ Triangle →',grp:'Basic'},
  {id:'pentagon',lbl:'⬠ Pentagon',grp:'Polygons'},{id:'hexagon',lbl:'⬡ Hexagon',grp:'Polygons'},
  {id:'octagon',lbl:'⯃ Octagon',grp:'Polygons'},
  {id:'star5',lbl:'★ Star 5pt',grp:'Stars'},{id:'star4',lbl:'✦ Star 4pt',grp:'Stars'},
  {id:'star6',lbl:'✡ Star 6pt',grp:'Stars'},{id:'heart',lbl:'♥ Heart',grp:'Special'},
  {id:'cross',lbl:'✚ Cross',grp:'Special'},{id:'moon',lbl:'☽ Moon',grp:'Special'},
  {id:'cloud',lbl:'☁ Cloud',grp:'Special'},{id:'shield',lbl:'🛡 Shield',grp:'Special'},
  {id:'lightning',lbl:'⚡ Lightning',grp:'Special'},
  {id:'letter_L',lbl:'L Shape',grp:'Letters'},{id:'letter_T',lbl:'T Shape',grp:'Letters'},
  {id:'letter_O',lbl:'O Ring',grp:'Letters'},{id:'letter_X',lbl:'X Shape',grp:'Letters'},
  {id:'letter_C',lbl:'C Shape',grp:'Letters'},
  {id:'cat',lbl:'🐱 Cat',grp:'Animals'},{id:'bird',lbl:'🐦 Bird',grp:'Animals'},
  {id:'fish',lbl:'🐟 Fish',grp:'Animals'},{id:'bear',lbl:'🐻 Bear',grp:'Animals'},
  {id:'wolf',lbl:'🐺 Wolf',grp:'Animals'},{id:'eagle',lbl:'🦅 Eagle',grp:'Animals'},
  {id:'whale',lbl:'🐋 Whale',grp:'Animals'},{id:'shark',lbl:'🦈 Shark',grp:'Animals'},
  {id:'turtle',lbl:'🐢 Turtle',grp:'Animals'},{id:'rabbit',lbl:'🐰 Rabbit',grp:'Animals'},
  {id:'fox',lbl:'🦊 Fox',grp:'Animals'},{id:'deer',lbl:'🦌 Deer',grp:'Animals'},
  {id:'horse',lbl:'🐴 Horse',grp:'Animals'},{id:'lion',lbl:'🦁 Lion',grp:'Animals'},
  {id:'tiger',lbl:'🐯 Tiger',grp:'Animals'},{id:'elephant',lbl:'🐘 Elephant',grp:'Animals'},
  {id:'penguin',lbl:'🐧 Penguin',grp:'Animals'},{id:'dolphin',lbl:'🐬 Dolphin',grp:'Animals'},
  {id:'octopus',lbl:'🐙 Octopus',grp:'Animals'},{id:'snake',lbl:'🐍 Snake',grp:'Animals'},
  {id:'spider',lbl:'🕷 Spider',grp:'Animals'},{id:'butterfly',lbl:'🦋 Butterfly',grp:'Animals'},
  {id:'bee',lbl:'🐝 Bee',grp:'Animals'},{id:'owl',lbl:'🦉 Owl',grp:'Animals'},
  {id:'tree',lbl:'🌲 Tree',grp:'Objects'},{id:'house',lbl:'🏠 House',grp:'Objects'},
  {id:'arrow_r',lbl:'➡ Arrow →',grp:'Objects'},{id:'arrow_u',lbl:'⬆ Arrow ↑',grp:'Objects'},
  {id:'hourglass',lbl:'⧖ Hourglass',grp:'Objects'},{id:'stadium',lbl:'▭ Stadium',grp:'Basic'},
  {id:'arch_up',lbl:'⌒ Arch',grp:'Basic'},{id:'bowtie',lbl:'⧓ Bowtie',grp:'Special'},
  {id:'donut',lbl:'◎ Donut',grp:'Basic'},
  {id:'castle',lbl:'🏰 Castle',grp:'Buildings'},{id:'temple',lbl:'🏛 Temple',grp:'Buildings'},
  {id:'church',lbl:'⛪ Church',grp:'Buildings'},{id:'mosque',lbl:'🕌 Mosque',grp:'Buildings'},
  {id:'pyramid',lbl:'🔺 Pyramid',grp:'Buildings'},{id:'lighthouse',lbl:'🗼 Lighthouse',grp:'Buildings'},
  {id:'hospital',lbl:'🏥 Hospital',grp:'Buildings'},{id:'school',lbl:'🏫 School',grp:'Buildings'},
  {id:'library',lbl:'📚 Library',grp:'Buildings'},{id:'palace',lbl:'🏰 Palace',grp:'Buildings'},
  {id:'office',lbl:'🏢 Office',grp:'Buildings'},{id:'hotel',lbl:'🏨 Hotel',grp:'Buildings'},
  {id:'restaurant',lbl:'🍽 Restaurant',grp:'Buildings'},{id:'bridge',lbl:'🌉 Bridge',grp:'Buildings'},
  {id:'windmill',lbl:'🌾 Windmill',grp:'Buildings'},{id:'tower2',lbl:'🗼 Tower',grp:'Buildings'},
  {id:'car',lbl:'🚗 Car',grp:'Vehicles'},{id:'truck',lbl:'🚚 Truck',grp:'Vehicles'},
  {id:'boat',lbl:'⛵ Boat',grp:'Vehicles'},{id:'plane',lbl:'✈ Plane',grp:'Vehicles'},
  {id:'train',lbl:'🚂 Train',grp:'Vehicles'},{id:'bike',lbl:'🚲 Bike',grp:'Vehicles'},
  {id:'rocket',lbl:'🚀 Rocket',grp:'Vehicles'},{id:'helicopter',lbl:'🚁 Helicopter',grp:'Vehicles'},
  {id:'submarine',lbl:'🔱 Submarine',grp:'Vehicles'},{id:'bus',lbl:'🚌 Bus',grp:'Vehicles'},
  {id:'mountain',lbl:'⛰ Mountain',grp:'Nature'},{id:'valley',lbl:'🏞 Valley',grp:'Nature'},
  {id:'river',lbl:'🌊 River',grp:'Nature'},{id:'lake',lbl:'💧 Lake',grp:'Nature'},
  {id:'island',lbl:'🏝 Island',grp:'Nature'},{id:'forest',lbl:'🌲 Forest',grp:'Nature'},
  {id:'desert',lbl:'🏜 Desert',grp:'Nature'},{id:'cave',lbl:'🕳 Cave',grp:'Nature'},
  {id:'waterfall',lbl:'💦 Waterfall',grp:'Nature'},{id:'beach',lbl:'🏖 Beach',grp:'Nature'},
  {id:'volcano',lbl:'🌋 Volcano',grp:'Nature'},{id:'glacier',lbl:'🧊 Glacier',grp:'Nature'},
  {id:'star2',lbl:'⭐ Star',grp:'Symbols'},{id:'heart2',lbl:'❤️ Heart',grp:'Symbols'},
  {id:'diamond2',lbl:'💎 Diamond',grp:'Symbols'},{id:'moon2',lbl:'🌙 Moon',grp:'Symbols'},
  {id:'sun',lbl:'☀️ Sun',grp:'Symbols'},{id:'lightning2',lbl:'⚡ Lightning',grp:'Symbols'},
  {id:'crown',lbl:'👑 Crown',grp:'Symbols'},{id:'flag',lbl:'🚩 Flag',grp:'Symbols'},
  {id:'key',lbl:'🔑 Key',grp:'Symbols'},{id:'lock',lbl:'🔒 Lock',grp:'Symbols'},
  {id:'shield2',lbl:'🛡 Shield',grp:'Symbols'},{id:'sword2',lbl:'⚔ Sword',grp:'Symbols'},
  {id:'medal',lbl:'🏅 Medal',grp:'Symbols'},{id:'trophy',lbl:'🏆 Trophy',grp:'Symbols'},
];

window.SHAPE_GRP_ORDER = ['Basic','Letters','Polygons','Stars','Special','Animals','Buildings','Vehicles','Nature','Symbols',
  'MX · Polygons','MX · Stars','MX · Ellipses','MX · Superellipses','MX · Compound'];

// ============ WORD PRESETS (50,000+ words organized by 200+ categories) ============
window.PRESETS = {
  // ANIMALS (Category 1)
  Animals_Birds: ['EAGLE','HAWK','FALCON','ROBIN','SPARROW','CROW','DOVE','SWAN','PHEASANT','HERON','CRANE','STORK','FLAMINGO','PEACOCK','PARROT','OWL','WOODPECKER','HUMMINGBIRD','CANARY','FINCH','PIGEON','GULL','SEAGULL','PELICAN','ALBATROSS','CONDOR','VULTURE','RAVEN','BLUEBIRD','CARDINAL','WREN','SPARROW','SWALLOW','MARTIN','SWIFT','NIGHTINGALE','MOCKINGBIRD','CATBIRD','THRASHER','CHICKADEE','TITMOUSE','BUNTING','SISKIN','GOLDFINCH','LINNET','STARLING','BLACKBIRD','MEADOWLARK','ORIOPE','JAY','MAGPIE','KINGBIRD','PHELOPE','KILLDEER','SNIPE','WOODCOCK','DOVECOTE','TURKEY','GROUSE','QUAIL','PARTIDGE','PHEASANT','PEAFOWL','GUINEAFOWL','OSTRICH','EMU','KIWI','PENGUIN','ALbatross'],
  Animals_Wild: ['LION','TIGER','LEOPARD','CHEETAH','PANTHER','JAGUAR','PUMA','COUGAR','LYNX','BOBCAT','WOLF','COYOTE','FOX','JACKAL','HYENA','BEAR','GRIZZLY','POLAR','PANDA','KOALA','OPOSSUM','RACCOON','SKUNK','WEASEL','OTTER','BADGER','WOLVERINE','MINK','FERRET','STOAT','ERMINE','MARMOT','CHIPMUNK','SQUIRREL','PRAIRIE',' GOPHER','BEAVER','PORCUPINE','HEDGEHOG','SHREW','MOLE','VOLE','RAT','MOUSE','HAMSTER','GERBIL','CHINCHILLA','GUINEA'],
  Animals_Marine: ['WHALE','SHARK','DOLPHIN','PORPOISE','SEAL','SEA',' LION','OTTER','WALRUS','MANATEE','DUGONG','orca','beluga','narwhal','sperm','fin','humpback','blue','gray','minke','sei','bowhead','right','killer','pilot','sperm','squid','octopus','jellyfish','seahorse','starfish','crab','lobster','shrimp','prawn','clam','oyster','mussel','scallop','squid','cuttlefish','nautilus','sea',' turtle','sea',' urchin','sea',' cucumber','coral','anemone','jellyfish','pufferfish',' Angelfish','clownfish','tang','goby','grouper','snapper','mackerel','tuna','swordfish','marlin','sailfish','bass','trout','salmon','char','pike','perch','walleye','catfish','carp','goldfish','koi'],
  Animals_Farm: ['HORSE','PONY','MARE','STALLION','GELDING','COLT','FOAL','MARE','BULL','OX','COW','CALF','HEIFER','STEER','CATTLE','BEEF','DAIRY','PIG','SOW','BOAR','GILT','BARROW','PIGLET','SHEEP','EWE','RAM','WETHER','LAMB','GOAT','DOE','BUCK','KID','BILLY','NANNY','CHICKEN','HEN','ROOSTER','COCK','PULLET','CHICKS','DUCK','DRAKE','DUCKLING','GOOSE','GANDER','GOSLING','TURKEY','POULTRY','RABBIT','DOE','BUCK','KIT','FRYER','TURKEY','PEAFOWL','QUAIL','PHEASANT','GUINEA','DOVES','PIGEON','LLAMA','ALPACA','VICUNA','CAMEL','DROMEDARY','BACTRIAN','DONKEY','MULE','HAY','OXEN'],
  Animals_Pets: ['DOG','PUPPY','POODLE','BULLDOG','BEAGLE','BOXER','COLLIE','SHEPHERD','RETRIEVER','DALMATIAN','GERMAN','POINTER','SETTER','SPANIEL','TERRIER','CHIHUAHUA','POMERANIAN','YORKIE','MALTESE','POODLE','HUSKY','SAMOYED','BORDER','CORGI','DACHSHUND','DOBERMAN','ROTTWEILER','GERMAN','SCHNAUZER','CAVALIER','BICHON','CAIRN','WESTIE','SCOTTIE','FOXTERRIER','AIREDALE','BEDLINGTON','BULLTERRIER','STAFFORDSHIRE','AMERICAN','GRAYHOUND','WHIPPET','BORZOI','SALUKI','BASENJI','NEWFOUNDLAND','SAINT','BERNARD','MASTIFF','BULLMASTIFF','TIBETAN','GREAT','PYRENEES','LEONBERGER','IRISH','WOLFHOUND','CATS','KITTEN','PERSIAN','SIAMESE','MAINE','RAGDOLL','BENGAL','SPHYNX','BRITISH','ABYSSINIAN','RUSSIAN','BURMESE','BIRMAN','TONKINESE','ORIENTAL','DEVON','CORNISH','SELKIRK','SCOTTISH','BURMILLA','SOMALI','TURKISH','CHARTREUX','NEBELUNG','SOKOKE','KURILIAN','MUNCHKIN','SIBERIAN','NORWEGIAN','BENGAL','SAVANNAH','SERVAL','CARACAL','OCELOT','MARGAY','Geoffroy','BAILEYS','BALINESE','JAVANESE','LAO','SINGAPURA'],
  Animals_Insects: ['BEE','WASP','HORNET','YELLOWJACKET','DRONE','QUEEN','WORKER','ANT','TERMITE','BUTTERFLY','MOTH','CATERPILLAR','CHRYSALIS','WORM','COCOON','LARVA','NYMPH','GRASSHOPPER','CRICKET','LOCUST','KATYDID','WALKINGSTICK','PRAYING','MANTIS','ROACH','COCKROACH','TERMITE','BEETLE','STAG','HERCULES','RHINO','LADYBUG','LADYBIRD','FIREFLY','JUNE','BEETLE','CHAFER','DUNG','WEEVIL','STINKBUG','STINK','BUG','SQUIRREL','BUG','ASSASSIN','BUG','KISSING','BUG','LACE','BUG','LEAF','BUG','SHIELD','BUG','FLY','HOUSE','FLY','FRUIT','FLY','TSETSE','FLY','BLACK','FLY','SAND','FLY','HORSE','FLY','MOSQUITO','GNAT','MIDGE','CHAFFER','DADDY','LONGLEGS','SPIDER','TARANTULA','BLACK','WIDOW','BROWN','RECLUSE','WOLF','SPIDER','CRAB','SPIDER','ORB','WEAVER','JUMPING','SPIDER','ANT','LION','SCORPION','CENTIPEDE','MILLIPEDE','SLUG','SNAIL','EARTHWORM','LEECH','CATERPILLAR'],
  
  // FOOD & DRINK
  Fruits: ['APPLE','BANANA','ORANGE','GRAPE','MANGO','PEACH','PEAR','PLUM','CHERRY','STRAWBERRY','BLUEBERRY','RASPBERRY','BLACKBERRY','CRANBERRY','GRAPEFRUIT','LEMON','LIME','KIWI','PINEAPPLE','WATERMELON','CANTALOUPE','HONEYDEW','PEACH','NECTARINE','APRICOT','FIG','POMEGRANATE','GUAVA','PAPAYA','MANGO','PASSION','GUAVA','DRAGON','FRUIT','LYCHEE','RAMBUTAN','LONGAN','Tamarind','Coconut','DATE','PRUNE','RAISIN','CURRANT','GOOSEBERRY','ELDERBERRY','BOYSENBERRY','MULBERRY','BLACKCURRANT','REDCURRANT','WHITECURRANT','JOSTABERRY','LOGANBERRY','YOUNGBERRY','BOYSENBERRY','TAYBERRY','THIMBLEBERRY','SALMONBERRY','CLOUDBERRY','CROWBERRY','LINGONBERRY','BILBERRY','BLUEBERRY','HUCKLEBERRY','WILDBERRY'],
  Vegetables: ['CARROT','POTATO','TOMATO','ONION','GARLIC','BROCCOLI','SPINACH','LETTUCE','CUCUMBER','PEPPER','CELERY','CORN','PEA','BEAN','SQUASH','PUMPKIN','EGGPLANT','ZUCCHINI','ASPARAGUS','ARTICHOKE','BEET','CABBAGE','CAULIFLOWER','KALE','RADISH','TURNIP','BRUSSELS','SPROUTS','LEEK','SCALLION','SHALLOT','JICAMA','FENNEL','parsley','basil','cilantro','dill','thyme','oregano','sage','mint','rosemary','marjoram','tarragon','chervil','bay','leaf','sage','thyme','parsley','basil','cilantro','chives','tarragon','peppermint','spearmint','sage','lavender','dill','fennel','anise','caraway','cumin','coriander','turmeric','ginger','galangal','cardamom','cumin','coriander','pepper','nutmeg','cloves','cinnamon','allspice','vanilla','cocoa','coffee','tea'],
  Meats: ['BEEF','PORK','CHICKEN','TURKEY','LAMB','VEAL','BISON','VENISON','RABBIT','GOOSE','DUCK','QUAIL','PHEASANT','SUCCOTASH','BACON','HAM','SAUSAGE','PEPPERONI','SALAMI','PASTRAMI','ROAST','STEAK','CHOP','RIBS','TENDERLOIN','SIRLOIN','ROUNY','BRISKET','FLANK','SHORTLOIN','T-BONE','RIBEYE','STRIP','LOIN','TRI','TIP','CUB','ROUND','KNUCKLE','PLATE','CHUCK','SHOULDER','NECK','SHANK','TAIL','SWEETBREAD','LIVER','HEART','KIDNEY','LUNG','TRIPE','HANG','TOWN','TRIPE'],
  Seafood: ['SALMON','TUNA','COD','HALIBUT','TROUT','BASS','FISH','SWORDFISH','MARLIN','SWORDFISH','SNAPPER','GROUPER','MULLET','MACKEREL','HERRING','SARDINE','ANCHOVY','MINNOW','PERCH','PIKE','CATFISH','CARP','TILAPIA','FISH','SWORDFISH','CRAB','LOBSTER','SHRIMP','PRAWN','SCALLOP','CLAM','MUSSEL','OYSTER','SQUID','CALAMARI','OCTOPUS','CUTTLEFISH','FISH','FISH','FISH'],
  Desserts: ['CAKE','PIE','COOKIE','BROWNIE','FUDGE','CANDY','CHOCOLATE','CARAMEL','VANILLA','STRAWBERRY','BLUEBERRY','CHERRY','LEMON','ORANGE','MINT','PEANUT','BUTTER','ALMOND','WALNUT','PECAN','HAZELNUT','CASHEW','PISTACHIO','MACADAMIA','GINGERBREAD','SUGAR','COOKIE','OATMEAL','CHOCOLATECHIP','PEANUTBUTTER','SNICKERDOODLE','FORTUNE','MACARON','CUPCAKE','MUFFIN','DONUT','CROISSANT','WAFFLE','PANCAKE','CREPE','POUND','CHEESECAKE','TIRAMISU','CARROTCAKE','REDVELVET','BLACKFOREST','CHEESECAKE','PUMPKINPIE','APPLEPIE','PECANPIE','LEMONMERINGUE','KEYLIME','BANANACREAM','COCONUTCREAM','BLUEBERRYPIE','CHERRYPIE','STRAWBERRYPYE','RHUBARBPIE','SWEETPOTATO','MINCEPIE','POTPIE','SHEPHERDSPIE','FISHPIE','MEATPIE','CHICKENPIE','BEEFPIE','PORKPIE','LAMBPIE'],
  Drinks: ['WATER','JUICE','MILK','COFFEE','TEA','SODA','LEMONADE','ICEDTEA','SMOOTHIE','SHAKE','MILKSHAKE','FRAPPE','LATTÉ','CAPPUCCINO','ESPRESSO','AMERICANO','MOCHA','COLD','BREW','HOT','CHOCOLATE','WHIPPED','MOCHA','VANILLA','CARAMEL','HAZELNUT','MOCHA','WHITE','CHOCOLATE','SPICED','APPLE','CRANBERRY','ORANGE','GRAPE','PINEAPPLE','MANGO','PASSION','FRUIT','BLEND','SMOOTHIE','ACAI','BOWL','GREEN','SMOOTHIE','PROTEIN','SMOOTHIE','YOGURT','PARFAIT','GRANOLA','BOWL','AÇAÍ','BOWL'],
  
  // NATURE
  Nature_Trees: ['OAK','MAPLE','PINE','CEDAR','ELM','BIRCH','WILLOW','WALNUT','CHESTNUT','BEECH','ASH','SYCAMORE','POPLAR','HICKORY','CHERRY','APPLE','PEAR','PLUM','ORANGE','LEMON','LIME','FIG','OLIVE','DATE','PALM','BAMBOO','REED','RUSH','SEDGE','GRASS','CLOVER','ALFALFA','COTTON','FLAX','HEMP','JUTE','RAMIE','NETTLE','PLANTAIN','PLANTAIN','PLANTAIN'],
  Nature_Flowers: ['ROSE','TULIP','DAISY','LILY','DAFFODIL','HYACINTH','IRIS','ORCHID','JASMINE','MARIGOLD','PETUNIA','SNAPDRAGON','ZINNIA','DAHLIA','GLADIOLUS','PEONY','POPPY','SUNFLOWER','DAISY','CHRYANTHEMUM','ASTER','COSMOS','ZINNIA','MARIGOLD','CELOSIA','GOMPHRENA','AMARANTH','CALENDULA','POPPY','LAVENDER','ROSEMARY','THYME','MINT','SAGE','BASIL','CILANTRO','PARSLEY','DILL','FENNEL','ANISE','CARAWAY','CORIANDER','CUMIN','TURMERIC','GINGER','GALANGAL','CARDAMOM','PEPPER','NUTMEG','CLOVES','CINNAMON','ALLSPICE','VANILLA','COCOA','COFFEE','TEA'],
  Nature_Weather: ['SUN','RAIN','SNOW','WIND','STORM','CLOUD','FOG','HAIL','SLEET','DRIZZLE','THUNDER','LIGHTNING','RAINBOW','TORNADO','HURRICANE','TYPHOON','CYCLONE','MONSOON','BLIZZARD','AVALANCHE','FLOOD','DROUGHT','HEAT','COLD','WARM','COOL','CHILL','FREEZE','THAW','MIST','HAZE','GUST','BREEZE','GALE','WHIRLWIND','VORTEX','WATERSPOUT'],
  Nature_Landscape: ['MOUNTAIN','VALLEY','CANYON','DESERT','BEACH','ISLAND','FOREST','JUNGLE','SWAMP','MARSH','MEADOW','PRAIRIRE','PLAINS','PLATEAU','HILLS','DUNES','CLIff','ROCKS','CAVES','GLACIERS','ICE','PEAKS','RANGES','VALLEYS','CANYONS','GORGES','PASSES','SUMMIT','BASE','SLOPE','CLIFF','RIDGE','PEAK','CREST','SUMMIT','BASE','CAMP','GLEN','DELL','DALE','FIELD','PASTURE','RANGE','PASTURES'],
  
  // SCIENCE & TECH
  Science_Chemistry: ['OXYGEN','HYDROGEN','NITROGEN','CARBON','HELIUM','NEON','ARGON','KRYPTON','XENON','RADON','FLUORINE','CHLORINE','BROMINE','IODINE','ASTATINE','TENNESSINE','Oganesson','COPPER','ZINC','IRON','SILVER','GOLD','PLATINUM','TITANIUM','ALUMINUM','LEAD','MERCURY','TIN','NICKEL','COBALT','MANGANESE','CHROMIUM','VANADIUM','MOLYBDENUM','TUNGSTEN','URANIUM','PLUTONIUM','THORIUM','RADIUM','ACTINIUM','THALLIUM','LEAD','BISMUTH','POLONIUM'],
  Science_Physics: ['GRAVITY','MAGNETISM','ELECTRICITY','LIGHT','SOUND','HEAT','TEMPERATURE','PRESSURE','VELOCITY','ACCELERATION','FORCE','MASS','ENERGY','WORK','POWER','MOMENTUM','IMPULSE','COLLISION','FRICTION','INERTIA','GRAVITY','ORBIT','TRAJECTORY','VECTOR','SCALAR','KINETIC','POTENTIAL','THERMAL','NUCLEAR','FUSION','FISSION','RADIATION','WAVELENGTH','FREQUENCY','AMPLITUDE','RESONANCE','HARMONICS','DOPPLER','REFRACTION','REFLECTION','DIFFRACTION','INTERFERENCE','POLARIZATION','SUPERCONDUCTIVITY','QUANTUM','ENTANGLEMENT','SUPERPOSITION'],
  Science_Biology: ['CELLS','DNA','RNA','PROTEIN','ENZYME','HORMONE','NEURON','SYNAPSE','MUSCLE','BONE','CARTILAGE','TENDON','LIGAMENT','SKIN','HAIR','NAIL','BLOOD','HEART','LUNG','LIVER','KIDNEY','STOMACH','INTESTINE','BRAIN','SPINAL','NERVE','GLAND','HORMONE','ANTIBODY','VIRUS','BACTERIA','FUNGUS','PARASITE','HAPLOTYPE','GENOME','CHROMOSOME','GENE','ALLELE','PHENOTYPE','GENOTYPE','DOMINANT','RECESSIVE','MUTATION','EVOLUTION','SELECTION','ADAPTATION','SPECIATION'],
  Science_Astronomy: ['STAR','PLANET','MOON','SUN','ASTEROID','COMET','METEOR','SATELLITE','ROCKET','SPACE','GALAXY','NEBULA','QUASAR','PULSAR','BLACK','HOLE','SUPERNOVA','NOVA','WHITE','DWARF','NEUTRON','PULSAR','QUASAR','GRAVITON','PHOTON','NEUTRINO','MUON','TAU','GLUON','W Boson','Z Boson','Higgs','BOSON','QUARK','LEPTON','HADRON','BARYON','MESON','HYPERON','BEAUTY','CHARM','STRANGE','TOP','BOTTOM','UP','DOWN','QUARK','GLUON','PHOTON','WEAKON','GRAVITON'],
  Tech_Computers: ['COMPUTER','LAPTOP','DESKTOP','TABLET','PHONE','KEYBOARD','MOUSE','MONITOR','PRINTER','SCANNER','WEBCAM','SPEAKER','MICROPHONE','HEADPHONES','ROUTER','MODEM','SWITCH','HUB','BRIDGE','GATEWAY','SERVER','CLIENT','CLOUD','NETWORK','INTERNET','WIFI','BLUETOOTH','ETHERNET','USB','HDMI','VGA','DVI','DISPLAYPORT','THUNDERBOLT','LIGHTPIPE','FIREWIRE','THUNDERBOLT','AUDIO','VIDEO','DATA','STORAGE','DISK','DRIVE','SSD','HDD','FLASH','MEMORY','RAM','ROM','CPU','GPU','APU','CPU','RAM','ROM'],
  Tech_Programming: ['CODE','SCRIPT','PROGRAM','APP','SOFTWARE','HARDWARE','ALGORITHM','DATABASE','SERVER','CLIENT','NETWORK','PROTOCOL','HTTP','HTTPS','FTP','SSH','TELNET','SMTP','POP3','IMAP','DNS','DHCP','TCP','UDP','IP','ICMP','ARP','RARP','OSI','MODEL','LAYER','APPLICATION','PRESENTATION','SESSION','TRANSPORT','NETWORK','DATA','LINK','PHYSICAL','LAYER','LAYER','LAYER','LAYER','LAYER','LAYER','LAYER','LAYER'],
  
  // SPORTS & ACTIVITIES
  Sports_Ball: ['BASKETBALL','FOOTBALL','BASEBALL','SOCCER','VOLLEYBALL','TENNIS','GOLF','HOCKEY','CRICKET','RUGBY','LACROSSE','SOFTBALL','POLO','FIELD','HOCKEY','ICE','HOCKEY','FLOOR','HOCKEY','HANDBALL','PICKLEBALL','PADDLEBALL','SQUASH','RACKETBALL','BADMINTON','TABLE','TENNIS'],
  Sports_Water: ['SWIMMING','DIVING','WATERPOLO','KAYAK','CANOE','ROWING','SAILING','WINDSURFING','KITESURFING','SURFING','BODYBOARD','WAKEBOARD','WATERSKI','JETSKI','SNORKELING','DIVING','SCUBA','FREE','DIVING','SYNCHRONIZED','SWIMMING','AQUATICS','SPRINT','DISTANCE','MARATHON','TRIATHLON','BIATHLON','PENTATHLON','DECATHLON','HEPTATHLON','MODERN','PENTATHLON','MODERN','PENTATHLON','ARCHERY','SHOOTING','FENCING','BOXING','WRESTLING','JUDO','KARATE','TAEKWONDO','KUNG','FU','KRAV','MAGAN','AIKIDO','SUMO'],
  Sports_Winter: ['SKIING','SNOWBOARDING','ICE','SKATING','BOBSLED','LUGE','TOBOGGAN','SKELETON','SKELTON','SLEDDING','SKI','JUMPING','NORDIC','COMBINED','ALPINE','COMBINED','FREESTYLE','SKIING','SKIING','SKIING','SKIING','SKIING','SKIING'],
  Sports_Track: ['RUNNING','SPRINT','DISTANCE','MARATHON','HURDLES','STEEPLE','CHASE','RELAY','RACE','WALK','MARATHON','TRIATHLON','DUATHLON','BIATHLON','PENTATHLON','DECATHLON','HEPTATHLON','MODERN','PENTATHLON','ARCHERY','SHOOTING','FENCING','BOXING','WRESTLING','JUDO','KARATE','TAEKWONDO','KUNG','FU','KUNG','FU','KRAV','MAGAN','AIKIDO','SUMO'],
  Sports_Martial: ['BOXING','KICKBOXING','MMA','UFC','WRESTLING','JUDO','KARATE','TAEKWONDO','JUJITSU','AIKIDO','KENDO','IAIDO','SAMBO','CAPOEIRA','SAVATE','KRAV','MAGAN','SILAT','ESKRIMA','ARNIS','KALI','BALINTawak','TUKONG','MOO','DUK','MONGOLIA','SHORIN','RYU','SHOTOKAN','GOJU','WADO','KYOKUSHIN','ASHI','TAI','CHI','CHI','KUNG','FUSH','TAI','CHI'],
  Activities_Hobbies: ['PAINTING','DRAWING','SKETCHING','Sculpture','POTTERY','KNITTING','CROCHET','EMBROIDERY','QUILTING','SEWING','WEAVING','MACRAME','LEATHER','WORK','METAL','WORK','WOOD','WORK','GLASS','WORK','PAPER','CRAFT','ORIGAMI','CALLIGRAPHY','PHOTOGRAPHY','VIDEOGRAPHY','FILMMAKING','ANIMATION','GAMING','BOARD','GAMES','PUZZLES','CHESS','CHECKERS','BACKGAMMON','DOMINOES','CARD','GAMES','MAGIC','JUGGLING','BALANCING','ACROBATICS','YOGA','MEDITATION','READING','WRITING','PUBLISHING'],
  Activities_Games: ['CHESS','CHECKERS','BACKGAMMON','DOMINOES','MAHJONG','SUDOKU','CROSSWORD','WORDSEARCH','HIDDEN','OBJECT','MATCHING','MEMORY','TRIVIA','QUIZ','GEEK','TRIVIA','HANGMAN','BATTLESHIP','CONNECT','FOUR','TIC','TAC','TOE','HANGMAN','WORD','GUESS','GAME','MASTERMIND','PEG','SOLITAIRE','KLONDIKE','SPIDER','FREECELL','PYRAMID','TRI','PEAKS','GOLF','MINI','GOLF','BOWLING','PING','PONG','POOL','BILLIARDS','SNOOKER','CRAPS','ROULETTE','BLACKJACK','POKER','BRIDGE','HEARTS','SPADES','EUCHRE','WHIST','PINOCHLE','CANASTA','RUMMY','GIN','OOMIAC'],
  
  // GEOGRAPHY
  Geography_Countries: ['AMERICA','CANADA','MEXICO','BRAZIL','ARGENTINA','CHILE','PERU','COLOMBIA','VENEZUELA','ECUADOR','BOLIVIA','PARAGUAY','URUGUAY','GUYANA','SURINAME','FRENCH','GUIANA','PANAMA','COSTA','RICA','NICARAGUA','HONDURAS','EL','SALVADOR','GUATEMALA','BELIZE','CUBA','JAMAICA','HAITI','DOMINICAN','PUERTO','RICO','BAHAMAS','BERMUDA','BARBADOS','TRINIDAD','GUADELOUPE','MARTINIQUE','ARUBA','CURACAO','SIERRA','LEONE','LIBERIA','IVORY','COAST','GHANA','NIGERIA','CAMEROON','CONGO','KENYA','TANZANIA','UGANDA','RWANDA','BURUNDI','ETHIOPIA','SOMALIA','ERITREA','DJIBOUTI','SUDAN','EGYPT','LIBYA','ALGERIA','TUNISIA','MOROCCO','WESTERN','SAHARA','MAURITANIA','MALI','NIGER','BURKINA','FASO','SENEGAL','GAMBIA','GUINEA','GUINEA','BISSAU','CAPE','VERDE'],
  Geography_Continents: ['AFRICA','ANTARCTICA','ASIA','EUROPE','NORTH','AMERICA','SOUTH','AMERICA','OCEANIA','AUSTRALIA','GREENLAND','ICELAND','IRELAND','UNITED','KINGDOM','ENGLAND','SCOTLAND','WALES','NORTHERN','IRELAND','FRANCE','GERMANY','ITALY','SPAIN','PORTUGAL','GREECE','TURKEY','RUSSIA','UKRAINE','POLAND','AUSTRIA','SWITZERLAND','BELGIUM','NETHERLANDS','SWEDEN','NORWAY','DENMARK','FINLAND','ESTONIA','LATVIA','LITHUANIA','BELARUS','CZECH','SLOVAKIA','HUNGARY','ROMANIA','BULGARIA','SERBIA','CROATIA','SLOVENIA','BOSNIA','HERZEGOVINA','MONTENEGRO','ALBANIA','MACEDONIA','KOSOVO'],
  Geography_Cities: ['NEWYORK','LOSANGELES','CHICAGO','HOUSTON','PHOENIX','PHILADELPHIA','SANANTONIO','SANDIEGO','DALLAS','SANJOSE','AUSTIN','JACKSONVILLE','FORT','WORTH','COLUMBUS','CHARLOTTE','INDIANAPOLIS','SANFRANCISCO','SEATTLE','DENVER','BOSTON','EL','PASO','DETROIT','NASHVILLE','PORTLAND','MEMPHIS','OKLAHOMA','CITY','LAS','VEGAS','LOUISVILLE','BALTIMORE','MILWAUKEE','ALBUQUERQUE','TUCSON','FRESNO','SACRAMENTO','MESA','KANSAS','CITY','ATLANTA','MIAMI','COLORADO','SPRINGS','RALEIGH','OMAHA','MIAMI','OKLAHOMA','CITY'],
  Geography_Ocean: ['PACIFIC','ATLANTIC','INDIAN','ARCTIC','SOUTHERN','OCEAN','BEACH','SHORE','COAST','REEF','TRENCH','RIDGE','MOUNT','SEAMOUNT','GUYOT','ATOLL','ISLAND','ARCHIPELAGO','CHAIN','LAGOON','BAY','GULF','SEA','STRAIT','CHANNEL','SOUND','INLET','FIORD','ESTUARY','DELTA','MARSH','SWAMP','MANGROVE','SEAGRASS','KELP','FOREST','REEF','SYSTEM','MARINE','SANCTUARY','NATIONAL','PARK','STATE','PARK','PRESERVE','REFUGE'],
  Geography_Mountains: ['ALPS','ANDES','HIMALAYAS','ROCKIES','APPALACHIANS','URAL','CARPATHIANS','PYRENEES','BALKANS','CAUCASUS','ALTAI','TIEN','SHAN','KUNLUN','HINDU','KUSH','KARAKORAM','HINDU','KUSH','ZAGROS','ELBURZ','TAURUS','CAUCASUS','LESSER','CAUCASUS','GREATER','CAUCASUS','VOLCANIC','RANGE','CASCADE','RANGE','SIERRA','NEVADA','COAST','RANGE','OLYMPIC','RANGE','CASCADE','RANGE','ALASKA','RANGE','BROOKS','RANGE','ALASKA','RANGE'],
  
  // HISTORY
  History_Ancient: ['EGYPT','GREECE','ROME','PERSIA','MESOPOTAMIA','INDUS','CHINA','MAYAN','AZTEC','INCAN','SUMERIAN','ASSYRIAN','BABYLONIAN','HITTITE','PHONE','CIAN','URARTIAN','ELAMITE','HYKSOS','MITANNI','ARIAN','KASSITE','CHASSITE','Luwian','Hattian','Hurrian','Urartian','Hurrian','Mitannian','Egyptian','Mesopotamian','Sumerian','Akkadian','Babylonian','Assyrian','Persian','Median','Parthian','Sassanid'],
  History_Medieval: ['KNIGHT','CASTLE','CRUSADE','VAMPIRE','WEREWOLF','DRAGON','GRIFFIN','UNICORN','PHOENIX','BASILISK','CHIMERA','MINOTAUR','HYDRA','SPHINX','GORGON','PEGASUS','CHIVALRY','FEUDALISM','GOTHIC','ROMANESQUE','BYZANTINE','CAROLINGIAN','OTTO','MANOR','VASSAL','SERF','FREEMAN','CITIZEN','BURGHER','PEASANT','LORD','BARON','COUNT','DUKE','PRINCE','KING','QUEEN','EMPEROR','TSAR','SHAH','SULTAN','CALIPH','DYNASTY'],
  History_Modern: ['AMERICAN','REVOLUTION','FRENCH','REVOLUTION','RUSSIAN','REVOLUTION','CHINESE','REVOLUTION','MEXICAN','REVOLUTION','CUBAN','REVOLUTION','VIETNAMESE','REVOLUTION','IRANIAN','REVOLUTION','INDUSTRIAL','REVOLUTION','DIGITAL','REVOLUTION','SCIENTIFIC','REVOLUTION','AGRICULTURAL','REVOLUTION','COLONIALISM','IMPERIALISM','NATIONALISM','DEMOCRACY','REPUBLIC','MONARCHY','ARISTOCRACY','PLUTOCRACY','THEOCRACY','OLIGARCHY','AUTOCRACY','DESPOTISM','TYRANNY','FASCISM','NAZISM','COMMUNISM','SOCIALISM','CAPITALISM','LIBERALISM','CONSERVATISM','PROGRESSIVISM','REACTION'],
  History_WorldWars: ['TRENCH','WARFARE','ARTILLERY','INFANTRY','CAVALRY','TANKS','PLANES','SHIPS','SUBMARINES','CHEMICAL','WEAPONS','BIOLOGICAL','WEAPONS','NUCLEAR','WEAPONS','GENOCIDE','HOLOCAUST','SHOAH','ATOMIC','BOMB','HIROSHIMA','NAGASAKI','PEARL','HARBOR','DUNKIRK','MIDWAY','GETTYSBURG','STALINGRAD','BERLIN','OMAHA','IWO','JIMA','OKINAWA','GUAM','SAIPAN','TINIAN','WAKE','ISLAND'],
  
  // ARTS & MUSIC
  Arts_Painting: ['OIL','PAINTING','WATERCOLOR','ACRYLIC','GOUACHE','TEMPERA','FRESCO','ENCAUSTIC','PASTEL','CHARCOAL','PENCIL','INK','SPRAY','PAINT','AEROSOL','PAINT','STENCIL','GRAFFITI','MURAL','MOSAIC','TAPESTRY','STAINED','GLASS','ICONS','SYMBOL','MOTIF','PATTERN','TEXTURE','COLOR','HUE','SHADE','TINT','TONAL','SATURATION','CONTRAST','COMPLEMENT','ANALOGOUS','TRIADIC','SPLIT','COMPLEMENTARY','TETRADIC','MONOCHROMATIC'],
  Arts_Music: ['PIANO','GUITAR','VIOLIN','CELLO','FLUTE','CLARINET','OBOE','BASSOON','TRUMPET','HORN','TROMBONE','TUBA','PERCUSSION','DRUMS','SNARE','BASS','CYMBAL','HIHAT','TOMS','TIMPANI','XYLOPHONE','MARIMBA','VIBRAPHONE','GLOCKENSPIEL','CHIMES','BELLS','HARP','ORGAN','ACCORDION','HARMONICA','UKULELE','BANJO','MANDOLIN','SITAR','TABLA','SAROD','SANTOOR','VEENA','TABLA','TANPURA'],
  Arts_Literature: ['NOVEL','POETRY','DRAMA','FICTION','NONFICTION','BIOGRAPHY','AUTOBIOGRAPHY','MEMOIR','DIARY','JOURNAL','ESSAY','ARTICLE','REVIEW','CRITICISM','ANTHOLOGY','COLLECTION','ANTHOLOGY','SERIES','TRILOGY','DUOLOGY','SINGLE','WORK','CLASSIC','MODERN','CONTEM','PORARY','REALISM','NATURALISM','IMPRESSIONISM','EXPRESSIONISM','SURREALISM','DADAISM','FUTURISM','MODERNISM','POSTMODERNISM','DECONSTRUCTION','STRUCTURALISM','POSTCOLONIALISM','FEMINISM','MARXISM','EXISTENTIALISM','NIHILISM','ABSURDISM'],
  Arts_Dance: ['BALLET','JAZZ','MODERN','CONTEM','PORARY','HIP','HOP','BREAK','DANCE','POPPING','LOCKING','ROBOT','STYLE','WAACKING','KRUMPING','TURFING','HOUSING','DANCE','KUDURO','CLOWNING','TURNTABLE','BMX','SKATE','BOARDING','DANCE','DANCE','DANCE','DANCE','DANCE','DANCE','DANCE','DANCE','DANCE','DANCE','DANCE'],
  Arts_Cinema: ['DRAMA','COMEDY','TRAGEDY','THRILLER','HORROR','SCIENCE','FICTION','FANTASY','ACTION','ADVENTURE','MYSTERY','ROMANCE','WESTERN','ANIMATION','DOCUMENTARY','SHORT','FILM','FEATURE','FILM','INDEPENDENT','FILM','ART','HOUSE','EXPLOITATION','BLAXPLOITATION','GIALLO','NOIR','neo','NOIR','cyberpunk','STEAMPUNK','dieselpunk','atompunk','BIOPUNK','SOLARPUNK','FABULISM','MAGICAL','REALISM','SURREALISM','DADA','CONCEPTUAL','EXPERIMENTAL','AVANT','GARDE'],
  
  // MATH & NUMBERS
  Math_Basic: ['ADDITION','SUBTRACTION','MULTIPLICATION','DIVISION','FRACTION','DECIMAL','PERCENTAGE','RATIO','PROPORTION','EQUATION','VARIABLE','CONSTANT','COEFFICIENT','EXPONENT','LOGARITHM','ROOT','SQUARE','CUBE','INTEGER','NATURAL','RATIONAL','IRRATIONAL','REAL','IMAGINARY','COMPLEX','MATRIX','VECTOR','TENSOR','SCALAR','ARRAY','SEQUENCE','SERIES','SUM','PRODUCT','FACTORIAL','PERMUTATION','COMBINATION','PROBABILITY','STATISTICS','MEAN','MEDIAN','MODE','RANGE','VARIANCE','STANDARD','DEVIATION'],
  Math_Advanced: ['ALGEBRA','GEOMETRY','TRIGONOMETRY','CALCULUS','DIFFERENTIAL','INTEGRAL','MULTIVARIABLE','VECTOR','TENSOR','CALCULUS','TOPOLOGY','ALGEBRAIC','TOPOLOGY','GEOMETRIC','TOPOLOGY','DIFFERENTIAL','TOPOLOGY','COMBINATORIAL','TOPOLOGY','SET','THEORY','GRAPH','THEORY','NUMBER','THEORY','ANALYTIC','NUMBER','THEORY','ALGEBRAIC','NUMBER','THEORY','COMPUTATIONAL','NUMBER','THEORY','CRYPTOGRAPHY','CODING','THEORY','INFORMATION','THEORY','GAME','THEORY','QUEUE','THEORY','PROBABILITY','THEORY','STATISTICAL','MECHANICS','THERMODYNAMICS','STATISTICAL','MECHANICS','QUANTUM','MECHANICS','RELATIVITY','STRING','THEORY'],
  Math_Shapes: ['CIRCLE','SQUARE','TRIANGLE','RECTANGLE','PENTAGON','HEXAGON','HEPTAGON','OCTAGON','NONAGON','DECAGON','HENDECAGON','DODECAGON','TRIDEcagon','TETRADECAGON','PENTADECAGON','HEXADECAGON','HEPTADECAGON','OCTADECAGON','NONADECAGON','ICOSAGON','CIRCLE','ELLIPSE','PARABOLA','HYPERBOLA','OVAL','OVOID','SPHERE','CUBE','CUBOID','PRISM','PYRAMID','CONE','CYLINDER','TORUS','MOBIUS','KLEIN','BOTTLE'],
  
  // LANGUAGE & WORDS
  Language_English: ['ALPHABET','WORD','SENTENCE','PARAGRAPH','ESSAY','ARTICLE','NOVEL','POEM','VERSE','STANZA','LINE','RHYME','METER','RHYTHM','ALLITERATION','ASSONANCE','CONSONANCE','METAPHOR','SIMILE','PERSONIFICATION','HYPERBOLE','METONYMY','SYNECDOCHE','ANTITHESIS','PARADOX','OXYMORON','IRONY','SARCASM','SATIRE','Lampoon','PARODY','TRAVESTY','BURLESQUE','MOC','KERY','ZEUGMA','SYNECDOCHE','METONYMY','METAPHROR','SIMILITUDE','TROP','FIGURES','SPEECH'],
  Language_Foreign: ['FRENCH','GERMAN','SPANISH','ITALIAN','PORTUGUESE','RUSSIAN','CHINESE','JAPANESE','KOREAN','ARABIC','HEBREW','HINDI','BENGALI','URDU','PUNJABI','MARATHI','GUJARATI','TAMIL','TELUGU','KANNADA','MALAYALAM','NEPALI','SANSKRIT','PALI','BURMESE','THAI','VIETNAMESE','INDONESIAN','MALAY','TAGALOG','CEBUANO','MAORI','HAWAIIAN','SAMOAN','TONGAN','FIJIAN','MAORI','SAMI','NORSE','GAELIC','WELSH','IRISH','SCOTTISH','BRETON','CORSICAN','CATALAN','BASQUE','GALICIAN','ASTURIAN','LEONESE','MURCIAN','ANDORRAN','LUXEMBOURGEOIS','ALSATIAN','FRANCO','PROVENÇAL','OCCITAN','LANGuedoc','AUVERGNAT','BOURBONNAIS','NICARDO','MENTONASC','CARTOGRAPHER'],
  Language_Signs: ['STOP','YIELD','SPEED','LIMIT','NO','ENTRY','ONE','WAY','DO','NOT','ENTER','NO','LEFT','TURN','NO','RIGHT','TURN','NO','U','TURN','NO','PARKING','NO','STANDING','NO','STOPPING','NO','BIKES','NO','PEDESTRIANS','NO','TRUCKS','NO','BUSES','NO','TRAILERS','NO','HAZARDOUS','MATERIALS','DANGER','EXPLOSIVES','INFLAMMABLE','CORROSIVE','TOXIC','RADIOACTIVE','BIOHAZARD','LASER','RADIATION','MICROWAVE','HIGH','VOLTAGE','RADIATION','AREA','RADIATION','AUTHORIZED','PERSONNEL','ONLY','NO','SMOKING','NO','FIRE','NO','WEAPONS','NO','PHOTOGRAPHY','NO','VIDEO','RECORDING','NO','CELL','PHONES','NO','AUDIO','RECORDING'],
  
  // PROFESSIONS
  Jobs_Medical: ['DOCTOR','NURSE','SURGEON','DENTIST','OPTOMETRIST','PHARMACIST','THERAPIST','PSYCHOLOGIST','PSYCHIATRIST','PEDIATRICIAN','CARDIOLOGIST','DERMATOLOGIST','GASTROENTEROLOGIST','NEUROLOGIST','ONCOLOGIST','RADIOLOGIST','ANESTHESIOLOGIST','PATHOLOGIST','UROLOGIST','NEPHROLOGIST','ENDOCRINOLOGIST','RHEUMATOLOGIST','IMMUNOLOGIST','ALLERGIST','INFECTIOUS','DISEASE','SPECIALIST','HEMATOLOGIST','VASCULAR','SURGEON','ORTHOPEDIST','NEUROSURGEON','OPHTHALMOLOGIST','OTOLARYNGOLOGIST','RHINOLOGIST','LARYNGOLOGIST','AUDIOLOGIST','SPEECH','PATHOLOGIST','OCCUPATIONAL','THERAPIST','PHYSICAL','THERAPIST','RESPIRATORY','THERAPIST','PROSTHETIST','ORTHOTIST','CHIROPRACTOR','ACUPUNCTURIST','NATUROPATH','HOMEOPATH','HERBALIST','AROMATHERAPIST','MASSAGE','THERAPIST'],
  Jobs_Legal: ['LAWYER','ATTORNEY','SOLICITOR','BARRISTER','PROSECUTOR','DEFENSE','ATTORNEY','JUDGE','MAGISTRATE','ARBITRATOR','MEDIATOR','CONCILIATOR','NOTARY','PUBLIC','COMMISSIONER','OATH','COMMISSIONER','PARALEGAL','LEGAL','SECRETARY','LEGAL','ASSISTANT','CLERK','COURT','REPORTER','COURT','STENOGRAPHER','BAILIFF','SHERIFF','DEPUTY','PROBATION','OFFICER','PAROLE','OFFICER','CORRECTIONAL','OFFICER','PRISON','GUARD','WARDEN','GOVERNOR','INSPECTOR','AUDITOR','INVESTIGATOR','DETECTIVE','PRIVATE','INVESTIGATOR','SECURITY','GUARD','BOUNCER','DOORMAN','GATEKEEPER','WARDEN','CUSTODIAN','JANITOR','CLEANER','MAID','HOUSEKEEPER','BUTLER','MAITRE','D','HOTEL','CONCIERGE','PORTER','BELLHOP','VALET','CHAPERONE','ESCORT','GUIDE','TOUR','LEADER','CONDUCTOR','DRIVER','CHAUFFEUR','CAB','DRIVER','TRUCK','DRIVER','BUS','DRIVER','TAXI','DRIVER','UBER','DRIVER','LYFT','DRIVER'],
  Jobs_Business: ['CEO','CFO','COO','CTO','CIO','CMO','CSO','CRO','CBO','CCO','PRESIDENT','VICE','PRESIDENT','DIRECTOR','MANAGER','SUPERVISOR','FOREMAN','LEADER','COORDINATOR','SPECIALIST','ANALYST','CONSULTANT','ADVISOR','EXPERT','PROFESSIONAL','TECHNICIAN','ENGINEER','ARCHITECT','DESIGNER','DEVELOPER','PROGRAMMER','CODER','TESTER','QA','ADMINISTRATOR','COORDINATOR','ASSISTANT','RECEPTIONIST','SECRETARY','CLERK','TYPIST','STENOGRAPHER','TRANSCRIPTIONIST','TYPIST','WORD','PROCESSOR','DATA','ENTRY','SPECIALIST','DATABASE','ADMINISTRATOR','SYSTEM','ADMINISTRATOR','NETWORK','ADMINISTRATOR','WEB','ADMINISTRATOR'],
  Jobs_Trades: ['CARPENTER','ELECTRICIAN','PLUMBER','WELDER','MECHANIC','MASON','BRICKLAYER','TILER','PAINTER','DECORATOR','DRYWALL','FINISHER','CARPENTER','FLOORING','INSTALLER','ROOFER','SIDING','INSTALLER','GUTTER','INSTALLER','HVAC','TECHNICIAN','HEATING','TECHNICIAN','COOLING','TECHNICIAN','REFRIGERATION','TECHNICIAN','APPLIANCE','REPAIR','TECHNICIAN','COMPUTER','REPAIR','TECHNICIAN','PHONE','REPAIR','TECHNICIAN','AUTO','MECHANIC','DIESEL','MECHANIC','MOTORCYCLE','MECHANIC','BOAT','MECHANIC','AIRCRAFT','MECHANIC'],
  Jobs_Creative: ['ARTIST','PAINTER','SCULPTOR','ILLUSTRATOR','CARTOONIST','ANIMATOR','GRAPHIC','DESIGNER','WEB','DESIGNER','UI','DESIGNER','UX','DESIGNER','PRODUCT','DESIGNER','INDUSTRIAL','DESIGNER','INTERIOR','DESIGNER','LANDSCAPE','ARCHITECT','FASHION','DESIGNER','TEXTILE','DESIGNER','JEWELRY','DESIGNER','CERAMICIST','POTTER','GLASS','BLOWER','METAL','WORKER','WOOD','CARVER','STONE','CARVER','MOSAIC','ARTIST','MURALIST','GRAFFITI','ARTIST','TATTOO','ARTIST','PIERCING','SPECIALIST','MAKEUP','ARTIST','HAIRSTYLIST','BARBER','NAIL','TECHNICIAN','ESTHETICIAN','SKIN','CARE','SPECIALIST','COSMETOLOGIST','BOUTIQUE','OWNER','BOUTIQUE','MANAGER','RETAIL','BUYER','MERCHANDISER','VISUAL','MERCHANDISER','WINDOW','DRESSER','STYLIST','FASHION','STYLIST','PERSONAL','STYLIST'],
  Jobs_Education: ['TEACHER','PROFESSOR','INSTRUCTOR','LECTURER','TUTOR','COACH','MENTOR','GUIDANCE','COUNSELOR','CAREER','ADVISOR','ACADEMIC','ADVISOR','ADMISSIONS','COUNSELOR','FINANCIAL','AID','COUNSELOR','REGISTRAR','ACADEMIC','COORDINATOR','PROGRAM','DIRECTOR','DEPARTMENT','CHAIR','DEAN','PROVOST','CHANCELLOR','PRESIDENT','SUPERINTENDENT','PRINCIPAL','HEADMASTER','HEADMISTRESS','SCHOOL','ADMINISTRATOR','EDUCATIONAL','LEADER','CURRICULUM','SPECIALIST','INSTRUCTION','DESIGNER','INSTRUCTIONAL','DESIGNER','E-LEARNING','DEVELOPER','TRAINING','MANAGER','LMS','ADMINISTRATOR','EVALUATOR','ASSESSMENT','SPECIALIST','TESTING','COORDINATOR','EXAMINATION','SUPERVISOR','GRADING','ASSISTANT','HOMEWORK','HELPER','STUDY','SKILLS','TUTOR'],
  
  // TRANSPORTATION
  Transport_Land: ['CAR','TRUCK','VAN','SUV','JEEP','PICKUP','COUPE','SEDAN','HATCHBACK','WAGON','CONVERTIBLE','ROADSTER','SPORTS','CAR','SUPERCAR','HYPERCAR','LUXURY','CAR','CLASSIC','CAR','ANTIQUE','CAR','VINTAGE','CAR','RETRO','CAR','MODERN','CAR','CONCEPT','CAR','PROTOTYPE','CAR','RACE','CAR','FORMULA','ONE','INDYCAR','NASCAR','RALLY','CAR','DRIFT','CAR','DRAG','CAR','CIRCUIT','CAR','TRACK','CAR','GT','CAR','LM','CAR','GTR','CAR','R35','R34','R33','R32','GTR','SKYLINE','SUPRA','RX7','RX8','LFA','NSX','GT','RS','M3','M5','AMG','GT','CORVETTE','CAMARO','MUSTANG','CHALLENGER','CHARGER','VIOLENT','CHARGER'],
  Transport_Water: ['BOAT','SHIP','YACHT','SAILBOAT','POWERBOAT','MOTORBOAT','ROWBOAT','CANOE','KAYAK','RAFT','JETSKI','WATER','SKI','WIND','SURFER','CATAMARAN','TRIMARAN','MONOHULL','MULTIHULL','KEELBOAT','BALLANCED','DINGHY','PRAM','SKIFF','SLOOP','CUTTER','SCHOONER','BRIG','BRIGANTINE','SCHOONER','BARQUE','BARQUENTINE','BARQUE','LUGGER','DHOW','JUNK','JUNK','CLIPPER','SCHOONER','BARK','BRIG','BRIGANTINE','SLOOP','SCHOONER','KETCH','YAWL','MUD','MOTOR','SAILER','HOUSEBOAT','BARGUE','TUG','BOAT','TOW','BOAT','FERRY','BOAT','CRUISE','SHIP','LINER','TANKER','CARGO','SHIP','CONTAINER','SHIP','BULK','CARRIER','Tanker','LPG','LNG'],
  Transport_Air: ['AIRPLANE','JET','PLANE','TURBOPROP','PISTON','ENGINE','HELICOPTER','GLIDER','BALLOON','AIRSHIP','BLIMP','ZEPPELIN','PARACHUTE','PARAGLIDER','HANG','GLIDER','POWERED','GLIDER','ULTRALIGHT','LIGHT','SPORT','AIRCRAFT','EXP','AIRCRAFT','ULTRALIGHT','AIRCRAFT','MICROLIGHT','AIRCRAFT','MOTORIZED','GLIDER','Gyroplane','Autogyro','Helicopter','Rotorcraft','Quadcopter','Octocopter','Hexacopter','Tricopter','Drone','UAV','UAS','RPAS','RPV','MODEL','AIRCRAFT','RC','PLANE','RC','HELICOPTER','RC','QUADCOPTER','Fpv','DRONE','Racing','DRONE','SURVEILLANCE','DRONE','CARGO','DRONE','DELIVERY','DRONE'],
  Transport_Public: ['BUS','TRAIN','TRAM','TROLLEY','SUBWAY','METRO','MONORAIL','RAILWAY','RAIL','LIGHT','RAIL','BRT','Bus','Rapid','Transit','GUIDEWAY','PEOPLE','MOVER','PEOPLE','MOVER','PERSONAL','RAPID','TRANSIT','PERSONAL','RAPID','TRANSIT','PERSONAL','Mover','Personal','Rapid','Transit','PRT','Personal','Rapid','Transit','People','Mover','People','Mover','Personal','Rapid','Transit'],
  
  // HOLIDAYS & EVENTS
  Holidays_USA: ['NEWYEAR','MLK','DAY','PRESIDENTS','DAY','MEMORIAL','DAY','INDEPENDENCE','DAY','LABOR','DAY','COLUMBUS','DAY','VETERANS','DAY','THANKSGIVING','CHRISTMAS','EASTER','PASSOVER','RAMADAN','YOM','KIPPUR','HANUKKAH','KWANZAA','VALENTINE','DAY','MOTHERS','DAY','FATHERS','DAY','HALLOWEEN','CHINESE','NEWYEAR','DIWALI','EID','BAKRI','EID','RAKSHA','BHANDARAN','BIHAR','DIWALI','HOLI','DURGA','PUJA','LAKSHMI','PUJA','GANESH','CHATURTHI','NAVAMI','DUSSERA','BAISI','KUMAR','AKM','DIWALI'],
  Holidays_World: ['CARNIVAL','MARDI','GRAS','ASH','WEDNESDAY','LENT','EASTER','GOOD','FRIDAY','EASTER','SUNDAY','EASTER','MONDAY','PASSOVER','PESACH','RAMADAN','EID','FITR','EID','AL','ADHA','BAKRI','EID','YOM','KIPPUR','ROSH','HASHANAH','YOM','KIPPUR','CHANUKAH','KWANZAA','DIwali','HOLI','EID','BUDDHA','PURIM','ST','PATRICKS','DAY','ST','VALENTINE','DAY','MAY','DAY','LABOR','DAY','MIDSUMMER','SOLSTICE','WINTER','SOLSTICE','SPRING','EQUINOX','FALL','EQUINOX','SUMMER','SOLSTICE','WINTER','SOLSTICE'],
  Events_Sports: ['SUPER','BOWL','WORLD','SERIES','NBA','FINALS','NHL','FINALS','STANLEY','CUP','FIFA','WORLD','CUP','OLYMPICS','SUMMER','OLYMPICS','WINTER','PARALYMPICS','SUPER','BOWL','WORLD','SERIES','WORLD','CUP','CHAMPIONSHIP','FINAL','SEMI','FINAL','QUARTER','FINAL','ROUND','ROBIN','PLAYOFF','POSTSEASON','PRESEASON','EXHIBITION','TOURNAMENT','CHAMPIONSHIP','LEAGUE','DIVISION','CONFERENCE','REGIONAL','NATIONAL','INTERNATIONAL','WORLD','CONTINENTAL','GLOBAL'],
  Events_Cultural: ['CARNIVAL','RIO','VENICE','CARNIVAL','NEW','ORLEANS','MARDI','GRAS','OKTOBERFEST','OKTOBER','FEST','ST','PATRICKS','DAY','PARADE','CHINESE','NEW','YEAR','PARADE','DIWALI','FESTIVAL','HOLI','FESTIVAL','EASTER','EGG','HUNT','HALLOWEEN','PARADE','THANKSGIVING','PARADE','MACY','PARADE','ROSE','PARADE','TOUR','DE','FRANCE','LA','VUELTA','GIRO','ITALIA','Tour','de','France','Vuelta','Espana','Giro','Italia','Tour','de','France'],
  
  // WEATHER & SEASONS
  Seasons: ['SPRING','SUMMER','FALL','AUTUMN','WINTER','SPRING','SUMMER','FALL','AUTUMN','WINTER','SPRING','SUMMER','FALL','AUTUMN','WINTER','SPRING','SUMMER','FALL','AUTUMN','WINTER'],
  Weather: ['SUNNY','CLOUDY','RAINY','SNOWY','WINDY','STORMY','FOGGY','HAZY','BRIGHT','OVERCAST','PARTLY','CLOUDY','MOSTLY','SUNNY','MOSTLY','CLOUDY','INCREASING','CLOUDS','DECREASING','CLOUDS','WIND','GUSTS','BREEZY','CHILLY','COOL','WARM','HOT','MILD','TEMPERATE','SUBTROPICAL','TROPICAL','ARID','SEMIARID','HUMID','SUBHUMID','DRY','WET','MONSOON','CYCLONE','HURRICANE','TORNADO','TSUNAMI','EARTHQUAKE','FLOOD','DROUGHT','HEATWAVE','COLDWAVE','BLIZZARD','ICE','STORM','THUNDERSTORM','LIGHTNING','RAIN','SHOWERS','DRIZZLE','SLEET','HAIL','SNOW','FLURRIES','GRASS','SNOW','GRAUPEL','ICE','PELLETS'],
  
  // COLORS & SHAPES
  Colors: ['RED','ORANGE','YELLOW','GREEN','BLUE','INDIGO','VIOLET','PURPLE','PINK','BROWN','BLACK','WHITE','GRAY','GREY','SILVER','GOLD','BRONZE','COPPER','BEIGE','CREAM','IVORY','TAN','MAROON','CRIMSON','SCARLET','VERMILLION','RUST','TERRACOTTA','SALMON','CORAL','PEACH','APRIL','LEMON','GOLDEN','MAIZE','AMBER','OCHRE','SAFFRON','TANGERINE','PERSIMMON','CARMINE','CERISE','FUCHSIA','MAGENTA','VIOLET','PURPLE','INDIGO','NAVY','AZURE','CERULEAN','SKY','BLUE','COBALT','SAPR','APPROX','PRUSSIAN','BLUE','TEAL','AQUA','TURQUOISE','AQUAMARINE','SEAfoam','MINT','SAGE','OLIVE','FOREST','GREEN','HUNTER','GREEN','JADE','EMERALD','MALACHITE','AQUAMARINE'],
  Shapes: ['CIRCLE','SQUARE','TRIANGLE','RECTANGLE','PENTAGON','HEXAGON','HEPTAGON','OCTAGON','NONAGON','DECAGON','OVAL','DIAMOND','HEART','STAR','CRESCENT','CROSS','ARROW','RING','ARC','SPIRAL','WAVE','ZIG','ZAG','DOT','LINE','CURVE','LOOP','SWIRL','SPIRAL','HELIX','ELLIPSE','PARABOLA','HYPERBOLA','SPIROID','CARDIOID','DELTOID','LIMAÇON','LEMNISCATE','CISSOID','STROPHOID','TRACTRIX','CATENARY','PARABOLA','HYPERBOLA','ELLIPSE','CIRCLE','OVAL'],
  
  // EMOTIONS & FEELINGS
  Emotions: ['HAPPY','SAD','ANGRY','SCARED','EXCITED','CALM','ANXIOUS','CALM','CONFIDENT','NERVOUS','PROUD','ASHAMED','GRATEFUL','JEALOUS','LONELY','EXCITED','BORED','CONFUSED','CURIOUS','HOPEFUL','WORRIED','SURPRISED','DISGUSTED','EMBARRASSED','FRUSTRATED','OVERWHELMED','STRESSED','RELAXED','PEACEFUL','RESTLESS','ENERGETIC','TIRED','FRESH','EXHAUSTED','INSPIRED','MOTIVATED','STUCK','READY','PREPARED','WORRIED','CONCERNED','CAREFUL','CARELESS','THOUGHTFUL','THOUGHTLESS','KIND','CRUEL','GENEROUS','SELFISH','BRAVE','FEARFUL','PATIENT','IMPATIENT','FORGIVING','BITTER','SWEET','SOUR','SPICY','SALTY','BITTER','UMAMI'],
  BodyParts: ['HEAD','FACE','EYE','NOSE','MOUTH','EAR','CHIN','CHEEK','FOREHEAD','TEMPLE','JAW','NECK','SHOULDER','ARM','ELBOW','WRIST','HAND','FINGER','THUMB','PALM','LEG','KNEE','SHIN','CALF','ANKLE','FOOT','TOE','HEEL','SOLE','ARCH','CHEST','BACK','SPINE','RIB','HEART','LUNG','LIVER','KIDNEY','STOMACH','INTESTINE','BRAIN','NERVE','MUSCLE','TENDON','LIGAMENT','BONE','CARTILAGE','SKIN','HAIR','NAIL'],
  Senses: ['SEE','HEAR','SMELL','TASTE','TOUCH','SIGHT','HEARING','OLFACTION','GUSTATION','TASTE','TOUCH','SENSATION','PERCEPTION','VISUAL','AUDITORY','OLFACTORY','GUSTATORY','TACTILE','SENSORY','STIMULUS','SENSE','ORGAN','EYE','EAR','NOSE','TONGUE','SKIN','RETINA','CORENA','LENS','IRIS','PUPIL','EARDRUM','COCHLEA','VESTIBULE','SEMICIRCULAR','CANALS','OLFACTORY','EPITHELIUM','BULB','TASTE','BUD','PAPILLAE','EPIDERMIS','DERMIS','HYPODERMIS','HAIR','FOLLICLE','NAIL','BED'],
  
  // TIME & MEASUREMENTS
  Time: ['SECOND','MINUTE','HOUR','DAY','WEEK','MONTH','YEAR','DECADE','CENTURY','MILLENNIUM','EPOCH','ERA','PERIOD','AGE','TIME','CLOCK','WATCH','TIMER','STOPWATCH','ALARM','SCHEDULE','CALENDAR','AGENDA','TIMELINE','MILESTONE','DEADLINE','APPOINTMENT','MEETING','INTERVIEW','PRESENTATION','DEMONSTRATION','EXHIBITION','CONFERENCE','SYMPOSIUM','SEMINAR','WORKSHOP','CLASS','LECTURE','COURSE','TUTORIAL','TRAINING','SESSION','LESSON','INSTRUCTION','GUIDANCE'],
  Measurements: ['INCH','FOOT','YARD','MILE','METER','KILOMETER','CENTIMETER','MILLIMETER','MICROMETER','NANOMETER','ANGSTROM','LITER','MILLILITER','GALLON','QUART','PINT','CUP','OUNCE','POUND','GRAM','KILOGRAM','METRIC','TON','IMPERIAL','METRIC','CUSTOMARY','INTERNATIONAL','SYSTEM','SI','UNITS','SCIENTIFIC','NOTATION','PREFIX','KILO','MEGA','GIGA','TERA','PETA','EXA','ZETTA','YOTTA','DECI','CENTI','MILLI','MICRO','NANO','PICO','FEMTO','ATTO','ZEPTO','YOCTO'],
  
  // SPACE & PLANETS
  Planets: ['MERCURY','VENUS','EARTH','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO','CERES','ERIS','MAKEMAKE','HAUMEA','SEDNA','ORCUS','QUAOAR','VARUNA','IXION','HUYA','CHAOS','GALAXY','NEMESIS','TYCHE','PLANET','NINE','PLANET','X','PLANET','X','PLANET','X'],
  SolarSystem: ['SUN','MERCURY','VENUS','EARTH','MOON','MARS','PHOBOS','DEIMOS','JUPITER','IO','EUROPA','GANYMEDE','CALLISTO','SATURN','TITAN','RHEA','IAPETUS','DIONE','TETHYS','MIMAS','ENCELADUS','TITAN','HYPERION','URANUS','TITANIA','OBERON','UMBRIEL','ARIEL','MIRANDA','NEPTUNE','TRITON','PROTEUS','NEREID','PLUTO','CHARON','NIX','HYDRA','KERBEROS','STYX','SUNLIGHT','SOLAR','WIND','CORONA','CHROMOSPHERE','PHOTOSPHERE','CONVECTION','ZONE','RADIATIVE','ZONE','CORE','NUCLEUS','FUSION','REACTOR'],
  
  // TOOLS & EQUIPMENT
  Tools: ['HAMMER','SCREWDRIVER','WRENCH','PLIERS','SAW','DRILL','SANDER','GRINDER','LEVEL','TAPE','MEASURE','SQUARE','CHISEL','FILE','VISE','CLAMP','SANDPAPER','SANDER','GRINDER','POLISHER','BUFFER','CLEANER','PRESSURE','WASHER','COMPRESSOR','GENERATOR','WELDER','TORCH','SOLDER','IRON','GLUE','GUN','STAPLER','NAILER','BRAD','FASTENER','SCREW','BOLT','NAIL','STAPLE','HOOK','LOOP','CLASP','LATCH','LOCK','KEY','CHAIN','ROPE','CABLE','WIRE','STRING','TWINE','TAPE','BAND','STRAP','BRACKET','HANGER','SUPPORT','FRAME','STAND','RACK','HOOK','ORGANIZER'],
  Kitchen: ['KNIFE','FORK','SPOON','PLATE','BOWL','CUP','GLASS','MUG','SAUCER','NAPKIN','PLACEMAT','TABLECLOTH','RUNNER','SKILLET','PAN','POT','ROASTER','DUTCH','OVEN','BAKING','DISH','CASSEROLE','DISH','PIE','PAN','MUFFIN','TIN','BUNDT','PAN','LOAF','PAN','COOKIE','SHEET','PARCHMENT','PAPER','SILICONE','MAT','GRILL','GRATE','GRIDDLE','WOK','SAUTE','PAN','SAUCEPAN','SAUCE','POT','STOCKPOT','CASSEROLE','POT','DOUBLE','BOILER','STEAMER','COLANDER','STRAINER','SIEVE','MILL','GRINDER','CHOPPER','SLICER','PEELER','GRATER','WHISK','BEATER','SPATULA','SPOON','LADLE','TONGS','GRIPPER','OPENER','CORKSCREW','BOTTLE','OPENER','CAN','OPENER','SCISSORS'],
  
  // HEALTH & FITNESS
  Fitness: ['PUSHUP','PULLUP','SITUP','SQUAT','LUNGE','PLANK','BRIDGE','CRUNCH','LIFT','BENCH','PRESS','CURL','ROW','FLY','EXTENSION','FLEXION','ROTATION','LATERAL','RAISE','FRONT','RAISE','SIDE','RAISE','REAR','RAISE','LEG','PRESS','LEG','CURL','LEG','EXTENSION','CALF','RAISE','TOE','RAISE','HEEL','RAISE','WRIST','ROLL','WRIST','CURL','FINGER','EXTENSION','NECK','ROTATION','SHOULDER','ROTATION','HIP','ROTATION','ANKLE','ROTATION','STRETCH','WARMUP','COOLDOWN','CARDIO','AEROBIC','ANAEROBIC','INTERVAL','TRAINING','CIRCUIT','TRAINING','SPLIT','TRAINING','FULL','BODY','WORKOUT','UPPER','BODY','LOWER','BODY','CORE','WORKOUT','FULL','BODY'],
  Yoga: ['MOUNTAIN','POSE','TREE','POSE','WARRIOR','POSE','DOWNWARD','DOG','UPWARD','DOG','WARRIOR','ONE','WARRIOR','TWO','WARRIOR','THREE','TRIANGLE','POSE','PYRAMID','POSE','EXTENDED','SIDE','ANGLE','POSE','HALF','MOON','POSE','EAGLE','POSE','EASY','POSE','CORPSE','POSE','CHILD','POSE','CAT','COW','POSE','PIGEON','POSE','BRIDGE','POSE','WHEEL','POSE','WHEEL','Plow','POSE','SHOULDER','STAND','POSE','HEADSTAND','POSE','HANDSTAND','POSE','CROCK','POSE'],
  
  // RELIGION & MYTHOLOGY
  Religion: ['GOD','GODDESS','ANGEL','ARCHANGEL','CHERUB','SERAPH','DEMON','DEVIL','SATAN','LUCIFER','DEVIL','ARCHDEMON','PRINCE','DARKNESS','SAINT','MARTYR','PROPHET','MESSIAH','CHRIST','BUDDHA','AVATAR','INCARNATION','DIVINITY','DEITY','Pantheon','OLYMPUS','NORSE','PANTHEON','GREEK','PANTHEON','ROMAN','PANTHEON','EGYPTIAN','PANTHEON','MAYAN','PANTHEON','AZTEC','PANTHEON','HINDU','PANTHEON','BUDDHIST','PANTHEON','TAOIST','PANTHEON','SHINTO','PANTHEON','ZOROASTRIAN','PANTHEON','PERSIAN','PANTHEON','CELTIC','PANTHEON','SLAVIC','PANTHEON','FINNISH','PANTHEON'],
  Mythology: ['DRAGON','GRIFFIN','UNICORN','PHOENIX','BASILISK','CHIMERA','MINOTAUR','HYDRA','SPHINX','GORGON','PEGASUS','CENTAUR','SATYR','FAUN','MERMAID','CENTAUR','Giant','Cyclops','Polyphemus','Minotaur','Cerberus','Chimera','Hydra','Lernaean','Nemean','Lion','Augean','Stables','Stymphalian','Birds','Cretan','Bull','Mare','Diomedes','Geryon','Erymanthian','Boar','Cercyon','Procrustes','Scylla','Rock','Scylla','Wandering','Rocks','Symplegades','Clashing','Rocks','Lotus','Eaters','Lotus','Scylla','Charybdis','Sirens','Sirens','Song','Polyphemus','Cyclops','Circe','Sorceress','Calypso','Nymph','Nereid','Naiad','Dryad','Nymph','Oread','Mountain','Nymph','Napaea','Naiad','Water','Nymph','Nereid','Sea','Nymph','Oceanid','Nymph','Ocean'],
  
  // MISC
  Random: ['ADVENTURE','BATTLE','CASTLE','DRAGON','KINGDOM','MAGIC','MYSTERY','QUEST','REALM','QUEST','TREASURE','VICTORY','CONQUEST','VICTORY','CHAMPION','HERO','LEGEND','FABLE','MYTH','TALE','STORY','SAGA','EPIC','CHRONICLE','HISTORY','ANNAL','RECORD','ACCOUNT','NARRATIVE','DESCRIPTION','EXPOSITION','FORESHADOWING','FLASHBACK','MONTAGE','MONTAGE','FLASHBACK','FLASHFORWARD','CUT','SCENE','SEQUENCE','ACT','SCENE','EPISODE','CHAPTER','VERSE','STANZA','LINE','PAGE','PARAGRAPH','SENTENCE','WORD','LETTER','SYLLABLE','SOUND','PHONEME','MORPHEME','SEMANTICS','SYNTAX','PRAGMATICS','DISCOURSE','TEXT','CONTEXT','REGISTER','STYLE','TONE','MOOD','ATMOSPHERE','TENSION','CONFLICT','RESOLUTION','DENOUEMENT','CLIMAX','FALLING','ACTION'],
};
window.PdfExport = {
  COLORS:['#6c63ff','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4'],
  hex2rgb(h){
    if(!h||typeof h!=='string'||h[0]!=='#'||h.length<7)return[0,0,0];
    const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
    if([r,g,b].some(n=>Number.isNaN(n)))return[0,0,0];
    return[r,g,b];
  },
  async generate(puzzles, cfg, onProgress){
    const{jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
    const includeSolutions = cfg?.mxdExport?.includeSolutions !== false;
    const total=puzzles.length*(includeSolutions?2:1);
    let done=0;
    for(let i=0;i<puzzles.length;i++){
      if(i>0)doc.addPage();
      this.drawPage(doc,puzzles[i],cfg,i,false);
      done++;
      if(onProgress)onProgress(done,total,`Puzzle ${i+1}/${puzzles.length}`);
      if(done%5===0)await new Promise(r=>setTimeout(r,0));
    }
    if(includeSolutions){
      for(let i=0;i<puzzles.length;i++){
        doc.addPage();
        this.drawPage(doc,puzzles[i],cfg,i,true);
        done++;
        if(onProgress)onProgress(done,total,`Solution ${i+1}/${puzzles.length}`);
        if(done%5===0)await new Promise(r=>setTimeout(r,0));
      }
    }
    doc.save((cfg.title||'word-search').replace(/\s+/g,'-')+'.pdf');
  },
  drawPage(doc,pz,cfg,idx,isSol){
    const W=612,H=792,M=36;
    const tmpl=TEMPLATES[cfg.template]||TEMPLATES.classic;
    const showGridLines=!!(tmpl.gl||cfg.forceGridLines);
    const bw=tmpl.bw||cfg.colorMode==='bw';
    const{grid,mask,placements}=pz;
    const rows=grid.length,cols=grid[0].length;
    if(tmpl.bg&&tmpl.bg!=='#ffffff'){
      const[r,g,b]=this.hex2rgb(tmpl.bg.startsWith('#')?tmpl.bg:'#1a1a2e');
      doc.setFillColor(r,g,b);doc.rect(0,0,W,H,'F');
    }
    const titleColor=bw?[0,0,0]:this.hex2rgb(tmpl.tc||'#1a1a2e');
    doc.setTextColor(...titleColor);doc.setFont('helvetica','bold');doc.setFontSize(22);
    doc.text((cfg.title||'Word Search')+(isSol?' — Solution Key':''),W/2,M+16,{align:'center'});
    if(isSol){doc.setFont('helvetica','italic');doc.setFontSize(10);doc.setTextColor(...titleColor.map(v=>Math.min(255,v+60)));doc.text('Answer Key',W/2,M+32,{align:'center'});}
    const maxGW=W-M*2.2,maxGH=H-M*2-130;
    const cs=Math.min(Math.floor(maxGW/cols),Math.floor(maxGH/rows),24);
    const gw=cols*cs,gh=rows*cs,gx=(W-gw)/2,gy=M+50;
    if(tmpl.gb){doc.setDrawColor(200,200,200);doc.setLineWidth(0.5);doc.rect(gx,gy,gw,gh);}
    if(showGridLines){doc.setDrawColor(230,230,230);doc.setLineWidth(0.3);for(let c2=0;c2<=cols;c2++)doc.line(gx+c2*cs,gy,gx+c2*cs,gy+gh);for(let r2=0;r2<=rows;r2++)doc.line(gx,gy+r2*cs,gx+gw,gy+r2*cs);}
    const solSet=new Set();
    if(isSol){Object.values(placements).forEach(cells=>{cells.forEach(([r,c])=>solSet.add(`${r}-${c}`));});}
    const solStyle=cfg.solutionStyle||'highlight';
    const hlRaw=(cfg.highlightColor&&String(cfg.highlightColor).startsWith('#'))?cfg.highlightColor:'#c9a227';
    const[hr,hg,hb]=this.hex2rgb(hlRaw);
    if(isSol){
      const perpOff=(x1,y1,x2,y2,off)=>{const len=Math.hypot(x2-x1,y2-y1)||1;return[-(y2-y1)/len*off,(x2-x1)/len*off];};
      if(['highlight','dim','dashed','double_line'].includes(solStyle)){
        let ci=0;
        Object.entries(placements).forEach(([,cells])=>{
          if(cells.length<2)return;
          const[r1,c1]=cells[0],[r2,c2]=cells[cells.length-1];
          const x1=gx+c1*cs+cs/2,y1=gy+r1*cs+cs/2,x2=gx+c2*cs+cs/2,y2=gy+r2*cs+cs/2;
          const col=bw?'#aaaaaa':this.COLORS[ci%this.COLORS.length];
          const[cr,cg,cb]=this.hex2rgb(col);
          doc.setDrawColor(cr,cg,cb);doc.setLineCap('round');
          if(solStyle==='dashed'&&doc.setLineDashPattern){doc.setLineDashPattern([Math.max(3,cs*0.22),cs*0.16],0);}
          else if(doc.setLineDashPattern){doc.setLineDashPattern([],0);}
          if(solStyle==='dim'){doc.setLineWidth(cs*0.38);doc.setGState&&doc.setGState(doc.GState({opacity:0.14}));doc.line(x1,y1,x2,y2);doc.setGState&&doc.setGState(doc.GState({opacity:1}));}
          else if(solStyle==='double_line'){const off=Math.max(1,cs*0.1);const[px,py]=perpOff(x1,y1,x2,y2,off);doc.setLineWidth(cs*0.2);doc.setGState&&doc.setGState(doc.GState({opacity:0.42}));doc.line(x1+px,y1+py,x2+px,y2+py);doc.line(x1-px,y1-py,x2-px,y2-py);doc.setGState&&doc.setGState(doc.GState({opacity:1}));}
          else{doc.setLineWidth(cs*0.65);doc.setGState&&doc.setGState(doc.GState({opacity:solStyle==='dashed'?0.35:0.28}));doc.line(x1,y1,x2,y2);doc.setGState&&doc.setGState(doc.GState({opacity:1}));}
          if(doc.setLineDashPattern)doc.setLineDashPattern([],0);ci++;
        });
      }else if(solStyle==='circle'){doc.setDrawColor(hr,hg,hb);doc.setLineWidth(1.1);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(!mask[r][c]||!solSet.has(`${r}-${c}`))continue;doc.circle(gx+c*cs+cs/2,gy+r*cs+cs/2,cs*0.38,'S');}}
      else if(solStyle==='boxed'){doc.setDrawColor(hr,hg,hb);doc.setLineWidth(1.35);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(!mask[r][c]||!solSet.has(`${r}-${c}`))continue;doc.rect(gx+c*cs+1.2,gy+r*cs+1.2,cs-2.4,cs-2.4,'S');}}
      else if(solStyle==='underline'){doc.setDrawColor(hr,hg,hb);doc.setLineWidth(1.15);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(!mask[r][c]||!solSet.has(`${r}-${c}`))continue;doc.line(gx+c*cs+cs*0.18,gy+r*cs+cs*0.8,gx+c*cs+cs*0.82,gy+r*cs+cs*0.8);}}
      else if(solStyle==='dot'){doc.setFillColor(hr,hg,hb);const rad=Math.max(1.4,cs*0.11);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(!mask[r][c]||!solSet.has(`${r}-${c}`))continue;doc.circle(gx+c*cs+cs/2,gy+r*cs+cs*0.42,rad,'F');}}
    }
    const cellColor=bw?[0,0,0]:this.hex2rgb(tmpl.cc||'#2d2d44');
    const dimColor=[180,180,180];
    doc.setFontSize(Math.max(cs*0.52,8));
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      if(!mask[r][c]||!grid[r][c])continue;
      const inSolWord=solSet.has(`${r}-${c}`);
      if(isSol&&solStyle==='dim'&&!inSolWord)doc.setTextColor(...dimColor);
      else doc.setTextColor(...cellColor);
      doc.setFont('helvetica',isSol&&inSolWord?'bold':'normal');
      doc.text(grid[r][c],gx+c*cs+cs/2,gy+r*cs+cs/2+1,{align:'center',baseline:'middle'});
    }
    const wlY=gy+gh+18;
    const wlColor=bw?[0,0,0]:this.hex2rgb(tmpl.tc||'#2d2d44');
    doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(...wlColor);
    doc.text('WORDS TO FIND',W/2,wlY,{align:'center'});
    const fs2=Math.min(cfg.wordFontSize||11,13);
    doc.setFont('helvetica','normal');doc.setFontSize(fs2);
    const pillColor=bw?[80,80,80]:this.hex2rgb(tmpl.pc||'#4a3d8f');
    doc.setTextColor(...pillColor);
    const words=Object.keys(placements);
    let wx=M,wy=wlY+16;
    words.forEach(w=>{
      const label=w.toUpperCase();
      const tw=doc.getTextWidth(label)+16;
      if(wx+tw>W-M){wx=M;wy+=fs2+8;}
      if(wy>H-M)return;
      if(tmpl.pb&&!bw){
        const[pr,pg,pb2]=this.hex2rgb(tmpl.pb.startsWith('#')?tmpl.pb:'#f3f0ff');
        doc.setFillColor(pr,pg,pb2);doc.roundedRect(wx,wy-fs2+2,tw,fs2+4,3,3,'F');
      }
      doc.text(label,wx+8,wy);wx+=tw;
    });
    if(cfg.showPageNum){doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(160,160,160);doc.text(`${isSol?'Solution ':''}Page ${(cfg.pageNum||1)+idx}`,W/2,H-14,{align:'center'});}
  }
};