const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace('          </div>\n        )}\n\n        {activeTab === \\'sistema\\'', '        {activeTab === \\'sistema\\'');
fs.writeFileSync('src/App.jsx', app, 'utf8');
