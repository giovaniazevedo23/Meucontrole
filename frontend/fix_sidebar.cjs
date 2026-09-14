const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace(/'config-nfe'/g, "'sistema'");
fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('Replaced config-nfe with sistema!');
