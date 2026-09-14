const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace('        )}
\n        </div>\n      </main>', '        )}\n\n      </main>');
fs.writeFileSync('src/App.jsx', app, 'utf8');
