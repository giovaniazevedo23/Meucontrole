const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\r\n');

// Find the <input line for sistemaSearch
let inputLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<input') && lines[i+2] && lines[i+2].includes('Buscar por nome ou SKU')) {
    inputLine = i;
    break;
  }
}

if (inputLine > -1) {
  const svgLines = [
    "                <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: 'var(--text-secondary)', pointerEvents: 'none', zIndex: 1 }}>",
    "                  <circle cx=\"11\" cy=\"11\" r=\"8\"></circle>",
    "                  <line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line>",
    "                </svg>"
  ];
  lines.splice(inputLine, 0, ...svgLines);
  fs.writeFileSync('src/App.jsx', lines.join('\r\n'), 'utf8');
  console.log('SVG lupa inserted at line', inputLine);
} else {
  console.log('Could not find input line!');
}
