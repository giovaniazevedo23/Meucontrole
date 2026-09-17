const fs = require('fs');
let app = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// Add search-toolbar class
app = app.replace(
  'className="toolbar glass-panel"',
  'className="toolbar search-toolbar glass-panel"'
);

// Add search-wrapper-container class
app = app.replace(
  '<div style={{ display: \'flex\', alignItems: \'center\', gap: \'1rem\', flex: 1, justifyContent: \'flex-end\', position: \'relative\' }}>',
  '<div className="search-wrapper-container" style={{ display: \'flex\', alignItems: \'center\', gap: \'1rem\', flex: 1, justifyContent: \'flex-end\', position: \'relative\' }}>'
);

// Add search-input-wrapper class
app = app.replace(
  '<div style={{ position: \'relative\', flex: 1, maxWidth: \'500px\' }}>',
  '<div className="search-input-wrapper" style={{ position: \'relative\', flex: 1, maxWidth: \'500px\' }}>'
);

fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', app, 'utf8');

let css = fs.readFileSync('cPRODUTOS-CONTROLE/src/index.css', 'utf8');
if (!css.includes('.search-toolbar')) {
  css += `

@media (max-width: 768px) {
  .search-toolbar {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  .search-wrapper-container {
    width: 100% !important;
    flex-direction: column !important;
    align-items: stretch !important;
    justify-content: stretch !important;
  }
  .search-input-wrapper {
    max-width: 100% !important;
    width: 100% !important;
  }
  .search-wrapper-container > button {
    width: 100% !important;
    justify-content: center !important;
  }
}
`;
  fs.writeFileSync('cPRODUTOS-CONTROLE/src/index.css', css, 'utf8');
}
console.log('Mobile layout for search bar patched successfully.');
