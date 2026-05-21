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

  var useState = window.React.useState;
  var createElement = window.React.createElement;

  window.MxdLoginModal = function(props) {
    var onClose = props.onClose, onLogin = props.onLogin, onRegister = props.onRegister, onAdminLogin = props.onAdminLogin;
    var state = useState('login'); var mode = state[0], setMode = state[1];
    var state2 = useState(''); var email = state2[0], setEmail = state2[1];
    var state3 = useState(''); var password = state3[0], setPassword = state3[1];
    var state4 = useState(''); var name = state4[0], setName = state4[1];
    var state5 = useState(''); var referralCode = state5[0], setReferralCode = state5[1];
    var state6 = useState(''); var adminCode = state6[0], setAdminCode = state6[1];
    var state7 = useState(''); var error = state7[0], setError = state7[1];
    var state8 = useState(false); var loading = state8[0], setLoading = state8[1];

    var handleLogin = function() {
      if (!email || !password) { setError('Please fill in all fields'); return; }
      setLoading(true); setError('');
      try {
        var result = window.MXD_AUTH && window.MXD_AUTH.login(email, password);
        if (result && result.success) { onLogin(result.user); }
        else { setError((result && result.error) || 'Login failed'); }
      } catch (e) { setError(e.message); }
      setLoading(false);
    };

    var handleRegister = function() {
      if (!name || !email || !password) { setError('Please fill in all fields'); return; }
      setLoading(true); setError('');
      try {
        var result = window.MXD_AUTH && window.MXD_AUTH.register(name, email, password, referralCode || null);
        if (result && result.success) { onRegister(result.user); }
        else { setError((result && result.error) || 'Registration failed'); }
      } catch (e) { setError(e.message); }
      setLoading(false);
    };

    var handleAdminLogin = function() {
      if (!name || !email || !adminCode) { setError('Please fill in all fields'); return; }
      setLoading(true); setError('');
      try {
        var result = window.MXD_AUTH && window.MXD_AUTH.adminLogin(name, email, adminCode);
        if (result && result.success) { onAdminLogin(name, email, adminCode); }
        else { setError((result && result.error) || 'Admin login failed'); }
      } catch (e) { setError(e.message); }
      setLoading(false);
    };

    var formGroup = function(label, input) {
      return createElement('div', {className:'form-group'}, createElement('label', null, label), input);
    };

    var loginForm = createElement('div', {className:'modal-form'},
      formGroup('Email', createElement('input', {type:'email', value:email, onChange:function(e){setEmail(e.target.value);}, placeholder:'your@email.com'})),
      formGroup('Password', createElement('input', {type:'password', value:password, onChange:function(e){setPassword(e.target.value);}, placeholder:'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'})),
      createElement('button', {className:'btn btn-pri btn-full', onClick:handleLogin, disabled:loading}, loading ? 'Logging in...' : 'Login')
    );

    var registerForm = createElement('div', {className:'modal-form'},
      formGroup('Name', createElement('input', {type:'text', value:name, onChange:function(e){setName(e.target.value);}, placeholder:'Your name'})),
      formGroup('Email', createElement('input', {type:'email', value:email, onChange:function(e){setEmail(e.target.value);}, placeholder:'your@email.com'})),
      formGroup('Password', createElement('input', {type:'password', value:password, onChange:function(e){setPassword(e.target.value);}, placeholder:'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'})),
      formGroup('Referral Code (optional)', createElement('input', {type:'text', value:referralCode, onChange:function(e){setReferralCode(e.target.value);}, placeholder:'REF...'})),
      createElement('button', {className:'btn btn-pri btn-full', onClick:handleRegister, disabled:loading}, loading ? 'Creating account...' : 'Register')
    );

    var adminForm = createElement('div', {className:'modal-form'},
      formGroup('Admin Name', createElement('input', {type:'text', value:name, onChange:function(e){setName(e.target.value);}, placeholder:'Admin name'})),
      formGroup('Admin Email', createElement('input', {type:'email', value:email, onChange:function(e){setEmail(e.target.value);}, placeholder:'mohamedxdragon1999@gmail.com'})),
      formGroup('Secret Code', createElement('input', {type:'password', value:adminCode, onChange:function(e){setAdminCode(e.target.value);}, placeholder:'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'})),
      createElement('button', {className:'btn btn-pri btn-full', onClick:handleAdminLogin, disabled:loading}, loading ? 'Verifying...' : 'Admin Login')
    );

    var bodyContent = mode === 'login' ? loginForm : mode === 'register' ? registerForm : adminForm;

    return createElement('div', {className:'modal-overlay', onClick:onClose},
      createElement('div', {className:'modal-content', onClick:function(e){e.stopPropagation();}},
        createElement('div', {className:'modal-header'},
          createElement('h2', null, 'Welcome to MXD Word Search'),
          createElement('button', {className:'modal-close', onClick:onClose}, '\u2715')
        ),
        createElement('div', {className:'modal-tabs'},
          createElement('button', {className:mode==='login'?'active':'', onClick:function(){setMode('login');}}, 'Login'),
          createElement('button', {className:mode==='register'?'active':'', onClick:function(){setMode('register');}}, 'Register'),
          createElement('button', {className:mode==='admin'?'active':'', onClick:function(){setMode('admin');}}, 'Admin')
        ),
        createElement('div', {className:'modal-body'}, bodyContent, error ? createElement('div', {className:'form-error'}, error) : null)
      )
    );
  };

  window.MxdPlanModal = function(props) {
    var onSelectPlan = props.onSelectPlan, onClose = props.onClose;
    var plans = [
      { id: 'pro', name: 'Pro', price: 'Free', features: ['Basic word generation', '5 PDF pages', 'Standard templates', 'Email support'], color: '#3b82f6' },
      { id: 'extrem', name: 'Extrem', price: '$4.99/mo', features: ['Advanced AI words', '50 PDF pages', 'All templates', 'Priority support', 'KDP Studio'], color: '#8b5cf6' },
      { id: 'ultimate', name: 'Ultimate', price: '$9.99/mo', features: ['Premium AI', '300 PDF pages', 'Bulk generation', 'Analytics', 'Early access'], color: '#c9a227' }
    ];

    var planCards = plans.map(function(plan) {
      var featureEls = plan.features.map(function(f, i) { return createElement('div', {key:i}, '\u2713 ' + f); });
      return createElement('div', {key:plan.id, className:'plan-card', style:{borderColor:plan.color}},
        createElement('div', {className:'plan-header', style:{background:plan.color}},
          createElement('h3', null, plan.name),
          createElement('div', {className:'plan-price'}, plan.price)
        ),
        createElement('div', {className:'plan-features'}, featureEls),
        createElement('button', {className:'btn btn-pri btn-full', onClick:function(){onSelectPlan(plan.id);}}, 'Select ' + plan.name)
      );
    });

    return createElement('div', {className:'modal-overlay', onClick:onClose},
      createElement('div', {className:'modal-content modal-content-lg', onClick:function(e){e.stopPropagation();}},
        createElement('div', {className:'modal-header'},
          createElement('h2', null, 'Choose Your Plan'),
          createElement('button', {className:'modal-close', onClick:onClose}, '\u2715')
        ),
        createElement('div', {className:'modal-body'},
          createElement('div', {className:'plan-grid'}, planCards)
        )
      )
    );
  };

  window.showPlanModal = function() {
    var event = new CustomEvent('mxd-show-plan-modal');
    window.dispatchEvent(event);
  };

  console.log('MXD Auth UI Modals loaded');
})();
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
      const storedHash = localStorage.getItem('mxd_admin_hash');
      if (!storedHash) {
        return { success: false, error: 'Admin access not configured. Contact system administrator.' };
      }
      const inputHash = this.hashPassword(secretKey);
      if (inputHash === storedHash) {
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

    async setupAdminKey(secretKey) {
      const hash = this.hashPassword(secretKey);
      localStorage.setItem('mxd_admin_hash', hash);
      return { success: true, message: 'Admin key configured successfully' };
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
// mxd-api-keys.js — FREE API Keys Configuration
// All providers are 100% FREE. Get keys from the URLs below.

// ============ CLOUDFLARE WORKERS AI ============
window.MXD_API_KEYS = {
  cloudflare: { accountId: '', apiToken: '' }, // https://dash.cloudflare.com/
  groq: '', // https://console.groq.com/keys
  huggingface: '', // https://huggingface.co/settings/tokens
  replicate: '', // https://replicate.com/account/api-tokens
  gemini: '', // https://aistudio.google.com/app/apikey
  openrouter: '', // https://openrouter.ai/keys
  together: '' // https://api.together.xyz/settings/api-keys
};

// ============ PROVIDER INFO ============
/*
FREE PROVIDERS:
1. Cloudflare Workers AI - 10 req/10s, llama-3.1-8b
2. Groq - 30 req/min, llama-3.1-70b
3. Hugging Face - Free tier, llama-3.1-8b
4. Replicate - Free tier
5. Gemini - 1M tokens, 1.5-flash
6. OpenRouter - 20 req/min, claude-3-haiku
7. Together AI - Free tier, llama-3.1-70b

HOW TO GET KEYS:
- Cloudflare: https://dash.cloudflare.com/ → Workers AI
- Groq: https://console.groq.com/keys (free tier: 30 req/min)
- Hugging Face: https://huggingface.co/settings/tokens
- Gemini: https://aistudio.google.com/app/apikey (free tier: 15 req/min)
- OpenRouter: https://openrouter.ai/keys (free credits)
- Together: https://api.together.xyz/settings/api-keys

Add your keys above, then refresh the page.
*/
// mxd-subscription.js — Subscription Plans & Feature Access
(function() {
  'use strict';

  const SUBS_VERSION = '2.0.0';

  const PLANS = {
    free: {
      name: 'Free',
      price: 0,
      features: {
        gridSizes: ['small'],
        categories: ['basic'],
        shapes: ['square'],
        bulkGenerations: 1,
        apiCallsPerDay: 10,
        apiCallsPerMonth: 100,
        exportFormats: ['pdf'],
        priority: 0
      }
    },
    starter: {
      name: 'Starter',
      price: 4.99,
      features: {
        gridSizes: ['small', 'medium'],
        categories: ['basic', 'extended'],
        shapes: ['square', 'rectangle'],
        bulkGenerations: 5,
        apiCallsPerDay: 50,
        apiCallsPerMonth: 500,
        exportFormats: ['pdf', 'png'],
        priority: 1
      }
    },
    pro: {
      name: 'Pro',
      price: 9.99,
      features: {
        gridSizes: ['small', 'medium', 'large'],
        categories: ['basic', 'extended', 'premium'],
        shapes: ['square', 'rectangle', 'circle', 'triangle'],
        bulkGenerations: 20,
        apiCallsPerDay: 200,
        apiCallsPerMonth: 2000,
        exportFormats: ['pdf', 'png', 'svg'],
        priority: 2
      }
    },
    enterprise: {
      name: 'Enterprise',
      price: 29.99,
      features: {
        gridSizes: ['small', 'medium', 'large', 'xlarge'],
        categories: ['basic', 'extended', 'premium', 'custom'],
        shapes: ['square', 'rectangle', 'circle', 'triangle', 'custom', 'heart', 'star'],
        bulkGenerations: 100,
        apiCallsPerDay: 1000,
        apiCallsPerMonth: 10000,
        exportFormats: ['pdf', 'png', 'svg', 'html'],
        priority: 3
      }
    }
  };

  class MXDSubscription {
    constructor() {
      this.plans = PLANS;
      this.currentPlan = 'free';
      this.usage = {
        daily: { count: 0, date: this.getDateKey() },
        monthly: { count: 0, month: this.getMonthKey() }
      };
      this.listeners = {};
      this.init();
    }

    init() {
      this.loadUsage();
      this.checkPlanExpiry();
      console.log(`💎 MXD Subscription v${SUBS_VERSION} initialized`);
    }

    getDateKey() {
      return new Date().toISOString().split('T')[0];
    }

    getMonthKey() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    getPlanFeatures(plan = null) {
      if (!plan && window.MXD_AUTH?.currentUser) {
        plan = window.MXD_AUTH.currentUser.plan || 'free';
      }
      return this.plans[plan]?.features || this.plans.free.features;
    }

    hasFeature(feature, value = true) {
      const features = this.getPlanFeatures();
      const planFeature = features[feature];
      if (Array.isArray(planFeature)) {
        return planFeature.includes(value) || value === true;
      }
      return planFeature >= value;
    }

    canAccess(category, value) {
      return this.hasFeature(category, value);
    }

    checkLimit(type) {
      const features = this.getPlanFeatures();
      const limit = features[type];
      this.loadUsage();

      if (type === 'apiCallsPerDay') {
        if (this.usage.daily.date !== this.getDateKey()) {
          this.usage.daily = { count: 0, date: this.getDateKey() };
        }
        return {
          allowed: this.usage.daily.count < limit,
          used: this.usage.daily.count,
          limit,
          remaining: Math.max(0, limit - this.usage.daily.count)
        };
      }

      if (type === 'apiCallsPerMonth') {
        if (this.usage.monthly.month !== this.getMonthKey()) {
          this.usage.monthly = { count: 0, month: this.getMonthKey() };
        }
        return {
          allowed: this.usage.monthly.count < limit,
          used: this.usage.monthly.count,
          limit,
          remaining: Math.max(0, limit - this.usage.monthly.count)
        };
      }

      return { allowed: true, used: 0, limit: limit, remaining: limit };
    }

    recordUsage(type = 'apiCallsPerDay', count = 1) {
      this.loadUsage();
      this.usage.daily.count += count;
      this.usage.monthly.count += count;
      this.saveUsage();
      this.emit('usageUpdated', this.getUsageStats());
    }

    loadUsage() {
      try {
        const saved = localStorage.getItem('mxd_usage');
        if (saved) {
          const data = JSON.parse(saved);
          this.usage = data;
        }
      } catch (e) {}
    }

    saveUsage() {
      localStorage.setItem('mxd_usage', JSON.stringify(this.usage));
    }

    getUsageStats() {
      const dailyLimit = this.checkLimit('apiCallsPerDay');
      const monthlyLimit = this.checkLimit('apiCallsPerMonth');
      return {
        daily: dailyLimit,
        monthly: monthlyLimit,
        plan: window.MXD_AUTH?.currentUser?.plan || 'free'
      };
    }

    upgradePlan(plan) {
      if (!this.plans[plan]) {
        return { success: false, error: 'Invalid plan' };
      }
      if (window.MXD_AUTH?.currentUser) {
        window.MXD_AUTH.currentUser.plan = plan;
        window.MXD_AUTH.saveUser(window.MXD_AUTH.currentUser);
        this.emit('planUpgraded', { plan, price: this.plans[plan].price });
        return { success: true, plan, features: this.plans[plan].features };
      }
      return { success: false, error: 'Not logged in' };
    }

    checkPlanExpiry() {
      if (window.MXD_AUTH?.currentUser?.planExpiry) {
        const expiry = new Date(window.MXD_AUTH.currentUser.planExpiry);
        if (new Date() > expiry) {
          this.upgradePlan('free');
        }
      }
    }

    getAllPlans() {
      return Object.entries(this.plans).map(([id, plan]) => ({
        id,
        ...plan
      }));
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

  window.MXD_SUBSCRIPTION = new MXDSubscription();
  window.MXDSubscription = MXDSubscription;
  window.PLANS = PLANS;
})();
// This file runs first and sets up React hooks for all components
(function() {
    function initHooks() {
        if (!window.React) {
            setTimeout(initHooks, 50);
            return;
        }
        var React = window.React;
        window.__MXD_HOOKS__ = {
            useState: React.useState.bind(React),
            useEffect: React.useEffect.bind(React),
            useCallback: React.useCallback.bind(React),
            useRef: React.useRef.bind(React),
            useMemo: React.useMemo.bind(React),
            useContext: React.useContext.bind(React)
        };
        console.log('MXD Hooks initialized');
    }
    initHooks();
})();
