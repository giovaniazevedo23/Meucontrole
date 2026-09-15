const fs = require('fs');

let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// The target is: <div style={{ position: 'relative' }}>
// We need to change it to: <div style={{ position: 'relative', width: '100%' }}>

app = app.replace(/<div style=\{\{ position: 'relative' \}\}>/g, "<div style={{ position: 'relative', width: '100%' }}>");

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
console.log('Fixed wrapper width');
