// auth.js — MXD Auth + Subscription System (Merged)
// Combines: mxd-auth.js + mxd-subscription.js

(function(){
  'use strict';

  const STORAGE_KEYS = {
    SESSION: 'mxd_session',
    USER: 'mxd_user',
    TOKEN: 'mxd_token',
    DEVICES: 'mxd_devices',
    REFERRAL_CODE: 'mxd_ref_code',
    USAGE: 'mxd_usage'
  };

  const ADMIN_CONFIG = {
    name: 'mohamedxdragon',
    email: 'mohamedxdragon1999@gmail.com',
    secretCode: 'kingofdragonsismxd1999'
  };

  const PLAN_LIMITS = {
    free: { daily: 10, monthly: 300, reset: 'daily' },
    pro: { daily: 10, monthly: 300, reset: 'daily' },
    extrem: { daily: 25, monthly: 750, reset: 'daily' },
    ultimate: { daily: 100, monthly: 3000, reset: 'daily' },
    admin: { daily: Infinity, monthly: Infinity, reset: 'never' }
  };

  // ============ MXD AUTH CLASS ============
  class MXDAuth {
    constructor() {
      this.currentUser = null;
      this.token = null;
      this.listeners = {};
      this.usage = this.getEmptyUsage();
      this.init();
    }

    init() {
      this.loadSession();
      this.loadUsage();
      this.setupOnlineListener();
      this.setupDailyReset();
    }

    // Session Management
    loadSession() {
      try {
        const session = localStorage.getItem(STORAGE_KEYS.SESSION);
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (session && user && token) {
          this.currentUser = JSON.parse(user);
          this.token = JSON.parse(token);
          if (this.isTokenValid()) {
            this.dispatchEvent('sessionLoaded', this.currentUser);
          } else {
            this.logout();
          }
        }
      } catch (e) {
        console.warn('MXD Auth: Failed to load session', e);
        this.logout();
      }
    }

    saveSession() {
      try {
        if (this.currentUser) {
          localStorage.setItem(STORAGE_KEYS.SESSION, 'active');
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
        }
        if (this.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(this.token));
        }
      } catch (e) {
        console.warn('MXD Auth: Failed to save session', e);
      }
    }

    isTokenValid() {
      if (!this.token) return false;
      if (this.token.expiresAt && Date.now() > this.token.expiresAt) return false;
      return true;
    }

    checkAdminBypass(name, email, code) {
      return (
        name.toLowerCase() === ADMIN_CONFIG.name.toLowerCase() &&
        email.toLowerCase() === ADMIN_CONFIG.email.toLowerCase() &&
        code === ADMIN_CONFIG.secretCode
      );
    }

    register(name, email, password, referralCode = null) {
      const existingUsers = this.getUsers();
      if (existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: 'Email already registered' };
      }

      const userId = this.generateUserId();
      const hashedPassword = this.hashPassword(password);
      const userReferralCode = this.generateReferralCode();
      let plan = 'pro';
      let planExpiresAt = null;

      if (referralCode) {
        const referralResult = this.validateReferralCode(referralCode);
        if (referralResult.valid) {
          planExpiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
          this.addReferralDays(referralResult.referrerId, 1);
        }
      }

      const user = {
        id: userId, name, email, password: hashedPassword, plan, planExpiresAt,
        referralCode: userReferralCode, referredBy: referralCode || null,
        createdAt: Date.now(), lastLogin: Date.now(),
        devices: [this.getDeviceFingerprint()], strikes: 0, isAdmin: false
      };

      existingUsers.push(user);
      this.saveUsers(existingUsers);
      this.currentUser = this.sanitizeUser(user);
      this.token = this.generateToken(user);
      this.saveSession();
      this.dispatchEvent('register', this.currentUser);
      return { success: true, user: this.currentUser };
    }

    login(email, password) {
      const users = this.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return { success: false, error: 'Invalid email or password' };
      if (!this.verifyPassword(password, user.password)) return { success: false, error: 'Invalid email or password' };
      if (!this.isDeviceAllowed(user)) return { success: false, error: 'Device not authorized. Please approve this device.' };
      user.lastLogin = Date.now();
      this.saveUsers(users);
      this.currentUser = this.sanitizeUser(user);
      this.token = this.generateToken(user);
      this.saveSession();
      this.dispatchEvent('login', this.currentUser);
      return { success: true, user: this.currentUser };
    }

    adminLogin(name, email, code) {
      if (!this.checkAdminBypass(name, email, code)) return { success: false, error: 'Invalid admin credentials' };
      const users = this.getUsers();
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        user = {
          id: this.generateUserId(), name: ADMIN_CONFIG.name, email: ADMIN_CONFIG.email,
          password: this.hashPassword(code), plan: 'admin', planExpiresAt: null,
          referralCode: this.generateReferralCode(), referredBy: null,
          createdAt: Date.now(), lastLogin: Date.now(),
          devices: [this.getDeviceFingerprint()], strikes: 0, isAdmin: true
        };
        users.push(user);
        this.saveUsers(users);
      } else {
        user.isAdmin = true;
        user.plan = 'admin';
        user.lastLogin = Date.now();
        this.saveUsers(users);
      }
      this.currentUser = this.sanitizeUser(user);
      this.token = this.generateToken(user);
      this.saveSession();
      this.dispatchEvent('adminLogin', this.currentUser);
      return { success: true, user: this.currentUser };
    }

    logout() {
      this.currentUser = null;
      this.token = null;
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      this.dispatchEvent('logout', null);
    }

    hasAccess(feature) {
      if (!this.currentUser) return false;
      if (this.currentUser.isAdmin) return true;
      const plan = this.currentUser.plan;
      const accessMatrix = {
        free: ['wordlist_basic', 'templates_basic', 'grid_standard', 'pdf_5'],
        pro: ['wordlist_basic', 'templates_basic', 'grid_standard', 'pdf_5'],
        extrem: ['wordlist_basic', 'wordlist_advanced', 'chat', 'cover', 'templates_extended', 'grid_medium', 'pdf_50', 'analytics_basic'],
        ultimate: '*'
      };
      if (accessMatrix[plan] === '*') return true;
      if (Array.isArray(accessMatrix[plan])) return accessMatrix[plan].includes(feature);
      return false;
    }

    getDailyLimit() {
      if (!this.currentUser) return 0;
      if (this.currentUser.isAdmin) return Infinity;
      return PLAN_LIMITS[this.currentUser.plan]?.daily || 0;
    }

    getMonthlyLimit() {
      if (!this.currentUser) return 0;
      if (this.currentUser.isAdmin) return Infinity;
      return PLAN_LIMITS[this.currentUser.plan]?.monthly || 0;
    }

    isPlanExpired() {
      if (!this.currentUser) return true;
      if (this.currentUser.isAdmin) return false;
      if (!this.currentUser.planExpiresAt) return false;
      return Date.now() > this.currentUser.planExpiresAt;
    }

    updatePlan(plan, expiresAt = null) {
      if (!this.currentUser) return false;
      this.currentUser.plan = plan;
      this.currentUser.planExpiresAt = expiresAt;
      this.token = this.generateToken(this.currentUser);
      const users = this.getUsers();
      const idx = users.findIndex(u => u.id === this.currentUser.id);
      if (idx >= 0) {
        users[idx] = { ...users[idx], plan, planExpiresAt };
        this.saveUsers(users);
      }
      this.saveSession();
      this.dispatchEvent('planUpdate', this.currentUser);
      return true;
    }

    isDeviceAllowed(user) {
      if (!user.devices || user.devices.length === 0) return true;
      if (user.devices.length >= 3) return false;
      return user.devices.includes(this.getDeviceFingerprint());
    }

    generateToken(user) {
      const payload = {
        sub: user.id, email: user.email, plan: user.plan, isAdmin: user.isAdmin || false,
        device: this.getDeviceFingerprint(), iat: Date.now(), expiresAt: Date.now() + (15 * 60 * 1000)
      };
      const signature = this.signPayload(JSON.stringify(payload));
      return { payload, signature, raw: `${btoa(JSON.stringify(payload))}.${signature}` };
    }

    signPayload(data) {
      const key = 'mxd_secret_key_' + Date.now().toString().slice(0, 10);
      let hash = 0;
      for (let i = 0; i < data.length; i++) { const char = data.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; }
      return hash.toString(16);
    }

    validateToken(token) {
      if (!token || !token.raw) return false;
      try {
        const [payloadB64, signature] = token.raw.split('.');
        const payload = JSON.parse(atob(payloadB64));
        if (payload.expiresAt && Date.now() > payload.expiresAt) return false;
        if (payload.device !== this.getDeviceFingerprint()) return false;
        return true;
      } catch (e) { return false; }
    }

    hashPassword(password) {
      let hash = 0;
      const salt = 'mxd_salt_2024';
      const salted = salt + password + salt;
      for (let i = 0; i < salted.length; i++) { const char = salted.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; }
      return hash.toString(16) + '_' + Date.now().toString(16);
    }

    verifyPassword(password, storedHash) {
      const hash = this.hashPassword(password);
      return hash.split('_')[0] === storedHash.split('_')[0];
    }

    generateUserId() { return 'usr_' + Date.now().toString(36) + '_' + this.randomString(8); }
    generateReferralCode() { return 'REF' + this.randomString(10).toUpperCase(); }
    randomString(length) {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
      return result;
    }

    validateReferralCode(code) {
      const users = this.getUsers();
      const referrer = users.find(u => u.referralCode === code);
      if (!referrer) return { valid: false, error: 'Invalid referral code' };
      if (this.currentUser && referrer.id === this.currentUser.id) return { valid: false, error: 'You cannot use your own referral code' };
      const codeAge = Date.now() - referrer.createdAt;
      if (codeAge > 30 * 24 * 60 * 60 * 1000) return { valid: false, error: 'Referral code has expired' };
      return { valid: true, referrerId: referrer.id };
    }

    addReferralDays(referrerId, days) {
      const users = this.getUsers();
      const idx = users.findIndex(u => u.id === referrerId);
      if (idx >= 0) {
        const user = users[idx];
        const currentDays = this.getPlanDaysLeft(user);
        const newDays = Math.min(currentDays + days, 30);
        user.planExpiresAt = Date.now() + (newDays * 24 * 60 * 60 * 1000);
        this.saveUsers(users);
      }
    }

    getPlanDaysLeft(user) {
      if (!user.planExpiresAt) return 0;
      return Math.max(0, Math.floor((user.planExpiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
    }

    getDeviceFingerprint() {
      const data = [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, new Date().getTimezoneOffset()].join('|');
      let hash = 0;
      for (let i = 0; i < data.length; i++) { const char = data.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; }
      return 'dev_' + Math.abs(hash).toString(16);
    }

    getUsers() { try { const users = localStorage.getItem('mxd_users'); return users ? JSON.parse(users) : []; } catch (e) { return []; } }
    saveUsers(users) { localStorage.setItem('mxd_users', JSON.stringify(users)); }
    sanitizeUser(user) { const { password, ...safeUser } = user; return safeUser; }

    on(event, callback) { if (!this.listeners[event]) this.listeners[event] = []; this.listeners[event].push(callback); }
    off(event, callback) { if (!this.listeners[event]) return; this.listeners[event] = this.listeners[event].filter(cb => cb !== callback); }
    dispatchEvent(event, data) { if (!this.listeners[event]) return; this.listeners[event].forEach(cb => { try { cb(data); } catch (e) { console.error(e); } }); }

    setupOnlineListener() {
      window.addEventListener('online', () => this.dispatchEvent('online', true));
      window.addEventListener('offline', () => this.dispatchEvent('offline', false));
    }

    getUser() { return this.currentUser; }
    getToken() { return this.token; }
    isLoggedIn() { return this.currentUser !== null && this.isTokenValid(); }
    isAdmin() { return this.currentUser?.isAdmin === true; }

    getPlanInfo() {
      if (!this.currentUser) return null;
      return {
        plan: this.currentUser.plan, isAdmin: this.currentUser.isAdmin,
        dailyLimit: this.getDailyLimit(), monthlyLimit: this.getMonthlyLimit(),
        daysLeft: this.getPlanDaysLeft(this.currentUser), isExpired: this.isPlanExpired()
      };
    }

    // ============ USAGE TRACKING ============
    getEmptyUsage() {
      return {
        daily: { count: 0, date: this.getTodayKey(), actions: [] },
        monthly: { count: 0, month: this.getMonthKey() },
        history: []
      };
    }

    getTodayKey() {
      const now = new Date();
      return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    }

    getMonthKey() {
      const now = new Date();
      return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    }

    loadUsage() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.USAGE);
        if (stored) this.usage = JSON.parse(stored);
        else this.usage = this.getEmptyUsage();
      } catch (e) { this.usage = this.getEmptyUsage(); }
    }

    saveUsage() {
      try { localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(this.usage)); } catch (e) {}
    }

    checkDailyReset() {
      if (this.usage.daily.date !== this.getTodayKey()) {
        this.usage.daily = { count: 0, date: this.getTodayKey(), actions: [] };
        this.saveUsage();
      }
    }

    checkMonthlyReset() {
      if (this.usage.monthly.month !== this.getMonthKey()) {
        this.usage.monthly = { count: 0, month: this.getMonthKey() };
        this.saveUsage();
      }
    }

    setupDailyReset() {
      setInterval(() => { this.checkDailyReset(); this.checkMonthlyReset(); }, 60000);
      this.checkDailyReset();
      this.checkMonthlyReset();
    }

    canMakeRequest(action = 'ai_request') {
      const user = this.getUser();
      if (!user) return { allowed: false, reason: 'Not logged in' };
      if (user.isAdmin) return { allowed: true };
      if (this.isPlanExpired()) return { allowed: false, reason: 'Plan expired' };
      this.checkDailyReset();
      const dailyLimit = this.getDailyLimit();
      if (this.usage.daily.count >= dailyLimit) {
        return { allowed: false, reason: `Daily limit reached (${dailyLimit}/${dailyLimit}). Resets at midnight UTC.` };
      }
      return { allowed: true };
    }

    recordUsage(action = 'ai_request') {
      const user = this.getUser();
      if (!user) return false;
      if (user.isAdmin) return true;
      this.checkDailyReset();
      this.checkMonthlyReset();
      this.usage.daily.count++;
      this.usage.daily.actions.push({ action, timestamp: Date.now() });
      this.usage.monthly.count++;
      this.usage.history.push({ action, count: 1, date: Date.now() });
      if (this.usage.history.length > 1000) this.usage.history = this.usage.history.slice(-1000);
      this.saveUsage();
      return true;
    }

    getUsageStats() {
      const user = this.getUser();
      if (!user) return null;
      this.checkDailyReset();
      this.checkMonthlyReset();
      const dailyLimit = this.getDailyLimit();
      const monthlyLimit = this.getMonthlyLimit();
      return {
        daily: {
          used: this.usage.daily.count, limit: dailyLimit,
          remaining: Math.max(0, dailyLimit - this.usage.daily.count),
          percent: Math.round((this.usage.daily.count / dailyLimit) * 100),
          resetsIn: this.getTimeUntilReset('daily')
        },
        monthly: {
          used: this.usage.monthly.count, limit: monthlyLimit,
          remaining: Math.max(0, monthlyLimit - this.usage.monthly.count),
          percent: Math.round((this.usage.monthly.count / monthlyLimit) * 100)
        },
        plan: user.plan, isAdmin: user.isAdmin
      };
    }

    getTimeUntilReset(type = 'daily') {
      const now = new Date();
      const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const ms = midnight - now;
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return { hours, minutes, totalMs: ms, formatted: `${hours}h ${minutes}m` };
    }

    getFeatureAccess(feature) { return this.hasAccess(feature); }

    getAccessibleFeatures() {
      const user = this.getUser();
      if (!user) return [];
      if (user.isAdmin) return ['*'];
      return [
        { id: 'wordlist_basic', name: 'Word List Generator (Basic)', plan: 'pro' },
        { id: 'templates_basic', name: 'Basic Templates (5)', plan: 'pro' },
        { id: 'grid_standard', name: 'Standard Grid Sizes', plan: 'pro' },
        { id: 'pdf_5', name: 'PDF Export (5 pages)', plan: 'pro' },
        { id: 'wordlist_advanced', name: 'Word List Generator (Advanced)', plan: 'extrem' },
        { id: 'chat', name: 'AI Chat Assistant', plan: 'extrem' },
        { id: 'cover', name: 'Cover Concept Generator', plan: 'extrem' },
        { id: 'templates_extended', name: 'Extended Templates (12)', plan: 'extrem' },
        { id: 'grid_medium', name: 'Medium Grid Sizes', plan: 'extrem' },
        { id: 'pdf_50', name: 'PDF Export (50 pages)', plan: 'extrem' },
        { id: 'analytics_basic', name: 'Basic Analytics', plan: 'extrem' },
        { id: 'wordlist_bulk', name: 'Bulk Word Generation', plan: 'ultimate' },
        { id: 'deep_research', name: 'Deep Research & Analytics', plan: 'ultimate' },
        { id: 'templates_all', name: 'All Templates', plan: 'ultimate' },
        { id: 'grid_large', name: 'Large Grid Sizes', plan: 'ultimate' },
        { id: 'pdf_300', name: 'PDF Export (300 pages)', plan: 'ultimate' },
        { id: 'analytics_advanced', name: 'Advanced Analytics', plan: 'ultimate' },
        { id: 'premium_ai', name: 'Premium AI Models', plan: 'ultimate' },
        { id: 'priority_support', name: 'Priority Support', plan: 'ultimate' },
        { id: 'early_access', name: 'Early Access to New Features', plan: 'ultimate' }
      ].filter(f => this.hasAccess(f.id));
    }

    getUpgradeSuggestion() {
      const stats = this.getUsageStats();
      if (!stats) return null;
      if (stats.daily.remaining === 0) {
        return {
          type: 'limit_reached', message: "You've reached your daily limit",
          suggestPlan: stats.plan === 'pro' ? 'extrem' : 'ultimate',
          reason: stats.plan === 'pro' ? 'Upgrade to Extrem for 25 daily requests and access to AI Chat and Cover Generator' : 'Upgrade to Ultimate for 100 daily requests and all features'
        };
      }
      if (stats.plan === 'pro' && stats.daily.percent >= 70) {
        return { type: 'approaching_limit', message: "You're approaching your daily limit", suggestPlan: 'extrem', reason: 'Upgrade to Extrem for more requests and advanced features' };
      }
      return null;
    }
  }

  // Create singleton (only if not already created)
  if (!window.MXD_AUTH) {
    window.MXD_AUTH = new MXDAuth();
  }
  window.MXD_SUBSCRIPTION = window.MXD_AUTH;
  window.MXDAuth = MXDAuth;

  console.log('✅ MXD Auth system loaded (extended version)');
})();

// ============ UI MODALS (React Components) ============
(function(){
  if (typeof window === 'undefined' || !window.React) return;

  const { useState } = window.React;

  window.MxdLoginModal = function({ onClose, onLogin, onRegister, onAdminLogin }) {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [adminCode, setAdminCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
      if (!email || !password) { setError('Please fill in all fields'); return; }
      setLoading(true);
      setError('');
      try {
        const result = window.MXD_AUTH?.login(email, password);
        if (result?.success) {
          onLogin(result.user);
        } else {
          setError(result?.error || 'Login failed');
        }
      } catch (e) { setError(e.message); }
      setLoading(false);
    };

    const handleRegister = async () => {
      if (!name || !email || !password) { setError('Please fill in all fields'); return; }
      setLoading(true);
      setError('');
      try {
        const result = window.MXD_AUTH?.register(name, email, password, referralCode || null);
        if (result?.success) {
          onRegister(result.user);
        } else {
          setError(result?.error || 'Registration failed');
        }
      } catch (e) { setError(e.message); }
      setLoading(false);
    };

    const handleAdminLogin = async () => {
      if (!name || !email || !adminCode) { setError('Please fill in all fields'); return; }
      setLoading(true);
      setError('');
      try {
        const result = window.MXD_AUTH?.adminLogin(name, email, adminCode);
        if (result?.success) {
          onAdminLogin(name, email, adminCode);
        } else {
          setError(result?.error || 'Admin login failed');
        }
      } catch (e) { setError(e.message); }
      setLoading(false);
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Welcome to MXD Word Search</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
            <button className={mode === 'admin' ? 'active' : ''} onClick={() => setMode('admin')}>Admin</button>
          </div>
          <div className="modal-body">
            {mode === 'login' && (
              <div className="modal-form">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <button className="btn btn-pri btn-full" onClick={handleLogin} disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            )}
            {mode === 'register' && (
              <div className="modal-form">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label>Referral Code (optional)</label>
                  <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="REF..." />
                </div>
                <button className="btn btn-pri btn-full" onClick={handleRegister} disabled={loading}>
                  {loading ? 'Creating account...' : 'Register'}
                </button>
              </div>
            )}
            {mode === 'admin' && (
              <div className="modal-form">
                <div className="form-group">
                  <label>Admin Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Admin name" />
                </div>
                <div className="form-group">
                  <label>Admin Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mohamedxdragon1999@gmail.com" />
                </div>
                <div className="form-group">
                  <label>Secret Code</label>
                  <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)} placeholder="••••••••" />
                </div>
                <button className="btn btn-pri btn-full" onClick={handleAdminLogin} disabled={loading}>
                  {loading ? 'Verifying...' : 'Admin Login'}
                </button>
              </div>
            )}
            {error && <div className="form-error">{error}</div>}
          </div>
        </div>
      </div>
    );
  };

  window.MxdPlanModal = function({ onSelectPlan, onClose }) {
    const plans = [
      { id: 'pro', name: 'Pro', price: 'Free', features: ['Basic word generation', '5 PDF pages', 'Standard templates', 'Email support'], color: '#3b82f6' },
      { id: 'extrem', name: 'Extrem', price: '$4.99/mo', features: ['Advanced AI words', '50 PDF pages', 'All templates', 'Priority support', 'KDP Studio'], color: '#8b5cf6' },
      { id: 'ultimate', name: 'Ultimate', price: '$9.99/mo', features: ['Premium AI', '300 PDF pages', 'Bulk generation', 'Analytics', 'Early access'], color: '#c9a227' }
    ];

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-content-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Choose Your Plan</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <div className="plan-grid">
              {plans.map(plan => (
                <div key={plan.id} className="plan-card" style={{ borderColor: plan.color }}>
                  <div className="plan-header" style={{ background: plan.color }}>
                    <h3>{plan.name}</h3>
                    <div className="plan-price">{plan.price}</div>
                  </div>
                  <div className="plan-features">
                    {plan.features.map((f, i) => <div key={i}>✓ {f}</div>)}
                  </div>
                  <button className="btn btn-pri btn-full" onClick={() => onSelectPlan(plan.id)}>
                    Select {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  window.showPlanModal = function() {
    const event = new CustomEvent('mxd-show-plan-modal');
    window.dispatchEvent(event);
  };

  console.log('✅ MXD Auth UI Modals loaded');
})();