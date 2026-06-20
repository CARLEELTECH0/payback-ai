const fs = require('fs');

const svgCode = fs.readFileSync('c:/Users/user/.gemini/antigravity/playground/fiery-curiosity/frontend/public/nigeria.svg', 'utf8');

const gradientDef = `
<defs>
  <linearGradient id="flag-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="33.33%" stop-color="#008751"/>
    <stop offset="33.33%" stop-color="#FFFFFF"/>
    <stop offset="66.66%" stop-color="#FFFFFF"/>
    <stop offset="66.66%" stop-color="#008751"/>
  </linearGradient>
</defs>
<g id="admin1" fill="url(#flag-gradient)" stroke="#00371D" stroke-width="2">
`;

// Replace the <g id="admin1"> group with the new grouped wrapper
let newSvg = svgCode.replace('<g id="admin1">', gradientDef);

// Make sure it doesn't override inner paths with custom fills
newSvg = newSvg.replace(/fill="[#a-zA-Z0-9]+"/g, '');

fs.writeFileSync('c:/Users/user/.gemini/antigravity/playground/fiery-curiosity/frontend/public/nigeria_flag.svg', newSvg);
console.log('Nigeria map beautifully updated with the flag gradient!');
