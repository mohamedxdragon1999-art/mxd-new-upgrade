// mxd-auth.js — Authentication & Session Management
(function() {
  'use strict';

  const AUTH_VERSION = '2.0.0';

  class MXDAuth {
    constructor() {
      this.currentUser = null;
      this.sessions = new Map();
      this.deviceFingerprints = new Map();
      this.MAX_DEVICES = 3;
      this.listeners = {};
      this.init();
    }

    init() {
      this.loadSession();
      this.setupFingerprintTracking();
      console.log(`🔐 MXD Auth v${AUTH_VERSION} initialized`);
    }

    getFingerprint() {
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset()
      ];
      let hash = 0;
      const str = components.join('|');
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'fp_' + Math.abs(hash).toString(16);
    }

    setupFingerprintTracking() {
      this.fingerprint = this.getFingerprint();
    }

    async register(email, password, username = '', plan = 'free') {
      const existing = this.getUserByEmail(email);
      if (existing) {
        return { success: false, error: 'Email already registered' };
      }

      const userId = 'user_' + Date.now();
      const hashedPassword = this.hashPassword(password);
      const now = new Date().toISOString();

      const user = {
        id: userId,
        email,
        username: username || email.split('@')[0],
        passwordHash: hashedPassword,
        plan: plan || 'free',
        createdAt: now,
        lastLogin: now,
        referralCode: this.generateReferralCode(),
        referredBy: null,
        stats: {
          totalGenerations: 0,
          totalPrints: 0,
          totalExports: 0,
          apiCalls: 0
        },
        devices: [this.fingerprint],
        preferences: {
          theme: 'dark',
          notifications: true,
          autoSave: true
        }
      };

      this.saveUser(user);
      await this.login(email, password);
      return { success: true, user: this.sanitizeUser(user) };
    }

    async login(email, password, remember = false) {
      const user = this.getUserByEmail(email);
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      const hashedInput = this.hashPassword(password);
      if (hashedInput !== user.passwordHash) {
        return { success: false, error: 'Invalid credentials' };
      }

      user.lastLogin = new Date().toISOString();
      user.devices = user.devices || [];
      
      if (!user.devices.includes(this.fingerprint)) {
        if (user.devices.length >= this.MAX_DEVICES) {
          return { 
            success: false, 
            error: `Maximum ${this.MAX_DEVICES} devices allowed. Please logout from another device.`,
            code: 'MAX_DEVICES'
          };
        }
        user.devices.push(this.fingerprint);
      }

      this.saveUser(user);
      this.createSession(user.id, remember);
      this.currentUser = user;
      this.emit('login', this.sanitizeUser(user));

      return { success: true, user: this.sanitizeUser(user) };
    }

    async adminLogin(secretKey) {
      const adminKey = localStorage.getItem('mxd_admin_key') || 'mxd_admin_secret_2024';
      if (secretKey === adminKey) {
        const adminSession = {
          id: 'admin_' + Date.now(),
          type: 'admin',
          createdAt: new Date().toISOString()
        };
        sessionStorage.setItem('mxd_admin_session', JSON.stringify(adminSession));
        this.isAdmin = true;
        this.emit('adminLogin', { success: true });
        return { success: true, admin: true };
      }
      return { success: false, error: 'Invalid admin key' };
    }

    logout() {
      if (this.currentUser) {
        this.emit('logout', this.currentUser.id);
      }
      this.currentUser = null;
      sessionStorage.removeItem('mxd_session');
      localStorage.removeItem('mxd_session_persistent');
      this.isAdmin = false;
    }

    createSession(userId, persistent = false) {
      const session = {
        id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        userId,
        fingerprint: this.fingerprint,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (persistent ? 30 : 1) * 24 * 60 * 60 * 1000).toISOString()
      };

      if (persistent) {
        localStorage.setItem('mxd_session_persistent', JSON.stringify(session));
      } else {
        sessionStorage.setItem('mxd_session', JSON.stringify(session));
      }

      this.sessions.set(session.id, session);
      return session;
    }

    loadSession() {
      try {
        let session = JSON.parse(sessionStorage.getItem('mxd_session'));
        if (!session) {
          session = JSON.parse(localStorage.getItem('mxd_session_persistent'));
        }

        if (session && new Date(session.expiresAt) > new Date()) {
          const user = this.getUserById(session.userId);
          if (user && user.devices.includes(session.fingerprint)) {
            this.currentUser = user;
            this.sessions.set(session.id, session);
            return session;
          }
        }
      } catch (e) {}
      return null;
    }

    getUserByEmail(email) {
      const users = this.getAllUsers();
      return users.find(u => u.email === email) || null;
    }

    getUserById(userId) {
      const users = this.getAllUsers();
      return users.find(u => u.id === userId) || null;
    }

    getAllUsers() {
      try {
        const data = localStorage.getItem('mxd_users');
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    }

    saveUser(user) {
      const users = this.getAllUsers();
      const index = users.findIndex(u => u.id === user.id);
      if (index >= 0) {
        users[index] = user;
      } else {
        users.push(user);
      }
      localStorage.setItem('mxd_users', JSON.stringify(users));
    }

    sanitizeUser(user) {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }

    hashPassword(password) {
      let hash = 0;
      const str = password + 'mxd_salt_2024';
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'hash_' + Math.abs(hash).toString(16);
    }

    generateReferralCode() {
      return 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    useReferral(referralCode) {
      const users = this.getAllUsers();
      const referrer = users.find(u => u.referralCode === referralCode);
      if (referrer) {
        referrer.stats = referrer.stats || {};
        referrer.stats.referrals = (referrer.stats.referrals || 0) + 1;
        this.saveUser(referrer);
        return true;
      }
      return false;
    }

    getReferralStats() {
      if (!this.currentUser) return null;
      const users = this.getAllUsers();
      return {
        code: this.currentUser.referralCode,
        referrals: users.filter(u => u.referredBy === this.currentUser.id).length
      };
    }

    updateStats(type, value = 1) {
      if (!this.currentUser) return;
      this.currentUser.stats = this.currentUser.stats || {};
      this.currentUser.stats[type] = (this.currentUser.stats[type] || 0) + value;
      this.saveUser(this.currentUser);
    }

    isLoggedIn() {
      return this.currentUser !== null;
    }

    isAdminLoggedIn() {
      return this.isAdmin === true;
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
  }

  window.MXD_AUTH = new MXDAuth();
  window.MXDAuth = MXDAuth;
})();