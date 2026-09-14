const fs = require('fs');
let lines = fs.readFileSync('src/App.jsx', 'utf8').split('\r\n');

// Find the input field for 'Sistema' search
let inputLineIndex = -1;
for (let i = 2600; i < 2800; i++) {
  if (lines[i] && lines[i].includes('value={sistemaSearch}')) {
    // The <input is usually on the lines before. Let's find the start of the input.
    for (let j = i; j > i - 5; j--) {
      if (lines[j].includes('<input')) {
        inputLineIndex = j;
        break;
      }
    }
    break;
  }
}

if (inputLineIndex !== -1) {
  const svgLines = [
    '                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: \'absolute\', left: \'1.25rem\', top: \'50%\', transform: \'translateY(-50%)\', width: \'1.25rem\', height: \'1.25rem\', color: \'var(--text-secondary)\', pointerEvents: \'none\', zIndex: 1 }}>',
    '                  <circle cx="11" cy="11" r="8"></circle>',
    '                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
    '                </svg>'
  ];
  lines.splice(inputLineIndex, 0, ...svgLines);
  fs.writeFileSync('src/App.jsx', lines.join('\r\n'), 'utf8');
  console.log('Lupa inserted at line', inputLineIndex);
} else {
  console.log('Could not find sistemaSearch input');
}
