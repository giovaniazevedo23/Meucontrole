const fs = require('fs');

// 1. Fix eye icon in frontend
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');
app = app.replace(/bottom: '10px', top: 'auto'/g, "top: '50%', transform: 'translateY(-50%)'");
fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
console.log('Fixed eye icon');

// 2. Force the client login style override
let clientApp = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');
clientApp = clientApp.replace(/<div className="modal-content glass-panel responsive-admin-login-wrapper" style=\{\{ padding: 0 \}\}>/, '<div className="responsive-admin-login-wrapper" style={{ padding: 0, backgroundColor: "#fff", maxWidth: "100vw", borderRadius: 0, border: "none" }}>');
fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', clientApp, 'utf8');
console.log('Fixed client login layout');
