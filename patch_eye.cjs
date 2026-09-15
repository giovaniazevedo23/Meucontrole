const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// The eye icon button has top: '40px'
// We change it to use bottom: '12px' which typically centers it in standard height inputs
app = app.replace(/top: '40px'/g, "bottom: '10px', top: 'auto'");

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
console.log('Fixed eye icon position');
