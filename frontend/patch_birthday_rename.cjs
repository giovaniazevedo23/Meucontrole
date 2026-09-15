const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Update to look for 'Nascimento/Aniversário'
content = content.replace(
  "matchingSheet['ANIVERSÁRIO']",
  "matchingSheet['Nascimento/Aniversário']"
);

fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
console.log('Fixed birthday property reference for Nascimento/Aniversário.');
