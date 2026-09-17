const fs = require('fs');

let serverApp = fs.readFileSync('cPRODUTOS-CONTROLE/server.js', 'utf8');

serverApp = serverApp.replace(
  /const url = process\.env\.RENDER_EXTERNAL_URL \|\| `http:\/\/localhost:\$\{PORT\}`;/,
  "const url = 'https://cprodutos-controle.onrender.com';"
);

fs.writeFileSync('cPRODUTOS-CONTROLE/server.js', serverApp, 'utf8');
console.log('Patched server keep-alive url');
