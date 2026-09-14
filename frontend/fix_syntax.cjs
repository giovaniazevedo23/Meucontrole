const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace('        )}\n\n                </div>\n        )}\n\n        {activeTab === \\'sistema\\'', '        )}\n\n        {activeTab === \\'sistema\\'');
fs.writeFileSync('src/App.jsx', app, 'utf8');
