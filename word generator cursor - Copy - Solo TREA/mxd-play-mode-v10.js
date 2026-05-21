/**
 * MXD Interactive Play Mode v10.0
 * 
 * Professional puzzle playing experience with:
 * - Click & Drag Selection: Click first letter, drag to last letter
 * - Auto-highlight word if found
 * - Visual feedback (line drawn through selected letters)
 * - Timer & Scoring: Stopwatch timer, score based on time + difficulty
 * - Word-by-word progress tracking
 * - Hints System: Reveal first letter, reveal word location, limited hints
 * - Play Modes: Practice (no timer, unlimited hints), Timed (race clock), Challenge (limited hints, score tracking)
 * - Progress Save: Auto-save progress in localStorage, resume where you left off
 * 
 * @module MXDPlayMode
 * @version 10.0.0
 */
(function(){
  'use strict';

  /**
   * Play Mode Configuration
   */
  var PLAY_MODES = {
    practice: {
      id: 'practice',
      name: 'Practice',
      desc: 'No timer, unlimited hints',
      timer: false,
      maxHints: Infinity,
      scoring: false
    },
    timed: {
      id: 'timed',
      name: 'Timed',
      desc: 'Race against the clock',
      timer: true,
      maxHints: Infinity,
      scoring: true
    },
    challenge: {
      id: 'challenge',
      name: 'Challenge',
      desc: 'Limited hints, score tracking',
      timer: true,
      maxHints: 3,
      scoring: true
    }
  };

  /**
   * Game State
   */
  function createGameState(puzzle, config){
    return {
      puzzle: puzzle,
      config: config || {},
      mode: config.mode || 'practice',
      foundWords: [],
      foundCells: {},
      selectedCells: [],
      isSelecting: false,
      startCell: null,
      hintsUsed: 0,
      hintsRemaining: PLAY_MODES[config.mode || 'practice'].maxHints,
      startTime: Date.now(),
      elapsedTime: 0,
      timerRunning: false,
      score: 0,
      completed: false,
      completedAt: null
    };
  }

  /**
   * Click & Drag Selection
   * Handles mouse and touch events for word selection
   */
  var SelectionEngine = {
    /**
     * Get cell from mouse/touch position
     */
    getCellFromEvent: function(event, gridEl, rows, cols){
      var rect = gridEl.getBoundingClientRect();
      var x = (event.clientX || (event.touches && event.touches[0].clientX)) - rect.left;
      var y = (event.clientY || (event.touches && event.touches[0].clientY)) - rect.top;

      var cellSize = rect.width / cols;
      var col = Math.floor(x / cellSize);
      var row = Math.floor(y / cellSize);

      if(row < 0 || row >= rows || col < 0 || col >= cols) return null;
      return {row: row, col: col};
    },

    /**
     * Get cells in a line from start to end
     * Supports horizontal, vertical, and diagonal selections
     */
    getCellsInLine: function(start, end){
      var cells = [];
      var dr = end.row - start.row;
      var dc = end.col - start.col;

      // Determine direction
      var stepR = 0;
      var stepC = 0;

      if(dr === 0){
        // Horizontal
        stepC = dc > 0 ? 1 : -1;
      } else if(dc === 0){
        // Vertical
        stepR = dr > 0 ? 1 : -1;
      } else if(Math.abs(dr) === Math.abs(dc)){
        // Diagonal
        stepR = dr > 0 ? 1 : -1;
        stepC = dc > 0 ? 1 : -1;
      } else {
        // Not a valid line
        return null;
      }

      var length = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
      for(var i=0;i<length;i++){
        cells.push({
          row: start.row + stepR * i,
          col: start.col + stepC * i
        });
      }

      return cells;
    },

    /**
     * Handle selection start
     */
    onStart: function(event, gameState, gridEl){
      event.preventDefault();
      var rows = gameState.puzzle.grid.length;
      var cols = gameState.puzzle.grid[0].length;
      var cell = this.getCellFromEvent(event, gridEl, rows, cols);

      if(!cell) return;

      gameState.isSelecting = true;
      gameState.startCell = cell;
      gameState.selectedCells = [cell];
    },

    /**
     * Handle selection move
     */
    onMove: function(event, gameState, gridEl){
      if(!gameState.isSelecting || !gameState.startCell) return;
      event.preventDefault();

      var rows = gameState.puzzle.grid.length;
      var cols = gameState.puzzle.grid[0].length;
      var cell = this.getCellFromEvent(event, gridEl, rows, cols);

      if(!cell) return;

      var cells = this.getCellsInLine(gameState.startCell, cell);
      if(cells){
        gameState.selectedCells = cells;
      }
    },

    /**
     * Handle selection end
     */
    onEnd: function(event, gameState, gridEl, onWordFound){
      if(!gameState.isSelecting) return;
      gameState.isSelecting = false;

      var selectedWord = '';
      for(var i=0;i<gameState.selectedCells.length;i++){
        var cell = gameState.selectedCells[i];
        selectedWord += gameState.puzzle.grid[cell.row][cell.col];
      }

      // Check if word is in the word list
      var words = gameState.puzzle.words || [];
      var found = false;

      for(var w=0;w<words.length;w++){
        var word = words[w].toUpperCase();
        if(selectedWord === word || selectedWord === word.split('').reverse().join('')){
          if(gameState.foundWords.indexOf(w) === -1){
            gameState.foundWords.push(w);
            gameState.foundCells[w] = gameState.selectedCells.slice();
            found = true;

            // Update score
            if(gameState.config.scoring){
              var wordLen = word.length;
              var timeBonus = Math.max(0, 100 - Math.floor(gameState.elapsedTime / 1000));
              gameState.score += wordLen * 10 + timeBonus;
            }

            if(onWordFound) onWordFound(words[w], gameState.selectedCells);
          }
          break;
        }
      }

      gameState.selectedCells = [];
      gameState.startCell = null;

      // Check if all words found
      if(gameState.foundWords.length === words.length){
        gameState.completed = true;
        gameState.completedAt = Date.now();
        gameState.timerRunning = false;
      }

      return found;
    }
  };

  /**
   * Timer System
   */
  var Timer = {
    _interval: null,

    start: function(gameState, onUpdate){
      if(gameState.timerRunning) return;
      gameState.timerRunning = true;
      var startTime = Date.now() - gameState.elapsedTime;

      this._interval = setInterval(function(){
        gameState.elapsedTime = Date.now() - startTime;
        if(onUpdate) onUpdate(gameState.elapsedTime);
      }, 100);
    },

    stop: function(gameState){
      gameState.timerRunning = false;
      if(this._interval){
        clearInterval(this._interval);
        this._interval = null;
      }
    },

    reset: function(gameState){
      this.stop(gameState);
      gameState.elapsedTime = 0;
    },

    formatTime: function(ms){
      var seconds = Math.floor(ms / 1000);
      var minutes = Math.floor(seconds / 60);
      var hours = Math.floor(minutes / 60);
      seconds = seconds % 60;
      minutes = minutes % 60;

      if(hours > 0){
        return hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
      }
      return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }
  };

  /**
   * Hints System
   */
  var Hints = {
    /**
     * Reveal first letter of a random unfound word
     */
    revealFirstLetter: function(gameState){
      if(gameState.hintsRemaining <= 0) return null;

      var words = gameState.puzzle.words || [];
      var placements = gameState.puzzle.placements || [];
      var unfound = [];

      for(var i=0;i<words.length;i++){
        if(gameState.foundWords.indexOf(i) === -1){
          unfound.push(i);
        }
      }

      if(unfound.length === 0) return null;

      var idx = unfound[Math.floor(Math.random() * unfound.length)];
      var placement = placements[idx];

      if(!placement) return null;

      gameState.hintsUsed++;
      gameState.hintsRemaining--;

      return {
        wordIndex: idx,
        word: words[idx],
        cell: {row: placement.row, col: placement.col}
      };
    },

    /**
     * Reveal word location (highlight entire word briefly)
     */
    revealWordLocation: function(gameState){
      if(gameState.hintsRemaining <= 0) return null;

      var words = gameState.puzzle.words || [];
      var placements = gameState.puzzle.placements || [];
      var unfound = [];

      for(var i=0;i<words.length;i++){
        if(gameState.foundWords.indexOf(i) === -1){
          unfound.push(i);
        }
      }

      if(unfound.length === 0) return null;

      var idx = unfound[Math.floor(Math.random() * unfound.length)];
      var placement = placements[idx];

      if(!placement) return null;

      gameState.hintsUsed++;
      gameState.hintsRemaining--;

      // Get all cells for this word
      var cells = [];
      var dir = placement.dir;
      var dx = 0, dy = 0;
      if(dir === 'right') dx = 1;
      else if(dir === 'down') dy = 1;
      else if(dir === 'left') dx = -1;
      else if(dir === 'up') dy = -1;
      else if(dir === 'downRight'){ dx = 1; dy = 1; }
      else if(dir === 'downLeft'){ dx = -1; dy = 1; }
      else if(dir === 'upRight'){ dx = 1; dy = -1; }
      else if(dir === 'upLeft'){ dx = -1; dy = -1; }

      for(var i2=0;i2<placement.word.length;i2++){
        cells.push({row: placement.row + dy*i2, col: placement.col + dx*i2});
      }

      return {
        wordIndex: idx,
        word: words[idx],
        cells: cells
      };
    }
  };

  /**
   * Progress Save/Load
   * Auto-save progress in localStorage
   */
  var ProgressSave = {
    _keyPrefix: 'mxd-play-progress-',

    /**
     * Save game state
     */
    save: function(gameState, puzzleId){
      try {
        var data = {
          foundWords: gameState.foundWords,
          foundCells: gameState.foundCells,
          hintsUsed: gameState.hintsUsed,
          hintsRemaining: gameState.hintsRemaining,
          startTime: gameState.startTime,
          elapsedTime: gameState.elapsedTime,
          score: gameState.score,
          completed: gameState.completed,
          completedAt: gameState.completedAt,
          savedAt: Date.now()
        };
        localStorage.setItem(this._keyPrefix + puzzleId, JSON.stringify(data));
        return true;
      } catch(e){
        return false;
      }
    },

    /**
     * Load game state
     */
    load: function(gameState, puzzleId){
      try {
        var data = localStorage.getItem(this._keyPrefix + puzzleId);
        if(!data) return false;

        var saved = JSON.parse(data);
        gameState.foundWords = saved.foundWords || [];
        gameState.foundCells = saved.foundCells || {};
        gameState.hintsUsed = saved.hintsUsed || 0;
        gameState.hintsRemaining = saved.hintsRemaining !== undefined ? saved.hintsRemaining : gameState.hintsRemaining;
        gameState.startTime = saved.startTime || gameState.startTime;
        gameState.elapsedTime = saved.elapsedTime || 0;
        gameState.score = saved.score || 0;
        gameState.completed = saved.completed || false;
        gameState.completedAt = saved.completedAt || null;

        return true;
      } catch(e){
        return false;
      }
    },

    /**
     * Clear saved progress
     */
    clear: function(puzzleId){
      try {
        localStorage.removeItem(this._keyPrefix + puzzleId);
      } catch(e){}
    },

    /**
     * Check if saved progress exists
     */
    hasProgress: function(puzzleId){
      try {
        return !!localStorage.getItem(this._keyPrefix + puzzleId);
      } catch(e){
        return false;
      }
    }
  };

  /**
   * Scoring System
   */
  var Scoring = {
    /**
     * Calculate score based on time, difficulty, and hints used
     */
    calculate: function(elapsedTime, difficulty, hintsUsed, wordsFound, totalWords){
      var baseScore = wordsFound * 100;
      var timeBonus = Math.max(0, 5000 - Math.floor(elapsedTime / 1000) * 10);
      var difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : difficulty === 'hard' ? 2 : 3;
      var hintPenalty = hintsUsed * 50;
      var completionBonus = wordsFound === totalWords ? 1000 : 0;

      return Math.round((baseScore + timeBonus + completionBonus - hintPenalty) * difficultyMultiplier);
    },

    /**
     * Get grade based on score
     */
    getGrade: function(score){
      if(score >= 5000) return 'S';
      if(score >= 4000) return 'A';
      if(score >= 3000) return 'B';
      if(score >= 2000) return 'C';
      if(score >= 1000) return 'D';
      return 'F';
    }
  };

  /**
   * Export
   */
  window.MXDPlayMode = {
    version: '10.0.0',
    PLAY_MODES: PLAY_MODES,
    createGameState: createGameState,
    selection: SelectionEngine,
    timer: Timer,
    hints: Hints,
    progress: ProgressSave,
    scoring: Scoring
  };

})();
