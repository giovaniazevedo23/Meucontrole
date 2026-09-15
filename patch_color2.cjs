const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Replace --brand-orange with --primary-color
app = app.replace(/backgroundColor: 'var\(--brand-orange\)'/g, "backgroundColor: 'var(--primary-color)'");
app = app.replace(/color: 'var\(--brand-orange\)'/g, "color: 'var(--primary-color)'");

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
console.log('Fixed SKU button colors');
