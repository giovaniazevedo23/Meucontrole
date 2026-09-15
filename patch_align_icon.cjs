const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

app = app.replace(/top: '38px'/g, "top: '40px'"); // The label is above, input is below. 40px should align it nicely inside the input box.

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
console.log('Centered eye icon');
