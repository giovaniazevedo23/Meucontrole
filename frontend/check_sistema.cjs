const fs = require('fs');
const ext = require('./extracted.json');
let content = '';
ext.forEach(x => {
  if (x.ReplacementContent && x.ReplacementContent.includes('activeTab === \'sistema\' && (')) content = x.ReplacementContent;
  if (x.ReplacementChunks) x.ReplacementChunks.forEach(c => {
    if (c.ReplacementContent.includes('activeTab === \'sistema\' && (')) content = c.ReplacementContent;
  });
});
fs.writeFileSync('sistema_only.jsx', content);
