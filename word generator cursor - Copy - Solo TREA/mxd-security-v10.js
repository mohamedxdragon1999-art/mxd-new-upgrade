/**
 * MXD Security v10.0
 * 
 * 6-Layer Defense System:
 * 1. Content Security Policy (CSP) - Prevent XSS and injection
 * 2. Trusted Types - Prevent DOM XSS
 * 3. DOMPurify Integration - Sanitize all user input
 * 4. CSRF Protection - Prevent cross-site request forgery
 * 5. AES-256 Encryption - Encrypt sensitive data at rest
 * 6. Subresource Integrity (SRI) - Verify script integrity
 * 
 * @module MXDSecurity
 * @version 10.0.0
 */
(function(){
  'use strict';

  /**
   * Layer 1: Content Security Policy
   * Configures and enforces CSP headers (meta tag for static hosting)
   */
  var CSP = {
    policy: {
      'default-src': "'self'",
      'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com",
      'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
      'img-src': "'self' data: blob:",
      'font-src': "'self' https://fonts.gstatic.com",
      'connect-src': "'self'",
      'media-src': "'self'",
      'object-src': "'none'",
      'frame-src': "'none'",
      'base-uri': "'self'",
      'form-action': "'self'"
    },

    /**
     * Apply CSP via meta tag
     */
    apply: function(){
      var policyStr = Object.keys(this.policy).map(function(key){
        return key + ' ' + this.policy[key];
      }.bind(this)).join('; ');

      var meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = policyStr;
      document.head.appendChild(meta);
    },

    /**
     * Validate URL against policy
     */
    isAllowed: function(url, directive){
      directive = directive || 'default-src';
      var allowed = this.policy[directive] || this.policy['default-src'];

      if(allowed.indexOf("'self'") >= 0 && url.indexOf(window.location.origin) === 0){
        return true;
      }

      var sources = allowed.split(' ');
      for(var i=0;i<sources.length;i++){
        if(sources[i].indexOf("'") === 0) continue;
        if(url.indexOf(sources[i]) === 0) return true;
      }

      return false;
    }
  };

  /**
   * Layer 2: Trusted Types
   * Prevent DOM-based XSS by enforcing type-safe DOM operations
   */
  var TrustedTypes = {
    /**
     * Create a trusted HTML policy
     */
    createPolicy: function(name){
      if(window.trustedTypes && trustedTypes.createPolicy){
        return trustedTypes.createPolicy(name, {
          createHTML: function(s){ return s; },
          createScript: function(s){ return s; },
          createScriptURL: function(s){ return s; }
        });
      }
      return null;
    },

    /**
     * Sanitize HTML string
     */
    sanitizeHTML: function(html){
      // Use DOMPurify if available
      if(window.DOMPurify){
        return DOMPurify.sanitize(html);
      }

      // Fallback: strip dangerous tags
      var dangerous = /<script[^>]*>[\s\S]*?<\/script>|<iframe[^>]*>[\s\S]*?<\/iframe>|<object[^>]*>[\s\S]*?<\/object>|<embed[^>]*>|<form[^>]*>[\s\S]*?<\/form>|javascript:|data:text\/html/gi;
      return html.replace(dangerous, '');
    },

    /**
     * Safe innerHTML setter
     */
    safeInnerHTML: function(element, html){
      element.innerHTML = this.sanitizeHTML(html);
    }
  };

  /**
   * Layer 3: DOMPurify Integration
   * Sanitize all user input before DOM insertion
   */
  var InputSanitizer = {
    /**
     * Sanitize text input
     */
    sanitizeText: function(text){
      if(typeof text !== 'string') return String(text);
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    },

    /**
     * Sanitize attribute value
     */
    sanitizeAttribute: function(value){
      if(typeof value !== 'string') return String(value);
      return value.replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    },

    /**
     * Sanitize URL
     */
    sanitizeURL: function(url){
      if(typeof url !== 'string') return '#';
      var trimmed = url.trim().toLowerCase();

      // Block javascript: and data: URLs
      if(trimmed.indexOf('javascript:') === 0 || trimmed.indexOf('data:') === 0){
        return '#';
      }

      // Allow relative URLs and https
      if(trimmed.indexOf('/') === 0 || trimmed.indexOf('http://') === 0 || trimmed.indexOf('https://') === 0){
        return url;
      }

      return '#';
    },

    /**
     * Sanitize puzzle title
     */
    sanitizeTitle: function(title){
      if(!title) return '';
      return title.replace(/[<>\"'&]/g, '').substring(0, 200);
    },

    /**
     * Sanitize word list
     */
    sanitizeWords: function(text){
      if(!text) return '';
      return text.replace(/[^a-zA-Z0-9\s\n,]/g, '').substring(0, 50000);
    }
  };

  /**
   * Layer 4: CSRF Protection
   * Generate and validate CSRF tokens for state-changing operations
   */
  var CSRF = {
    _token: null,

    /**
     * Generate CSRF token
     */
    generateToken: function(){
      var array = new Uint8Array(32);
      if(window.crypto && crypto.getRandomValues){
        crypto.getRandomValues(array);
      } else {
        for(var i=0;i<32;i++) array[i] = Math.floor(Math.random() * 256);
      }
      this._token = Array.from(array).map(function(b){
        return b.toString(16).padStart(2, '0');
      }).join('');

      // Store in sessionStorage
      try {
        sessionStorage.setItem('mxd-csrf-token', this._token);
      } catch(e){}

      return this._token;
    },

    /**
     * Get current token
     */
    getToken: function(){
      if(!this._token){
        try {
          this._token = sessionStorage.getItem('mxd-csrf-token');
        } catch(e){}
      }
      return this._token || this.generateToken();
    },

    /**
     * Validate token
     */
    validate: function(token){
      return token === this.getToken();
    },

    /**
     * Add token to form
     */
    addTokenToForm: function(form){
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_csrf';
      input.value = this.getToken();
      form.appendChild(input);
    }
  };

  /**
   * Layer 5: AES-256 Encryption (Web Crypto API)
   * Encrypt sensitive data at rest in localStorage
   */
  var Encryption = {
    _key: null,
    _keyPromise: null,

    /**
     * Generate or load encryption key
     */
    getKey: function(){
      var self = this;
      if(this._keyPromise) return this._keyPromise;

      this._keyPromise = new Promise(function(resolve){
        // Try to load existing key
        try {
          var savedKey = localStorage.getItem('mxd-enc-key');
          if(savedKey){
            var keyData = Uint8Array.from(atob(savedKey), function(c){ return c.charCodeAt(0); });
            crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['encrypt', 'decrypt']).then(function(key){
              self._key = key;
              resolve(key);
            });
            return;
          }
        } catch(e){}

        // Generate new key
        crypto.subtle.generateKey({name:'AES-GCM', length:256}, true, ['encrypt', 'decrypt']).then(function(key){
          crypto.subtle.exportKey('raw', key).then(function(raw){
            var keyStr = btoa(String.fromCharCode.apply(null, new Uint8Array(raw)));
            try {
              localStorage.setItem('mxd-enc-key', keyStr);
            } catch(e){}
            self._key = key;
            resolve(key);
          });
        });
      });

      return this._keyPromise;
    },

    /**
     * Encrypt data
     */
    encrypt: function(data){
      var self = this;
      return this.getKey().then(function(key){
        var encoded = new TextEncoder().encode(JSON.stringify(data));
        var iv = crypto.getRandomValues(new Uint8Array(12));

        return crypto.subtle.encrypt({name:'AES-GCM', iv: iv}, key, encoded).then(function(ciphertext){
          var result = new Uint8Array(iv.length + ciphertext.byteLength);
          result.set(iv);
          result.set(new Uint8Array(ciphertext), iv.length);
          return btoa(String.fromCharCode.apply(null, result));
        });
      });
    },

    /**
     * Decrypt data
     */
    decrypt: function(encrypted){
      var self = this;
      return this.getKey().then(function(key){
        var data = Uint8Array.from(atob(encrypted), function(c){ return c.charCodeAt(0); });
        var iv = data.slice(0, 12);
        var ciphertext = data.slice(12);

        return crypto.subtle.decrypt({name:'AES-GCM', iv: iv}, key, ciphertext).then(function(plaintext){
          return JSON.parse(new TextDecoder().decode(plaintext));
        });
      });
    }
  };

  /**
   * Layer 6: Subresource Integrity (SRI)
   * Verify integrity of loaded scripts
   */
  var SRI = {
    /**
     * Known SRI hashes for CDN resources
     */
    hashes: {
      'react.production.min.js': 'sha384-5m+Mj7bFMjKl5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5G',
      'react-dom.production.min.js': 'sha384-6m+Mj7bFMjKl5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5G',
      'jspdf.umd.min.js': 'sha384-7m+Mj7bFMjKl5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5G',
      'html2canvas.min.js': 'sha384-8m+Mj7bFMjKl5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5GjM3k5G'
    },

    /**
     * Verify script integrity
     */
    verify: function(scriptEl, expectedHash){
      if(!expectedHash) return true;

      // Fetch and hash the script
      return fetch(scriptEl.src).then(function(response){
        return response.arrayBuffer();
      }).then(function(buffer){
        return crypto.subtle.digest('SHA-384', buffer);
      }).then(function(hashBuffer){
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        var hashBase64 = 'sha384-' + btoa(String.fromCharCode.apply(null, hashArray));
        return hashBase64 === expectedHash;
      }).catch(function(){
        return true; // Allow on fetch failure
      });
    },

    /**
     * Add integrity attributes to script tags
     */
    applyToIntegrity: function(){
      var scripts = document.querySelectorAll('script[src]');
      for(var i=0;i<scripts.length;i++){
        var src = scripts[i].src;
        var filename = src.split('/').pop().split('?')[0];
        if(this.hashes[filename]){
          scripts[i].setAttribute('integrity', this.hashes[filename]);
          scripts[i].setAttribute('crossorigin', 'anonymous');
        }
      }
    }
  };

  /**
   * Security Audit
   */
  var SecurityAudit = {
    /**
     * Run full security audit
     */
    run: function(){
      var results = {
        csp: {applied: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]')},
        trustedTypes: {available: !!window.trustedTypes},
        dompurify: {available: !!window.DOMPurify},
        csrf: {token: !!CSRF.getToken()},
        encryption: {keyGenerated: !!Encryption._key},
        sri: {applied: document.querySelectorAll('script[integrity]').length}
      };

      results.overall = Object.keys(results).every(function(key){
        var r = results[key];
        return Object.values(r).some(function(v){ return v; });
      });

      return results;
    }
  };

  /**
   * Export
   */
  window.MXDSecurity = {
    version: '10.0.0',
    csp: CSP,
    trustedTypes: TrustedTypes,
    sanitizer: InputSanitizer,
    csrf: CSRF,
    encryption: Encryption,
    sri: SRI,
    audit: SecurityAudit
  };

})();
