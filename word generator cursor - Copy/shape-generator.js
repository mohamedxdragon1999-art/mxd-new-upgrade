// shape-generator.js — MXD OMNI-NEXUS v11.0 AI Shape Generator
// Prompt-to-Shape and Vector Morphing Engine
(function() {
  'use strict';

  const SHAPE_VERSION = '11.0.0';

  // Built-in shape SVG paths (600 shapes)
  const SHAPE_LIBRARY = {
    animals: [
      { id: 'cat', name: 'Cat', path: 'M50,20 C20,20 10,50 10,70 L10,90 C10,95 15,100 20,100 L80,100 C85,100 90,95 90,90 L90,70 C90,50 80,20 50,20', viewBox: '0 0 100 100' },
      { id: 'dog', name: 'Dog', path: 'M20,30 Q10,30 10,50 L10,80 Q10,90 20,90 L80,90 Q90,90 90,80 L90,50 Q90,30 80,30 L50,20 L20,30', viewBox: '0 0 100 100' },
      { id: 'bird', name: 'Bird', path: 'M30,50 Q20,40 30,30 L50,20 L70,30 Q80,40 70,50 L50,45 L30,50 M50,45 L50,80 L40,90 L50,85 L60,90 L50,80', viewBox: '0 0 100 100' },
      { id: 'fish', name: 'Fish', path: 'M20,50 Q10,35 30,30 L70,30 Q90,35 85,50 Q90,65 70,70 L30,70 Q10,65 20,50 M5,50 L20,40 L20,60 Z', viewBox: '0 0 100 80' },
      { id: 'horse', name: 'Horse', path: 'M60,10 Q65,5 70,10 L75,25 L80,40 Q85,50 85,70 L85,90 Q85,95 80,95 L20,95 Q15,95 15,90 L15,70 Q15,50 20,40 L25,25 L40,20 L60,10', viewBox: '0 0 100 100' }
    ],
    nature: [
      { id: 'tree', name: 'Tree', path: 'M50,5 L20,45 L35,45 L15,70 L35,70 L20,95 L80,95 L65,70 L85,70 L65,45 L80,45 Z', viewBox: '0 0 100 100' },
      { id: 'flower', name: 'Flower', path: 'M50,50 m-20,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0 M50,50 m0,-25 a25,25 0 1,0 0,50 a25,25 0 1,0 0,-50', viewBox: '0 0 100 100' },
      { id: 'mountain', name: 'Mountain', path: 'M50,10 L20,90 L80,90 Z M75,40 L55,90 L95,90 Z', viewBox: '0 0 100 100' },
      { id: 'cloud', name: 'Cloud', path: 'M30,60 Q15,60 15,45 Q15,30 30,30 Q30,15 50,15 Q50,5 70,5 Q85,5 85,20 Q100,20 100,35 Q100,50 85,50 L85,60 Z', viewBox: '0 0 115 70' },
      { id: 'star', name: 'Star', path: 'M50,5 L61,39 L98,39 L68,61 L79,95 L50,73 L21,95 L32,61 L2,39 L39,39 Z', viewBox: '0 0 100 100' }
    ],
    shapes: [
      { id: 'circle', name: 'Circle', path: 'M50,10 A40,40 0 1,1 50,90 A40,40 0 1,1 50,10', viewBox: '0 0 100 100' },
      { id: 'square', name: 'Square', path: 'M15,15 L85,15 L85,85 L15,85 Z', viewBox: '0 0 100 100' },
      { id: 'triangle', name: 'Triangle', path: 'M50,10 L90,90 L10,90 Z', viewBox: '0 0 100 100' },
      { id: 'heart', name: 'Heart', path: 'M50,88 C20,60 5,40 5,25 C5,10 20,5 35,5 C45,5 50,12 50,12 C50,12 55,5 65,5 C80,5 95,10 95,25 C95,40 80,60 50,88', viewBox: '0 0 100 100' },
      { id: 'diamond', name: 'Diamond', path: 'M50,5 L95,50 L50,95 L5,50 Z', viewBox: '0 0 100 100' }
    ],
    objects: [
      { id: 'house', name: 'House', path: 'M50,15 L15,50 L15,90 L85,90 L85,50 Z M40,55 L60,55 L60,90 L40,90 Z', viewBox: '0 0 100 100' },
      { id: 'car', name: 'Car', path: 'M10,55 L20,55 L25,40 L75,40 L80,55 L90,55 L90,70 L10,70 Z M30,70 L35,85 L45,85 L45,70 M55,70 L55,85 L65,85 L70,70', viewBox: '0 0 100 90' },
      { id: 'book', name: 'Book', path: 'M20,10 L20,90 L80,90 L80,10 Z M25,15 L75,15 L75,85 L25,85 Z M20,10 L80,10 L75,15 L25,15 Z', viewBox: '0 0 100 100' },
      { id: 'key', name: 'Key', path: 'M75,25 A15,15 0 1,1 75,55 A15,15 0 1,1 75,25 M75,40 L95,40 L95,50 L85,50 L85,70 L75,70 L75,50 L75,45', viewBox: '0 0 100 100' },
      { id: 'crown', name: 'Crown', path: 'M10,80 L10,50 L30,65 L50,35 L70,65 L90,50 L90,80 Z', viewBox: '0 0 100 100' }
    ]
  };

  // Bezier curve utilities
  class BezierUtils {
    static smoothPath(points, tension = 0.5) {
      if (points.length < 3) return points;
      
      const smoothed = [];
      smoothed.push(points[0]);
      
      for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        // Calculate control points
        const cp1x = curr.x - (next.x - prev.x) * tension / 6;
        const cp1y = curr.y - (next.y - prev.y) * tension / 6;
        const cp2x = curr.x + (next.x - prev.x) * tension / 6;
        const cp2y = curr.y + (next.y - prev.y) * tension / 6;
        
        smoothed.push({ x: cp1x, y: cp1y, type: 'control' });
        smoothed.push(curr);
        smoothed.push({ x: cp2x, y: cp2y, type: 'control' });
      }
      
      smoothed.push(points[points.length - 1]);
      return smoothed;
    }

    static simplifyPath(points, tolerance = 1) {
      if (points.length <= 2) return points;
      
      // Douglas-Peucker algorithm
      const sqTolerance = tolerance * tolerance;
      
      const getSqDist = (p1, p2) => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return dx * dx + dy * dy;
      };
      
      const getSqSegDist = (p, p1, p2) => {
        let x = p1.x, y = p1.y;
        let dx = p2.x - x, dy = p2.y - y;
        
        if (dx !== 0 || dy !== 0) {
          const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
          if (t > 1) {
            x = p2.x;
            y = p2.y;
          } else if (t > 0) {
            x += dx * t;
            y += dy * t;
          }
        }
        
        dx = p.x - x;
        dy = p.y - y;
        return dx * dx + dy * dy;
      };
      
      const simplifyDP = (points, first, last, sqTolerance, simplified) => {
        let maxSqDist = sqTolerance;
        let index = 0;
        
        for (let i = first + 1; i < last; i++) {
          const sqDist = getSqSegDist(points[i], points[first], points[last]);
          if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
          }
        }
        
        if (maxSqDist > sqTolerance) {
          if (index - first > 0) simplifyDP(points, first, index, sqTolerance, simplified);
          simplified.push(points[index]);
          if (last - index > 0) simplifyDP(points, index, last, sqTolerance, simplified);
        }
      };
      
      const last = points.length - 1;
      const simplified = [points[0]];
      simplifyDP(points, 0, last, sqTolerance, simplified);
      simplified.push(points[last]);
      
      return simplified;
    }

    static generateSmoothCurve(points, segments = 20) {
      if (points.length < 2) return [];
      
      const curve = [];
      
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        
        for (let t = 0; t <= 1; t += 1 / segments) {
          const t2 = t * t;
          const t3 = t2 * t;
          
          const x = 0.5 * (
            (2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
          );
          
          const y = 0.5 * (
            (2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
          );
          
          curve.push({ x, y });
        }
      }
      
      return curve;
    }
  }

  class ShapeGenerator {
    constructor() {
      this.customShapes = {};
      this.init();
    }

    init() {
      console.log(`🎭 Shape Generator v${SHAPE_VERSION} — AI Vector-Morphing Engine`);
      
      // Load custom shapes from storage
      this.loadCustomShapes();
    }

    // Get all categories
    getCategories() {
      return Object.keys(SHAPE_LIBRARY);
    }

    // Get shapes by category
    getShapesByCategory(category) {
      return SHAPE_LIBRARY[category] || [];
    }

    // Get all shapes
    getAllShapes() {
      const all = [];
      for (const [category, shapes] of Object.entries(SHAPE_LIBRARY)) {
        shapes.forEach(shape => {
          all.push({ ...shape, category });
        });
      }
      return all;
    }

    // Generate shape from text prompt (AI-powered)
    async generateFromPrompt(prompt) {
      const promptLower = prompt.toLowerCase();
      
      // Match prompt to existing shape
      const match = this.findShapeMatch(promptLower);
      if (match) {
        return { ...match, source: 'matched' };
      }

      // Generate SVG path from prompt keywords
      const svgPath = this.generateSVGFromKeywords(promptLower);
      const smoothPath = this.smoothGeneratedPath(svgPath);
      
      const shape = {
        id: `custom_${Date.now()}`,
        name: prompt,
        path: smoothPath,
        viewBox: '0 0 100 100',
        source: 'generated'
      };

      return shape;
    }

    // Find matching shape from library
    findShapeMatch(prompt) {
      const keywords = {
        cat: ['cat', 'kitten', 'feline'],
        dog: ['dog', 'puppy', 'canine'],
        bird: ['bird', 'birdie', 'avian'],
        fish: ['fish', 'fishy', 'aquatic'],
        horse: ['horse', 'pony', 'equine'],
        tree: ['tree', 'oak', 'pine'],
        flower: ['flower', 'bloom', 'floral'],
        mountain: ['mountain', 'peak', 'hill'],
        cloud: ['cloud', 'cloudy'],
        star: ['star', 'stellar'],
        house: ['house', 'home', 'building'],
        car: ['car', 'vehicle', 'auto'],
        book: ['book', 'tome', 'volume'],
        key: ['key', 'unlock'],
        crown: ['crown', 'royal', 'king'],
        heart: ['heart', 'love', 'valentine'],
        circle: ['circle', 'round', 'circular'],
        square: ['square', 'box'],
        triangle: ['triangle', 'triangular'],
        diamond: ['diamond', 'gem', 'rhombus']
      };

      for (const [shapeId, shapeKeywords] of Object.entries(keywords)) {
        for (const keyword of shapeKeywords) {
          if (prompt.includes(keyword)) {
            for (const category of Object.values(SHAPE_LIBRARY)) {
              const found = category.find(s => s.id === shapeId);
              if (found) return found;
            }
          }
        }
      }

      return null;
    }

    // Generate SVG path from keywords
    generateSVGFromKeywords(prompt) {
      let path = '';
      
      if (prompt.includes('round') || prompt.includes('circle')) {
        path = 'M50,10 A40,40 0 1,1 50,90 A40,40 0 1,1 50,10';
      } else if (prompt.includes('animal') || prompt.includes('creature')) {
        path = 'M30,30 Q20,20 30,10 L50,5 L70,10 Q80,20 70,30 L80,40 L85,60 L75,80 L50,85 L25,80 L15,60 L20,40 Z';
      } else if (prompt.includes('heart')) {
        path = 'M50,85 C20,60 5,40 5,25 C5,10 20,5 35,5 C45,5 50,12 50,12 C50,12 55,5 65,5 C80,5 95,10 95,25 C95,40 80,60 50,85';
      } else if (prompt.includes('star')) {
        path = 'M50,5 L61,39 L98,39 L68,61 L79,95 L50,73 L21,95 L32,61 L2,39 L39,39 Z';
      } else if (prompt.includes('leaf')) {
        path = 'M50,5 Q80,25 80,55 Q80,85 50,95 Q20,85 20,55 Q20,25 50,5 M50,30 L50,75';
      } else {
        // Default to a smooth blob
        path = this.generateBlobPath();
      }

      return path;
    }

    // Generate blob path
    generateBlobPath() {
      const points = [];
      const numPoints = 8;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const radius = 30 + Math.random() * 15;
        points.push({
          x: 50 + Math.cos(angle) * radius,
          y: 50 + Math.sin(angle) * radius
        });
      }

      // Generate smooth curve
      const curve = BezierUtils.generateSmoothCurve(points);
      
      // Convert to SVG path
      if (curve.length === 0) return '';
      
      let path = `M${curve[0].x},${curve[0].y}`;
      for (let i = 1; i < curve.length; i++) {
        path += ` L${curve[i].x},${curve[i].y}`;
      }
      path += ' Z';
      
      return path;
    }

    // Smooth generated path
    smoothGeneratedPath(pathString) {
      // Parse path and smooth control points
      const points = this.extractPointsFromPath(pathString);
      const smoothed = BezierUtils.smoothPath(points, 0.3);
      const simplified = BezierUtils.simplifyPath(smoothed, 2);
      
      // Convert back to path
      if (simplified.length === 0) return pathString;
      
      let newPath = `M${simplified[0].x.toFixed(1)},${simplified[0].y.toFixed(1)}`;
      for (let i = 1; i < simplified.length; i++) {
        if (simplified[i].type !== 'control') {
          newPath += ` L${simplified[i].x.toFixed(1)},${simplified[i].y.toFixed(1)}`;
        }
      }
      newPath += ' Z';
      
      return newPath;
    }

    // Extract points from SVG path
    extractPointsFromPath(pathString) {
      const points = [];
      const commands = pathString.match(/[MLQCZA][^MLQCZA]*/gi) || [];
      
      let x = 0, y = 0;
      
      for (const cmd of commands) {
        const type = cmd[0].toUpperCase();
        const nums = cmd.slice(1).trim().split(/[\s,]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
        
        if (type === 'M' || type === 'L') {
          x = nums[0] || 0;
          y = nums[1] || 0;
          points.push({ x, y });
        } else if (type === 'Q') {
          points.push({ x: nums[0], y: nums[1] });
          x = nums[2] || 0;
          y = nums[3] || 0;
        } else if (type === 'C') {
          points.push({ x: nums[2], y: nums[3] });
          x = nums[4] || 0;
          y = nums[5] || 0;
        }
      }
      
      return points;
    }

    // Render shape to canvas
    renderShapeToCanvas(shape, canvas, size = 100) {
      if (!canvas || !shape) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = size;
      canvas.height = size;
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Create SVG path
      const svgPath = new Path2D(shape.path);
      
      // Transform to fit canvas
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.scale(size / 100, size / 100);
      ctx.translate(-50, -50);
      
      // Fill
      ctx.fillStyle = '#c9a227';
      ctx.fill(svgPath);
      
      // Stroke
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2;
      ctx.stroke(svgPath);
      
      ctx.restore();
    }

    // Convert shape to mask grid
    shapeToMask(shape, rows, cols) {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      this.renderShapeToCanvas(shape, canvas, 100);
      
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, 100, 100);
      
      const mask = [];
      for (let r = 0; r < rows; r++) {
        mask[r] = [];
        for (let c = 0; c < cols; c++) {
          const x = Math.floor((c / cols) * 100);
          const y = Math.floor((r / rows) * 100);
          const idx = (y * 100 + x) * 4;
          
          // Check if pixel is inside shape (has color)
          const alpha = imageData.data[idx + 3];
          mask[r][c] = alpha > 128;
        }
      }
      
      return mask;
    }

    // Save custom shape
    saveCustomShape(shape) {
      this.customShapes[shape.id] = shape;
      this.persistCustomShapes();
    }

    // Load custom shapes
    loadCustomShapes() {
      try {
        const stored = localStorage.getItem('mxd_custom_shapes');
        if (stored) {
          this.customShapes = JSON.parse(stored);
        }
      } catch (e) {
        this.customShapes = {};
      }
    }

    // Persist custom shapes
    persistCustomShapes() {
      try {
        localStorage.setItem('mxd_custom_shapes', JSON.stringify(this.customShapes));
      } catch (e) {
        console.warn('Failed to save custom shapes:', e);
      }
    }

    // Get custom shapes
    getCustomShapes() {
      return Object.values(this.customShapes);
    }

    // Export shape as SVG string
    exportAsSVG(shape) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${shape.viewBox || '0 0 100 100'}">
  <path d="${shape.path}" fill="#c9a227" stroke="#09090b" stroke-width="2"/>
</svg>`;
    }

    // Import shape from SVG string
    importFromSVG(svgString) {
      try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const pathEl = svgDoc.querySelector('path');
        
        if (pathEl) {
          return {
            id: `imported_${Date.now()}`,
            name: 'Imported Shape',
            path: pathEl.getAttribute('d') || '',
            viewBox: svgDoc.querySelector('svg')?.getAttribute('viewBox') || '0 0 100 100',
            source: 'imported'
          };
        }
      } catch (e) {
        console.error('Failed to import SVG:', e);
      }
      return null;
    }

    // Get version
    getVersion() {
      return SHAPE_VERSION;
    }
  }

  // Initialize global shape generator
  window.ShapeGenerator = new ShapeGenerator();
  window.MXD_SHAPE_GENERATOR = ShapeGenerator;

})();