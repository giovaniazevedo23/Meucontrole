const fs = require('fs');

let vitrineApp = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

const regexToRemove = /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem', fontSize: '0\.9rem' \}\}>[\s\S]*?\{status\.label\}\s*<\/div>\s*<\/div>/g;

vitrineApp = vitrineApp.replace(regexToRemove, '');

fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', vitrineApp, 'utf8');
console.log('Grid product card details removed.');
