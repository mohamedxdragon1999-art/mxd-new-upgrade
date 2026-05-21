/**
 * MXD Word List Intelligence v10.0
 * 
 * Professional word list management with:
 * - Multi-list support (combine multiple word banks)
 * - Word list tools: Shuffle, Sort A-Z, Sort by Length, Remove Duplicates, Filter by Length, Blocklist
 * - Word count modes: Use ALL, Pick N random, Pick N by difficulty
 * - Decoy words system (up to 20 fake words that look real)
 * - Hidden bonus words (secret words not shown in list)
 * - Missing vowel mode for language learning
 * - Word list repeat across N puzzles
 * - Word list merging with deduplication
 * - "1 Puzzle Per Word List" mode (batch)
 * 
 * @module MXDWordListIntelligence
 * @version 10.0.0
 */
(function(){
  'use strict';

  /**
   * Word List Tools
   */
  var WordListTools = {
    /**
     * Shuffle - randomize word order
     */
    shuffle: function(words){
      var arr = words.slice();
      for(var i=arr.length-1;i>0;i--){
        var j = Math.floor(Math.random()*(i+1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    },

    /**
     * Sort A-Z - alphabetical
     */
    sortAZ: function(words){
      return words.slice().sort(function(a,b){ return a.localeCompare(b); });
    },

    /**
     * Sort Z-A - reverse alphabetical
     */
    sortZA: function(words){
      return words.slice().sort(function(a,b){ return b.localeCompare(a); });
    },

    /**
     * Sort by Length - shortest to longest
     */
    sortByLength: function(words){
      return words.slice().sort(function(a,b){ return a.length - b.length; });
    },

    /**
     * Sort by Length - longest to shortest
     */
    sortByLengthDesc: function(words){
      return words.slice().sort(function(a,b){ return b.length - a.length; });
    },

    /**
     * Remove Duplicates - auto-clean
     */
    removeDuplicates: function(words){
      var seen = {};
      var result = [];
      for(var i=0;i<words.length;i++){
        var key = words[i].toUpperCase();
        if(!seen[key]){
          seen[key] = true;
          result.push(words[i]);
        }
      }
      return result;
    },

    /**
     * Filter by Length - min/max word length
     */
    filterByLength: function(words, minLen, maxLen){
      return words.filter(function(w){
        var len = w.length;
        if(minLen && len < minLen) return false;
        if(maxLen && len > maxLen) return true;
        return true;
      });
    },

    /**
     * Remove Unwanted Words - blocklist
     */
    applyBlocklist: function(words, blocklist){
      if(!blocklist || blocklist.length === 0) return words;
      var blocked = {};
      for(var i=0;i<blocklist.length;i++){
        blocked[blocklist[i].toUpperCase()] = true;
      }
      return words.filter(function(w){
        return !blocked[w.toUpperCase()];
      });
    },

    /**
     * Remove words shorter than minimum
     */
    removeShort: function(words, minLen){
      return words.filter(function(w){ return w.length >= minLen; });
    },

    /**
     * Remove words longer than maximum
     */
    removeLong: function(words, maxLen){
      return words.filter(function(w){ return w.length <= maxLen; });
    },

    /**
     * Filter by starting letter
     */
    filterByStartLetter: function(words, letter){
      return words.filter(function(w){ return w.charAt(0).toUpperCase() === letter.toUpperCase(); });
    },

    /**
     * Filter by containing letter
     */
    filterByContains: function(words, letter){
      return words.filter(function(w){ return w.toUpperCase().indexOf(letter.toUpperCase()) >= 0; });
    }
  };

  /**
   * Word Count Modes
   */
  var WordCountModes = {
    /**
     * Use ALL words
     */
    all: function(words){
      return words.slice();
    },

    /**
     * Pick N random words
     */
    random: function(words, count){
      var arr = words.slice();
      count = Math.min(count, arr.length);
      for(var i=arr.length-1;i>0;i--){
        var j = Math.floor(Math.random()*(i+1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr.slice(0, count);
    },

    /**
     * Pick N words by difficulty
     * Difficulty based on word length: 3-4=easy, 5-6=medium, 7-8=hard, 9+=expert
     */
    byDifficulty: function(words, count, difficulty){
      var arr = words.slice();
      var filtered;

      if(difficulty === 'easy'){
        filtered = arr.filter(function(w){ return w.length >= 3 && w.length <= 4; });
      } else if(difficulty === 'medium'){
        filtered = arr.filter(function(w){ return w.length >= 5 && w.length <= 6; });
      } else if(difficulty === 'hard'){
        filtered = arr.filter(function(w){ return w.length >= 7 && w.length <= 8; });
      } else if(difficulty === 'expert'){
        filtered = arr.filter(function(w){ return w.length >= 9; });
      } else {
        filtered = arr;
      }

      if(filtered.length === 0) filtered = arr;
      if(filtered.length <= count) return filtered;

      // Shuffle and pick
      for(var i=filtered.length-1;i>0;i--){
        var j = Math.floor(Math.random()*(i+1));
        var tmp = filtered[i];
        filtered[i] = filtered[j];
        filtered[j] = tmp;
      }
      return filtered.slice(0, count);
    }
  };

  /**
   * Decoy Words System
   * Generate fake words that look like they should be in the puzzle but aren't
   * Uses syllable patterns and common letter combinations
   */
  var DecoyGenerator = {
    /**
     * Common English syllables for realistic fake word generation
     */
    syllables: [
      'tion','sion','ment','ness','able','ible','ence','ance','ity','ity',
      'al','ial','ual','ous','ious','ive','ative','itive','ful','less',
      'er','or','est','est','ing','ed','ly','ty','ry','ny','my',
      'con','com','pre','pro','dis','un','re','in','im','ex',
      'cat','bat','rat','sat','mat','fat','hat','pat','lat','nat',
      'can','ban','ran','san','man','fan','han','pan','lan','nan',
      'cap','bap','rap','sap','map','fap','hap','pap','lap','nap',
      'ter','per','mer','ner','ler','der','ber','cer','fer','ger',
      'tal','pal','mal','fal','hal','bal','dal','cal','wal','sal',
      'tic','pic','mic','fic','hic','bic','dic','lic','nic','ric',
      'ent','ant','int','ont','unt','ent','ant','int','ont','unt',
      'str','thr','spr','spl','scr','shr','squ','sta','sca','sco'
    ],

    /**
     * Vowel combinations
     */
    vowels: ['a','e','i','o','u','ea','ee','oo','ou','ai','au','ei','oi','io','ua','ue'],

    /**
     * Common consonant clusters
     */
    consonants: ['b','c','d','f','g','h','j','k','l','m','n','p','r','s','t','v','w','y','z',
                 'bl','br','cl','cr','dr','fl','fr','gl','gr','pl','pr','sc','sk','sl','sm','sn','sp','st','sw','tr','tw','wr'],

    /**
     * Generate a single decoy word
     * @param {number} minLen - Minimum length
     * @param {number} maxLen - Maximum length
     * @returns {string} Fake word
     */
    generate: function(minLen, maxLen){
      minLen = minLen || 4;
      maxLen = maxLen || 8;
      var len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));

      var word = '';
      var useVowel = Math.random() > 0.5;

      while(word.length < len){
        if(useVowel){
          var v = this.vowels[Math.floor(Math.random() * this.vowels.length)];
          if(word.length + v.length <= len){
            word += v;
          } else {
            word += this.vowels[0];
          }
        } else {
          var c = this.consonants[Math.floor(Math.random() * this.consonants.length)];
          if(word.length + c.length <= len){
            word += c;
          } else {
            word += this.consonants[0];
          }
        }
        useVowel = !useVowel;
      }

      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    },

    /**
     * Generate multiple decoy words
     * Ensures decoys don't match any real words
     * @param {Array} realWords - Real words to avoid
     * @param {number} count - Number of decoys to generate
     * @param {number} minLen - Minimum length
     * @param {number} maxLen - Maximum length
     * @returns {Array} Decoy words
     */
    generateMultiple: function(realWords, count, minLen, maxLen){
      count = count || 5;
      minLen = minLen || 4;
      maxLen = maxLen || 8;

      var realSet = {};
      for(var i=0;i<realWords.length;i++){
        realSet[realWords[i].toUpperCase()] = true;
      }

      var decoys = [];
      var attempts = 0;
      var maxAttempts = count * 20;

      while(decoys.length < count && attempts < maxAttempts){
        attempts++;
        var decoy = this.generate(minLen, maxLen);
        if(!realSet[decoy.toUpperCase()] && decoys.indexOf(decoy) === -1){
          decoys.push(decoy);
        }
      }

      return decoys;
    }
  };

  /**
   * Hidden Bonus Words System
   * Secret words placed in grid but NOT shown in word list
   */
  var BonusWords = {
    /**
     * Select bonus words from the word list
     * These will be placed in the grid but hidden from the solver
     * @param {Array} words - All words
     * @param {number} count - Number of bonus words
     * @returns {Object} {bonusWords, visibleWords}
     */
    select: function(words, count){
      count = count || 3;
      var arr = words.slice();

      // Pick random words as bonus
      var bonus = [];
      var visible = [];

      for(var i=arr.length-1;i>0;i--){
        var j = Math.floor(Math.random()*(i+1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }

      bonus = arr.slice(0, Math.min(count, arr.length));
      visible = arr.slice(Math.min(count, arr.length));

      return {
        bonusWords: bonus,
        visibleWords: visible,
        totalWords: words.length
      };
    }
  };

  /**
   * Missing Vowel Mode
   * Show word list with vowels removed for language learning
   * "ELEPHANT" → "L_PH_NT"
   */
  var MissingVowelMode = {
    vowels: ['A','E','I','O','U'],

    /**
     * Remove vowels from a word
     */
    removeVowels: function(word){
      var result = '';
      for(var i=0;i<word.length;i++){
        if(this.vowels.indexOf(word[i].toUpperCase()) >= 0){
          result += '_';
        } else {
          result += word[i];
        }
      }
      return result;
    },

    /**
     * Process entire word list
     */
    processList: function(words){
      var result = [];
      for(var i=0;i<words.length;i++){
        result.push({
          original: words[i],
          puzzle: this.removeVowels(words[i])
        });
      }
      return result;
    },

    /**
     * Check if a word has any vowels
     */
    hasVowels: function(word){
      for(var i=0;i<word.length;i++){
        if(this.vowels.indexOf(word[i].toUpperCase()) >= 0) return true;
      }
      return false;
    }
  };

  /**
   * Word List Repeat
   * Repeat same word list across N puzzles (each with different layout)
   */
  var WordListRepeat = {
    /**
     * Create repeated word lists
     * @param {Array} words - Original word list
     * @param {number} n - Number of repetitions
     * @param {boolean} shuffle - Shuffle between repeats
     * @returns {Array} Array of word lists
     */
    repeat: function(words, n, shuffle){
      n = n || 2;
      var lists = [];
      for(var i=0;i<n;i++){
        var list = words.slice();
        if(shuffle){
          for(var j=list.length-1;j>0;j--){
            var k = Math.floor(Math.random()*(j+1));
            var tmp = list[j];
            list[j] = list[k];
            list[k] = tmp;
          }
        }
        lists.push(list);
      }
      return lists;
    }
  };

  /**
   * Multi-List Support
   * Combine multiple word banks in one puzzle
   */
  var MultiList = {
    /**
     * Combine multiple word lists with deduplication
     */
    combine: function(lists){
      var combined = [];
      var seen = {};
      for(var i=0;i<lists.length;i++){
        for(var j=0;j<lists[i].length;j++){
          var word = lists[i][j].toUpperCase();
          if(!seen[word]){
            seen[word] = true;
            combined.push(lists[i][j]);
          }
        }
      }
      return combined;
    },

    /**
     * "1 Puzzle Per Word List" mode
     * Returns array of {title, words} objects
     */
    onePerList: function(lists, titles){
      var puzzles = [];
      for(var i=0;i<lists.length;i++){
        puzzles.push({
          title: titles && titles[i] ? titles[i] : 'Puzzle ' + (i+1),
          words: lists[i].slice()
        });
      }
      return puzzles;
    },

    /**
     * Merge with deduplication
     */
    merge: function(lists){
      return this.combine(lists);
    }
  };

  /**
   * Word List Statistics
   */
  function getStats(words){
    if(!words || words.length === 0){
      return {total:0, unique:0, avgLength:0, minLength:0, maxLength:0, letterDistribution:{}};
    }

    var unique = {};
    var totalLen = 0;
    var minLen = Infinity;
    var maxLen = 0;
    var letterDist = {};

    for(var i=0;i<words.length;i++){
      var w = words[i].toUpperCase();
      unique[w] = true;
      totalLen += w.length;
      if(w.length < minLen) minLen = w.length;
      if(w.length > maxLen) maxLen = w.length;

      for(var j=0;j<w.length;j++){
        letterDist[w[j]] = (letterDist[w[j]] || 0) + 1;
      }
    }

    var uniqueCount = Object.keys(unique).length;

    return {
      total: words.length,
      unique: uniqueCount,
      avgLength: (totalLen / words.length).toFixed(1),
      minLength: minLen === Infinity ? 0 : minLen,
      maxLength: maxLen,
      letterDistribution: letterDist
    };
  }

  /**
   * Export
   */
  window.MXDWordListIntelligence = {
    version: '10.0.0',
    tools: WordListTools,
    countModes: WordCountModes,
    decoys: DecoyGenerator,
    bonus: BonusWords,
    missingVowel: MissingVowelMode,
    repeat: WordListRepeat,
    multiList: MultiList,
    getStats: getStats
  };

})();
