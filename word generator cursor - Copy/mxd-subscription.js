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