const fs = require('fs');
const ext = require('./extracted.json');
let content = '';
ext.forEach(x => {
  if (x.ReplacementContent && x.ReplacementContent.includes('activeTab === \'sistema\'')) {
    content += x.ReplacementContent + '\n';
  }
  if (x.ReplacementContent && x.ReplacementContent.includes('systemDetailsModal')) {
    content += x.ReplacementContent + '\n';
  }
  if (x.ReplacementChunks) {
    x.ReplacementChunks.forEach(c => {
      if (c.ReplacementContent && c.ReplacementContent.includes('activeTab === \'sistema\'')) {
        content += c.ReplacementContent + '\n';
      }
      if (c.ReplacementContent && c.ReplacementContent.includes('systemDetailsModal')) {
        content += c.ReplacementContent + '\n';
      }
    });
  }
});
fs.writeFileSync('sistema_patch.txt', content);
