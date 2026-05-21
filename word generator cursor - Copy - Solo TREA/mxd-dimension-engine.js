// mxd-dimension-engine.js — Unified KDP/Print Dimension System
// Single source of truth for ALL trim sizes, margins, bleed, spine, and compliance
// Patterns from: zoyth/kdp-book-generator, vpuna/markdown-to-book,
//   BaseMax/book-cover-size-generator, PNW-Computers/SelfPublishing, opossum
(function(){
  'use strict';
  const VERSION = '1.0.0';

  // ========== CONSTANTS ==========
  const PT_PER_IN = 72;
  const MM_PER_IN = 25.4;
  const IN_PER_PT = 1 / PT_PER_IN;

  // ========== KDP GUTTER TIERS (from zoyth/kdp-book-generator + KDP official) ==========
  const GUTTER_TIERS = [
    { maxPages: 24, min: 0.375, recommended: 0.5 },
    { maxPages: 150, min: 0.375, recommended: 0.5 },
    { maxPages: 300, min: 0.5, recommended: 0.625 },
    { maxPages: 500, min: 0.625, recommended: 0.75 },
    { maxPages: 700, min: 0.75, recommended: 0.875 },
    { maxPages: 828, min: 0.875, recommended: 1.0 }
  ];

  // ========== PAPER PPI (from BaseMax/book-cover-size-generator) ==========
  const PAPER_PPI = {
    '50lb_white': 444,
    '50lb_cream': 444,
    '60lb_white': 400,
    '60lb_cream': 400,
    '70lb_white': 336,
    '70lb_cream': 336,
    '80lb_gloss': 300
  };

  // ========== TRIM SIZES (single source of truth) ==========
  // Each entry in inches. Derived from KDP official spec + IngramSpark + common sizes
  const TRIM_SIZES = {
    // KDP paperback
    'kdp_5x8':      { id: 'kdp_5x8',      name: '5" x 8" (KDP)',        w: 5,   h: 8,   category: 'kdp_pb',  recommended: true },
    'kdp_525x8':    { id: 'kdp_525x8',    name: '5.25" x 8" (KDP)',     w: 5.25,h: 8,   category: 'kdp_pb',  recommended: false },
    'kdp_55x85':    { id: 'kdp_55x85',    name: '5.5" x 8.5" (KDP)',    w: 5.5, h: 8.5, category: 'kdp_pb',  recommended: true },
    'kdp_6x9':      { id: 'kdp_6x9',      name: '6" x 9" (KDP)',         w: 6,   h: 9,   category: 'kdp_pb',  recommended: true },
    'kdp_7x10':     { id: 'kdp_7x10',     name: '7" x 10" (KDP)',        w: 7,   h: 10,  category: 'kdp_pb',  recommended: true },
    'kdp_75x925':   { id: 'kdp_75x925',   name: '7.5" x 9.25" (KDP)',    w: 7.5, h: 9.25,category: 'kdp_pb',  recommended: false },
    'kdp_8x10':     { id: 'kdp_8x10',     name: '8" x 10" (KDP)',        w: 8,   h: 10,  category: 'kdp_pb',  recommended: false },
    'kdp_85x11':    { id: 'kdp_85x11',    name: '8.5" x 11" (KDP)',      w: 8.5, h: 11,  category: 'kdp_pb',  recommended: true },
    // KDP hardcover
    'kdp_hc_6x9':   { id: 'kdp_hc_6x9',   name: '6" x 9" HC (KDP)',      w: 6,   h: 9,   category: 'kdp_hc',  recommended: true },
    'kdp_hc_85x11': { id: 'kdp_hc_85x11', name: '8.5" x 11" HC (KDP)',   w: 8.5, h: 11,  category: 'kdp_hc',  recommended: true },
    // US Standard
    'letter':       { id: 'letter',       name: 'US Letter 8.5x11',       w: 8.5, h: 11,  category: 'us',      recommended: true },
    'legal':        { id: 'legal',        name: 'US Legal 8.5x14',        w: 8.5, h: 14,  category: 'us',      recommended: false },
    'tabloid':      { id: 'tabloid',      name: 'US Tabloid 11x17',       w: 11,  h: 17,  category: 'us',      recommended: false },
    'half_letter':  { id: 'half_letter',  name: 'Half Letter 5.5x8.5',    w: 5.5, h: 8.5, category: 'us',      recommended: false },
    // A Series
    'a4':           { id: 'a4',           name: 'A4 210x297mm',           w: 8.27,h: 11.69,category: 'a',       recommended: true },
    'a5':           { id: 'a5',           name: 'A5 148x210mm',           w: 5.83,h: 8.27, category: 'a',       recommended: true },
    'a3':           { id: 'a3',           name: 'A3 297x420mm',           w: 11.69,h:16.54,category: 'a',       recommended: false },
    // Square (popular for activity books)
    'sq_6x6':       { id: 'sq_6x6',       name: '6" x 6" Square',         w: 6,   h: 6,   category: 'square',  recommended: true },
    'sq_8x8':       { id: 'sq_8x8',       name: '8" x 8" Square',         w: 8,   h: 8,   category: 'square',  recommended: true },
    'sq_10x10':     { id: 'sq_10x10',     name: '10" x 10" Square',       w: 10,  h: 10,  category: 'square',  recommended: true },
    'sq_85x11':     { id: 'sq_85x11',     name: '8.5" x 11" Square',      w: 8.5, h: 11,  category: 'square',  recommended: false },
    // Pocket/digest sizes
    'pocket_45x7':  { id: 'pocket_45x7',  name: '4.5" x 7" Pocket',       w: 4.5, h: 7,   category: 'pocket',  recommended: false },
    'digest_55x85': { id: 'digest_55x85', name: '5.5" x 8.5" Digest',     w: 5.5, h: 8.5, category: 'pocket',  recommended: false }
  };

  // ========== MARGIN PRESETS ==========
  const MARGIN_PRESETS = {
    tight:    { id: 'tight',    name: 'Tight',      top: 0.25,  bottom: 0.25,  inner: 0.375, outer: 0.25 },
    standard: { id: 'standard', name: 'Standard',   top: 0.389, bottom: 0.389, inner: 0.5,   outer: 0.389 },
    generous: { id: 'generous', name: 'Generous',   top: 0.556, bottom: 0.556, inner: 0.667, outer: 0.556 },
    custom:   { id: 'custom',   name: 'Custom...',  top: 0.389, bottom: 0.389, inner: 0.5,   outer: 0.389 }
  };

  // ========== POINT-BASED COMPATIBILITY MAPS ==========
  // For backward compat with existing TRIM_SIZES in index.html (612 = 8.5in * 72)
  const ID_TO_POINTS = {
    'letter': { w: 612, h: 792 },
    'a4': { w: 595, h: 842 },
    '6x9': { w: 432, h: 648 },
    '614x921': { w: 442, h: 663 },
    '7x10': { w: 504, h: 720 },
    '8x10': { w: 576, h: 720 },
    '55x85': { w: 396, h: 612 },
    '506x781': { w: 364, h: 562 },
    'kdp_6x9': { w: 432, h: 648 },
    'kdp_5x8': { w: 360, h: 576 },
    'kdp_55x85': { w: 396, h: 612 },
    'kdp_85x11': { w: 612, h: 792 },
    'kdp_525x8': { w: 378, h: 576 },
    'kdp_75x925': { w: 540, h: 666 },
    'kdp_hc_6x9': { w: 432, h: 648 },
    'kdp_hc_85x11': { w: 612, h: 792 },
    'legal': { w: 612, h: 1008 },
    'tabloid': { w: 792, h: 1224 },
    'half_letter': { w: 396, h: 612 },
    'a5': { w: 420, h: 595 },
    'a3': { w: 842, h: 1191 },
    'sq_6x6': { w: 432, h: 432 },
    'sq_8x8': { w: 576, h: 576 },
    'sq_10x10': { w: 720, h: 720 },
    'sq_85x11': { w: 612, h: 792 },
    'pocket_45x7': { w: 324, h: 504 },
    'digest_55x85': { w: 396, h: 612 }
  };

  // Map old IDs to new IDs
  const OLD_ID_MAP = {
    'letter': 'letter',
    'a4': 'a4',
    '6x9': 'kdp_6x9',
    '614x921': null,  // no exact match in KDP standards
    '7x10': 'kdp_7x10',
    '8x10': 'kdp_8x10',
    '55x85': 'kdp_55x85',
    '506x781': null
  };

  // ========== CORE CALCULATOR ==========
  function calculateAll(trimId, pageCount, bleed, bookType, pagePerInch) {
    trimId = OLD_ID_MAP[trimId] || trimId;
    var trim = TRIM_SIZES[trimId];
    if (!trim) trim = TRIM_SIZES['kdp_6x9'];

    var bw = bleed !== false && bleed !== 'false' && bleed !== 0;
    var bt = bookType === 'hardcover' ? 'hc' : 'pb';
    var ppi = pagePerInch || PAPER_PPI['60lb_white'];

    // Get gutter based on page count
    var gutter = getGutter(pageCount);
    var gutterMin = gutter.min;
    var gutterRec = gutter.recommended;

    // Margin presets from vpuna/markdown-to-book (trim-size specific)
    var marginRec = getRecommendedMargins(trim, bt);

    // Safe zone: 0.25" from trim (KDP requirement)
    var safeZoneIn = 0.25;

    // Bleed amount
    var bleedIn = bw ? 0.125 : 0;
    var bleedMm = bw ? 3.175 : 0;

    // Document size (for PDF)
    // KDP: bleed on top, bottom, and outside edges only (NOT gutter/bind side)
    var docW = trim.w + (bw ? bleedIn : 0);  // bleed only on outside edge
    var docH = trim.h + (bw ? bleedIn * 2 : 0); // bleed on top + bottom

    // When bleed is enabled, the full-bleed document size for 4-side bleed (e.g., cover)
    var docWFullBleed = trim.w + (bw ? bleedIn * 2 : 0);

    // Spine width (from BaseMax/book-cover-size-generator)
    var spineIn = (pageCount / 2) / ppi;

    // Usable content area (inside margins)
    var contentW = trim.w - marginRec.outer - marginRec.inner;
    var contentH = trim.h - marginRec.top - marginRec.bottom;

    // Safe content area (inside margins + safe zone)
    var safeContentW = trim.w - marginRec.outer - marginRec.inner - safeZoneIn * 2;
    var safeContentH = trim.h - marginRec.top - marginRec.bottom - safeZoneIn * 2;

    // Pixels at common DPIs
    function toPixels(inches, dpi) { return Math.round(inches * dpi); }

    var pixels = {};
    [72, 96, 150, 300, 600].forEach(function(d) {
      pixels[d] = {
        docW: toPixels(docW, d),
        docH: toPixels(docH, d),
        trimW: toPixels(trim.w, d),
        trimH: toPixels(trim.h, d),
        safeW: toPixels(safeContentW, d),
        safeH: toPixels(safeContentH, d),
        spineW: toPixels(spineIn, d),
        bleedPx: toPixels(bleedIn, d)
      };
    });

    return {
      // Input params echoed back
      trimId: trim.id,
      trimName: trim.name,
      pageCount: pageCount,
      bleed: bw,
      bookType: bt,
      ppi: ppi,

      // Trim
      trim: {
        id: trim.id,
        name: trim.name,
        w_in: trim.w,
        h_in: trim.h,
        w_mm: +(trim.w * MM_PER_IN).toFixed(2),
        h_mm: +(trim.h * MM_PER_IN).toFixed(2),
        w_pt: +(trim.w * PT_PER_IN).toFixed(1),
        h_pt: +(trim.h * PT_PER_IN).toFixed(1),
        wPx300: toPixels(trim.w, 300),
        hPx300: toPixels(trim.h, 300)
      },

      // Bleed
      bleed: {
        enabled: bw,
        amount_in: bleedIn,
        amount_mm: +bleedMm.toFixed(2),
        sides: bw ? ['top', 'bottom', 'outside'] : [],
        note: bw ? 'Applied to top, bottom, and outside edges only (not gutter)' : 'None'
      },

      // Document size for PDF
      documentSize: {
        w_in: +docW.toFixed(4),
        h_in: +docH.toFixed(4),
        w_mm: +(docW * MM_PER_IN).toFixed(2),
        h_mm: +(docH * MM_PER_IN).toFixed(2),
        w_pt: +(docW * PT_PER_IN).toFixed(1),
        h_pt: +(docH * PT_PER_IN).toFixed(1),
        wFullBleed_in: +docWFullBleed.toFixed(4)
      },

      // Safe zone (0.25" inside trim)
      safeZone: {
        in: safeZoneIn,
        mm: +(safeZoneIn * MM_PER_IN).toFixed(2),
        note: 'All critical text must be at least 0.25" inside the trim line'
      },

      // Margins
      margins: {
        top_in: marginRec.top,
        bottom_in: marginRec.bottom,
        inner_in: marginRec.inner,
        outer_in: marginRec.outer,
        top_mm: +(marginRec.top * MM_PER_IN).toFixed(2),
        bottom_mm: +(marginRec.bottom * MM_PER_IN).toFixed(2),
        inner_mm: +(marginRec.inner * MM_PER_IN).toFixed(2),
        outer_mm: +(marginRec.outer * MM_PER_IN).toFixed(2),
        top_pt: +(marginRec.top * PT_PER_IN).toFixed(1),
        bottom_pt: +(marginRec.bottom * PT_PER_IN).toFixed(1),
        inner_pt: +(marginRec.inner * PT_PER_IN).toFixed(1),
        outer_pt: +(marginRec.outer * PT_PER_IN).toFixed(1)
      },

      // Gutter
      gutter: {
        min_in: gutterMin,
        recommended_in: gutterRec,
        min_mm: +(gutterMin * MM_PER_IN).toFixed(2),
        recommended_mm: +(gutterRec * MM_PER_IN).toFixed(2),
        tier: getGutterTierName(pageCount),
        note: 'Gutter (inside margin) increases with page count to prevent text loss in binding'
      },

      // Content area
      contentArea: {
        w_in: +contentW.toFixed(4),
        h_in: +contentH.toFixed(4),
        w_mm: +(contentW * MM_PER_IN).toFixed(2),
        h_mm: +(contentH * MM_PER_IN).toFixed(2)
      },

      // Safe content area (inside margins + safe zone)
      safeContentArea: {
        w_in: +Math.max(safeContentW, 0).toFixed(4),
        h_in: +Math.max(safeContentH, 0).toFixed(4)
      },

      // Spine
      spine: {
        width_in: +spineIn.toFixed(4),
        width_mm: +(spineIn * MM_PER_IN).toFixed(2),
        width_px300: toPixels(spineIn, 300),
        canHaveText: spineIn >= 0.3125,
        formula: '(pageCount / 2) / PPI'
      },

      // Cover dimensions
      cover: {
        frontW_in: trim.w,
        frontH_in: trim.h,
        spineW_in: +spineIn.toFixed(4),
        backW_in: trim.w,
        totalW_in: +(trim.w * 2 + spineIn).toFixed(4),
        totalH_in: trim.h,
        totalW_mm: +((trim.w * 2 + spineIn) * MM_PER_IN).toFixed(2),
        totalH_mm: +(trim.h * MM_PER_IN).toFixed(2),
        totalWFullBleed_in: +((trim.w * 2 + spineIn) + (bw ? bleedIn * 2 : 0)).toFixed(4),
        totalHFullBleed_in: +(trim.h + (bw ? bleedIn * 2 : 0)).toFixed(4)
      },

      // Pixels at various DPIs
      pixels: pixels,

      // All KDP-relevant info for upload
      kdp: {
        gutterMin_in: gutterMin,
        gutterRec_in: gutterRec,
        safeZone_in: safeZoneIn,
        bleed_in: bleedIn,
        outsideMarginMin_in: bw ? 0.375 : 0.25,
        topBottomMin_in: bw ? 0.375 : 0.25,
        pdfSizeShouldBe: bw ?
          (trim.w + bleedIn) + '" x ' + (trim.h + bleedIn * 2) + '"' :
          trim.w + '" x ' + trim.h + '"'
      },

      // Page count tier label
      pageCountTier: getGutterTierName(pageCount),

      // Timestamp
      calculatedAt: Date.now()
    };
  }

  // ========== GUTTER CALCULATION ==========
  function getGutter(pageCount) {
    for (var i = GUTTER_TIERS.length - 1; i >= 0; i--) {
      if (pageCount <= GUTTER_TIERS[i].maxPages || i === GUTTER_TIERS.length - 1) {
        return { min: GUTTER_TIERS[i].min, recommended: GUTTER_TIERS[i].recommended };
      }
    }
    return { min: 0.875, recommended: 1.0 };
  }

  function getGutterTierName(pageCount) {
    if (pageCount <= 24) return '≤ 24 pages';
    if (pageCount <= 150) return '25–150 pages';
    if (pageCount <= 300) return '151–300 pages';
    if (pageCount <= 500) return '301–500 pages';
    if (pageCount <= 700) return '501–700 pages';
    return '701–828 pages';
  }

  // ========== RECOMMENDED MARGINS (from vpuna/markdown-to-book) ==========
  function getRecommendedMargins(trim, bookType) {
    var w = trim.w, h = trim.h;
    var hc = bookType === 'hc';

    // Scale margins based on trim size
    var baseInner, baseOuter, baseTop, baseBottom;

    if (w >= 8) {
      baseInner = hc ? 1.0 : 0.85;
      baseOuter = 0.75;
      baseTop = 0.8;
      baseBottom = 0.8;
    } else if (w >= 7) {
      baseInner = hc ? 0.95 : 0.8;
      baseOuter = 0.6;
      baseTop = 0.75;
      baseBottom = 0.75;
    } else if (w >= 6) {
      baseInner = hc ? 0.85 : 0.7;
      baseOuter = 0.55;
      baseTop = 0.7;
      baseBottom = 0.7;
    } else if (w >= 5.5) {
      baseInner = hc ? 0.8 : 0.65;
      baseOuter = 0.5;
      baseTop = 0.65;
      baseBottom = 0.65;
    } else {
      baseInner = hc ? 0.75 : 0.6;
      baseOuter = 0.5;
      baseTop = 0.6;
      baseBottom = 0.6;
    }

    // Round to 3 decimal places
    return {
      top: +baseTop.toFixed(3),
      bottom: +baseBottom.toFixed(3),
      inner: +baseInner.toFixed(3),
      outer: +baseOuter.toFixed(3)
    };
  }

  // ========== KDP COMPLIANCE VALIDATOR ==========
  function validateKDP(settings) {
    var result = calculateAll(
      settings.trimSize || 'letter',
      settings.pageCount || 150,
      settings.bleed,
      settings.bookType || 'paperback',
      settings.ppi
    );

    var checks = [];
    var allPass = true;

    // 1. Outside margin check
    var outsideOK = result.margins.outer_in >= result.kdp.outsideMarginMin_in;
    checks.push({
      name: 'Outside Margin',
      pass: outsideOK,
      value_in: result.margins.outer_in,
      required_in: result.kdp.outsideMarginMin_in,
      detail: (outsideOK ? 'OK' : 'TOO LOW') + ' — ' + result.margins.outer_in.toFixed(3) + '" (min ' + result.kdp.outsideMarginMin_in + '")'
    });
    if (!outsideOK) allPass = false;

    // 2. Top margin check
    var topOK = result.margins.top_in >= result.kdp.topBottomMin_in;
    checks.push({
      name: 'Top Margin',
      pass: topOK,
      value_in: result.margins.top_in,
      required_in: result.kdp.topBottomMin_in,
      detail: (topOK ? 'OK' : 'TOO LOW') + ' — ' + result.margins.top_in.toFixed(3) + '" (min ' + result.kdp.topBottomMin_in + '")'
    });
    if (!topOK) allPass = false;

    // 3. Bottom margin check
    var botOK = result.margins.bottom_in >= result.kdp.topBottomMin_in;
    checks.push({
      name: 'Bottom Margin',
      pass: botOK,
      value_in: result.margins.bottom_in,
      required_in: result.kdp.topBottomMin_in,
      detail: (botOK ? 'OK' : 'TOO LOW') + ' — ' + result.margins.bottom_in.toFixed(3) + '" (min ' + result.kdp.topBottomMin_in + '")'
    });
    if (!botOK) allPass = false;

    // 4. Gutter (inside margin) check
    var gutterOK = result.margins.inner_in >= result.gutter.min_in;
    checks.push({
      name: 'Gutter (Inside Margin)',
      pass: gutterOK,
      value_in: result.margins.inner_in,
      required_in: result.gutter.min_in,
      tier: result.pageCountTier,
      detail: (gutterOK ? 'OK' : 'TOO LOW') + ' — ' + result.margins.inner_in.toFixed(3) + '" for ' + result.pageCountTier + ' (min ' + result.gutter.min_in + '")'
    });
    if (!gutterOK) allPass = false;

    // 5. Safe zone check
    var safeOK = (result.margins.outer_in >= result.safeZone.in) &&
                 (result.margins.top_in >= result.safeZone.in) &&
                 (result.margins.bottom_in >= result.safeZone.in);
    checks.push({
      name: 'Safe Zone (0.25" from trim)',
      pass: safeOK,
      detail: safeOK ? 'All margins exceed 0.25" safe zone' : 'Some margins inside safe zone'
    });
    if (!safeOK) allPass = false;

    // 6. Bleed setup check
    if (result.bleed.enabled) {
      checks.push({
        name: 'Bleed Setup',
        pass: true,
        detail: 'Bleed ' + result.bleed.amount_in + '" on ' + result.bleed.sides.join(', ') + '. Document size: ' + result.documentSize.w_in + '" x ' + result.documentSize.h_in + '"'
      });
    } else {
      checks.push({
        name: 'Bleed',
        pass: true,
        detail: 'No bleed (text-only interior)'
      });
    }

    // 7. Document size check
    checks.push({
      name: 'Document Size',
      pass: true,
      detail: 'PDF must be ' + result.kdp.pdfSizeShouldBe
    });

    return {
      compliant: allPass,
      overall: allPass ? 'KDP COMPLIANT' : 'MARGINS TOO LOW',
      trimName: result.trimName,
      trimSize: result.trimName,
      pageCount: result.pageCount,
      pageCountTier: result.pageCountTier,
      bleed: result.bleed.enabled,
      bookType: result.bookType,
      checks: checks,
      kdp: result.kdp,
      spine: result.spine,
      warnings: result.bleed.enabled ? [] : ['Consider enabling bleed if your puzzle has colored backgrounds or images that extend to page edge']
    };
  }

  // ========== SIMPLE CALCULATOR (for UI display) ==========
  function calculateSimple(trimId, pageCount, bleed, bookType) {
    return calculateAll(trimId, pageCount, bleed, bookType);
  }

  // ========== LEGACY COMPATIBILITY ==========
  // Get trim size in points (for existing PdfExport)
  function getTrimPoints(trimId) {
    var mapped = OLD_ID_MAP[trimId] || trimId;
    return ID_TO_POINTS[mapped] || ID_TO_POINTS['letter'] || { w: 612, h: 792 };
  }

  // Get margins in points (for existing PdfExport)
  function getMarginsPoints(trimId, pageCount, bleed, bookType) {
    var result = calculateAll(trimId, pageCount, bleed, bookType);
    return {
      top: +((result.margins.top_in + result.bleed.amount_in) * PT_PER_IN).toFixed(1),
      bottom: +((result.margins.bottom_in + result.bleed.amount_in) * PT_PER_IN).toFixed(1),
      inner: +(result.margins.inner_in * PT_PER_IN).toFixed(1),
      outer: +((result.margins.outer_in + result.bleed.amount_in) * PT_PER_IN).toFixed(1),
      bleed: +(result.bleed.amount_in * PT_PER_IN).toFixed(1)
    };
  }

  // ========== GET ALL TRIM SIZES (for dropdowns) ==========
  function getTrimSizeList() {
    var list = [];
    for (var id in TRIM_SIZES) {
      if (TRIM_SIZES.hasOwnProperty(id)) {
        list.push(TRIM_SIZES[id]);
      }
    }
    return list;
  }

  function getTrimSizesByCategory(category) {
    var result = [];
    for (var id in TRIM_SIZES) {
      if (TRIM_SIZES.hasOwnProperty(id) && TRIM_SIZES[id].category === category) {
        result.push(TRIM_SIZES[id]);
      }
    }
    return result;
  }

  // ========== EXPORT ==========
  var MXD_DIMENSION_ENGINE = {
    VERSION: VERSION,
    // Constants
    TRIM_SIZES: TRIM_SIZES,
    MARGIN_PRESETS: MARGIN_PRESETS,
    GUTTER_TIERS: GUTTER_TIERS,
    PAPER_PPI: PAPER_PPI,
    MM_PER_IN: MM_PER_IN,
    PT_PER_IN: PT_PER_IN,
    // Core calculation
    calculateAll: calculateAll,
    calculateSimple: calculateSimple,
    // Validation
    validateKDP: validateKDP,
    // Legacy compat for existing code
    getTrimPoints: getTrimPoints,
    getMarginsPoints: getMarginsPoints,
    // Lists
    getTrimSizeList: getTrimSizeList,
    getTrimSizesByCategory: getTrimSizesByCategory,
    // Utilities
    getGutter: getGutter,
    getGutterTierName: getGutterTierName,
    getRecommendedMargins: getRecommendedMargins,
    // Old ID map for backward compat
    OLD_ID_MAP: OLD_ID_MAP,
    ID_TO_POINTS: ID_TO_POINTS
  };

  window.MXD_DIMENSION_ENGINE = MXD_DIMENSION_ENGINE;
  console.log('📐 MXD Dimension Engine v' + VERSION + ' loaded — ' + Object.keys(TRIM_SIZES).length + ' trim sizes');
})();
