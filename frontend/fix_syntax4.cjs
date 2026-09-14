const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace('      </main>', '        </div>\n      </main>');
fs.writeFileSync('src/App.jsx', app, 'utf8');
