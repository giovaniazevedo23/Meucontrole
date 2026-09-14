const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace('            </div>\n          </div>\n        )}\n        )}', '            </div>\n          </div>\n        )}');
fs.writeFileSync('src/App.jsx', app, 'utf8');
