// Procedural cat SVG generation.
// catSpriteSVG({ colorId, designId, eyeId, facing }) -> string of SVG markup.

function getColor(id) { return PELT_COLORS.find(c => c.id === id) || PELT_COLORS[0]; }
function getEye(id)   { return EYE_COLORS.find(c => c.id === id) || EYE_COLORS[0]; }

function _designOverlay(design, color) {
  const accent = color.accent;
  switch (design) {
    case 'tabby':
      // bold body stripes
      return `
        <path d="M28 70 Q40 60 52 70" stroke="${accent}" stroke-width="2.4" fill="none" opacity="0.85"/>
        <path d="M28 76 Q40 66 52 76" stroke="${accent}" stroke-width="2.4" fill="none" opacity="0.85"/>
        <path d="M30 60 Q34 56 36 60" stroke="${accent}" stroke-width="2" fill="none"/>
        <path d="M40 56 Q44 52 48 56" stroke="${accent}" stroke-width="2" fill="none"/>
        <path d="M44 30 Q48 28 52 30" stroke="${accent}" stroke-width="1.6" fill="none"/>
        <path d="M30 38 Q34 35 38 37" stroke="${accent}" stroke-width="1.6" fill="none"/>
      `;
    case 'mackerel':
      // many fine stripes
      return `
        <path d="M22 64 Q40 58 58 64" stroke="${accent}" stroke-width="1.2" fill="none" opacity="0.85"/>
        <path d="M22 68 Q40 62 58 68" stroke="${accent}" stroke-width="1.2" fill="none" opacity="0.85"/>
        <path d="M22 72 Q40 66 58 72" stroke="${accent}" stroke-width="1.2" fill="none" opacity="0.85"/>
        <path d="M22 76 Q40 70 58 76" stroke="${accent}" stroke-width="1.2" fill="none" opacity="0.85"/>
        <path d="M22 80 Q40 74 58 80" stroke="${accent}" stroke-width="1.2" fill="none" opacity="0.85"/>
        <path d="M30 36 Q40 32 50 36" stroke="${accent}" stroke-width="1.2" fill="none"/>
        <path d="M30 40 Q40 36 50 40" stroke="${accent}" stroke-width="1" fill="none"/>
      `;
    case 'spotted':
      return `
        <circle cx="28" cy="64" r="2.4" fill="${accent}" opacity="0.85"/>
        <circle cx="36" cy="58" r="2.4" fill="${accent}" opacity="0.85"/>
        <circle cx="46" cy="60" r="2.4" fill="${accent}" opacity="0.85"/>
        <circle cx="52" cy="68" r="2.4" fill="${accent}" opacity="0.85"/>
        <circle cx="32" cy="74" r="2.4" fill="${accent}" opacity="0.85"/>
        <circle cx="44" cy="76" r="2.4" fill="${accent}" opacity="0.85"/>
        <circle cx="34" cy="38" r="1.8" fill="${accent}" opacity="0.85"/>
        <circle cx="44" cy="34" r="1.8" fill="${accent}" opacity="0.85"/>
      `;
    case 'classic':
      return `
        <path d="M30 64 Q40 56 50 64 Q44 70 40 66 Q36 70 30 64 Z" stroke="${accent}" stroke-width="1.6" fill="none"/>
        <path d="M28 76 Q40 70 52 76" stroke="${accent}" stroke-width="1.6" fill="none"/>
        <path d="M34 38 Q40 34 46 38" stroke="${accent}" stroke-width="1.4" fill="none"/>
      `;
    case 'solid':
    default:
      return '';
  }
}

function _calicoOverlay(color) {
  // For calico/tortoiseshell: paint patches of accent color.
  return `
    <ellipse cx="32" cy="62" rx="9" ry="7" fill="${color.accent}" opacity="0.95"/>
    <ellipse cx="48" cy="74" rx="8" ry="6" fill="${color.accent}" opacity="0.95"/>
    <ellipse cx="44" cy="34" rx="7" ry="5" fill="${color.accent}" opacity="0.95"/>
    <ellipse cx="30" cy="40" rx="5" ry="4" fill="${color.belly}" opacity="0.85"/>
  `;
}

function catSpriteSVG(opts) {
  const color  = getColor(opts.colorId || 'brown');
  const design = (opts.designId || 'solid');
  const eye    = getEye(opts.eyeId || 'amber');
  const facing = opts.facing || 'right'; // 'left' mirrors

  const designOverlay = _designOverlay(design, color);
  const patternOverlay = (color.special === 'calico' || color.special === 'tortie')
    ? _calicoOverlay(color)
    : '';

  // The cat is drawn facing right. We mirror via SVG transform if facing left.
  const transform = facing === 'left' ? 'translate(80,0) scale(-1,1)' : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90">
    <g transform="${transform}">
      <!-- shadow -->
      <ellipse cx="40" cy="84" rx="22" ry="3.5" fill="rgba(0,0,0,0.32)"/>
      <!-- tail (curls back) -->
      <path d="M58 64 Q72 50 64 36 Q60 32 56 38 Q66 50 52 60 Z" fill="${color.base}"/>
      <!-- legs hint -->
      <ellipse cx="28" cy="80" rx="4" ry="4" fill="${color.accent}"/>
      <ellipse cx="44" cy="80" rx="4" ry="4" fill="${color.accent}"/>
      <!-- body -->
      <ellipse cx="38" cy="64" rx="22" ry="14" fill="${color.base}"/>
      <!-- belly highlight -->
      <ellipse cx="38" cy="68" rx="13" ry="7" fill="${color.belly}" opacity="0.85"/>
      ${patternOverlay}
      ${designOverlay}
      <!-- head -->
      <ellipse cx="40" cy="36" rx="16" ry="14" fill="${color.base}"/>
      <!-- ears -->
      <polygon points="28,24 24,8 36,22" fill="${color.base}"/>
      <polygon points="52,24 56,8 44,22" fill="${color.base}"/>
      <polygon points="29,22 27,14 33,22" fill="${color.accent}"/>
      <polygon points="51,22 53,14 47,22" fill="${color.accent}"/>
      <!-- eyes -->
      <ellipse cx="33" cy="36" rx="3" ry="3.8" fill="#fff"/>
      <ellipse cx="47" cy="36" rx="3" ry="3.8" fill="#fff"/>
      <ellipse cx="33" cy="36.5" rx="2" ry="3" fill="${eye.color}"/>
      <ellipse cx="47" cy="36.5" rx="2" ry="3" fill="${eye.color}"/>
      <ellipse cx="33.3" cy="36" rx="0.7" ry="2" fill="#0a0a0a"/>
      <ellipse cx="47.3" cy="36" rx="0.7" ry="2" fill="#0a0a0a"/>
      <circle cx="34" cy="34.6" r="0.5" fill="#fff"/>
      <circle cx="48" cy="34.6" r="0.5" fill="#fff"/>
      <!-- nose -->
      <path d="M38 42 L42 42 L40 44.5 Z" fill="#3a2519"/>
      <!-- mouth -->
      <path d="M40 44.5 Q37 47 35 46.5" stroke="#3a2519" stroke-width="1" fill="none" stroke-linecap="round"/>
      <path d="M40 44.5 Q43 47 45 46.5" stroke="#3a2519" stroke-width="1" fill="none" stroke-linecap="round"/>
      <!-- whiskers -->
      <line x1="26" y1="42" x2="16" y2="40" stroke="#3a2519" stroke-width="0.8" opacity="0.8"/>
      <line x1="26" y1="44" x2="16" y2="46" stroke="#3a2519" stroke-width="0.8" opacity="0.8"/>
      <line x1="54" y1="42" x2="64" y2="40" stroke="#3a2519" stroke-width="0.8" opacity="0.8"/>
      <line x1="54" y1="44" x2="64" y2="46" stroke="#3a2519" stroke-width="0.8" opacity="0.8"/>
    </g>
  </svg>`;
}
