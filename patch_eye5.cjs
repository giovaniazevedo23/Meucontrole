const fs = require('fs');

let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Replace style={{ paddingRight: '40px' }} with style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
app = app.replace(/style=\{\{ paddingRight: '40px' \}\}/g, "style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}");

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
console.log('Fixed input width');
