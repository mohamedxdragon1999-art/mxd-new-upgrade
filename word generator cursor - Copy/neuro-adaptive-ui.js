// neuro-adaptive-ui.jsx — MXD OMNI-NEXUS v11.0 Neuro-Adaptive Accessibility
// User behavior tracking and struggle detection
(function() {
  'use strict';

  const NEURO_VERSION = '11.0.0';

  // Track user behaviors
  class UserBehaviorTracker {
    constructor() {
      this.behaviors = [];
      this.struggles = [];
      this.clicks = [];
      this.mouseMovements = [];
      this.lastClickTime = 0;
      this.clickTargets = new Map();
      this.init();
    }

    init() {
      this.startTracking();
      console.log(`🧠 Neuro-Adaptive UI v${NEURO_VERSION} initialized`);
    }

    startTracking() {
      // Track clicks
      document.addEventListener('click', (e) => {
        const now = Date.now();
        const target = e.target;
        const rect = target.getBoundingClientRect();
        
        const clickData = {
          timestamp: now,
          target: target.tagName,
          id: target.id || '',
          className: target.className || '',
          text: target.textContent?.trim().substring(0, 50) || '',
          x: e.clientX,
          y: e.clientY,
          width: rect.width,
          height: rect.height
        };

        this.clicks.push(clickData);
        this.analyzeClick(clickData);

        // Keep only last 100 clicks
        if (this.clicks.length > 100) this.clicks.shift();
      });

      // Track mouse movements
      document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        
        // Only track every 100ms to reduce overhead
        if (now - (this.lastMouseMove || 0) < 100) return;
        this.lastMouseMove = now;

        this.mouseMovements.push({
          timestamp: now,
          x: e.clientX,
          y: e.clientY,
          path: []
        });

        if (this.mouseMovements.length > 50) this.mouseMovements.shift();
      });

      // Track hover for struggle detection
      document.addEventListener('mouseover', (e) => {
        const target = e.target;
        const now = Date.now();
        
        // Track how long user hovers on elements
        if (target.dataset.hoverStart) {
          const hoverDuration = now - parseInt(target.dataset.hoverStart);
          if (hoverDuration > 3000) { // 3 seconds hover = potential struggle
            this.detectStruggle(target, 'prolonged_hover', hoverDuration);
          }
        }
        target.dataset.hoverStart = now.toString();
      });
    }

    analyzeClick(clickData) {
      const timeSinceLastClick = clickData.timestamp - this.lastClickTime;
      this.lastClickTime = clickData.timestamp;

      // Detect rapid clicking (frustration indicator)
      if (timeSinceLastClick < 200 && this.clicks.length > 3) {
        const recentClicks = this.clicks.slice(-3);
        const sameTarget = recentClicks.every(c => 
          c.target === clickData.target && 
          c.id === clickData.id
        );
        
        if (sameTarget) {
          this.detectStruggle(clickData.target, 'repeated_clicks', recentClicks.length);
        }
      }

      // Track click target frequency
      const key = `${clickData.target}-${clickData.id || clickData.text}`;
      const count = this.clickTargets.get(key) || 0;
      this.clickTargets.set(key, count + 1);
      
      // If clicking same target 3+ times, might be confusion
      if (count >= 3) {
        this.detectStruggle(clickData.target, 'multiple_same_target', count);
      }
    }

    detectStruggle(target, type, value) {
      const struggle = {
        timestamp: Date.now(),
        type,
        value,
        target: target.tagName,
        id: target.id || '',
        className: target.className || ''
      };

      this.struggles.push(struggle);
      if (this.struggles.length > 50) this.struggles.shift();

      // Apply automatic adaptation
      this.applyAdaptation(struggle);
    }

    applyAdaptation(struggle) {
      const adaptations = {
        repeated_clicks: () => {
          // Highlight correct buttons
          this.highlightCorrectTool(struggle.target);
          // Scale up interactive elements
          this.scaleUpUI(struggle.target);
        },
        multiple_same_target: () => {
          // Show tooltip with guidance
          this.showGuidance(struggle.target);
          // Add visual arrow pointing to correct element
          this.showCorrectPath(struggle.target);
        },
        prolonged_hover: () => {
          // Simplify sidebar
          this.simplifySidebar();
          // Increase text size
          this.increaseTextSize();
        }
      };

      const adapt = adaptations[struggle.type];
      if (adapt) adapt();
    }

    highlightCorrectTool(confusedElement) {
      // Find related correct tools and highlight them
      const sidebarButtons = document.querySelectorAll('.sec-hd, .btn, .sh-btn');
      
      sidebarButtons.forEach(btn => {
        btn.style.transition = 'all 0.3s ease';
        btn.style.boxShadow = '0 0 15px rgba(201, 162, 39, 0.8)';
        
        setTimeout(() => {
          btn.style.boxShadow = '';
        }, 3000);
      });
    }

    scaleUpUI(target) {
      const parent = target.closest('.sb') || target.closest('.sec-body');
      if (parent) {
        parent.style.transform = 'scale(1.05)';
        parent.style.transformOrigin = 'top left';
        parent.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
          parent.style.transform = '';
        }, 2000);
      }
    }

    showGuidance(target) {
      // Create guidance tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'neuro-guidance-tooltip';
      tooltip.innerHTML = '💡 Tip: Try clicking the button below instead!';
      tooltip.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #c9a227;
        color: #09090b;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
      `;
      
      document.body.appendChild(tooltip);
      
      setTimeout(() => {
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip.remove(), 300);
      }, 4000);
    }

    showCorrectPath(target) {
      // Find correct element based on context
      const correctElements = document.querySelectorAll('.btn-pri, .btn-ok');
      if (correctElements.length > 0) {
        correctElements[0].style.animation = 'pulse 0.5s ease infinite';
        setTimeout(() => {
          correctElements[0].style.animation = '';
        }, 5000);
      }
    }

    simplifySidebar() {
      // Hide complex sections
      const sections = document.querySelectorAll('.sec');
      sections.forEach((sec, i) => {
        if (i > 3) { // Keep only first 3 sections open
          const hd = sec.querySelector('.sec-hd');
          if (hd) hd.click();
        }
      });
    }

    increaseTextSize() {
      document.body.style.fontSize = '18px';
      document.body.style.transition = 'font-size 0.3s ease';
      
      setTimeout(() => {
        document.body.style.fontSize = '';
      }, 10000);
    }

    getStats() {
      return {
        totalClicks: this.clicks.length,
        totalStruggles: this.struggles.length,
        clickTargets: Object.fromEntries(this.clickTargets),
        recentStruggles: this.struggles.slice(-10)
      };
    }

    reset() {
      this.behaviors = [];
      this.struggles = [];
      this.clicks = [];
      this.mouseMovements = [];
    }
  }

  // Initialize global tracker
  window.UserBehaviorTracker = new UserBehaviorTracker();
  window.MXD_NEURO = UserBehaviorTracker;

})();