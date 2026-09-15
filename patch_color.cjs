const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

app = app.replace(/backgroundColor: 'var\(--primary\)'/g, "backgroundColor: 'var(--brand-orange)'");
app = app.replace(/color: 'var\(--primary\)'/g, "color: 'var(--brand-orange)'");

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');

let clientApp = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');
clientApp = clientApp.replace(/<div className="app-container" style=\{\{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' \}\}>/, '<div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "#fff", zIndex: 9999 }}>');
fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', clientApp, 'utf8');

console.log('Fixed SKU button colors and client login background');
