const fs = require('fs');
const ext = require('./extracted.json');
let sistemaTab = '';
let modal = '';
ext.forEach(x => {
  if (x.ReplacementChunks) x.ReplacementChunks.forEach(c => {
    if (c.ReplacementContent.includes("activeTab === 'sistema' && (")) sistemaTab = c.ReplacementContent;
    if (c.ReplacementContent.includes("systemDetailsModal && (")) modal = c.ReplacementContent;
  });
  if (x.ReplacementContent && x.ReplacementContent.includes("activeTab === 'sistema' && (")) sistemaTab = x.ReplacementContent;
  if (x.ReplacementContent && x.ReplacementContent.includes("systemDetailsModal && (")) modal = x.ReplacementContent;
});

// Remove the floating closing tags from the extracted string
sistemaTab = sistemaTab.replace('          </div>\n        )}\n\n', '');
modal = modal.replace('        )}\n\n', '');

let app = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

const startIdx = app.findIndex(l => l.includes("activeTab === 'config-nfe' && ("));
const endIdx = app.findIndex(l => l.trim() === "</main>");

if (startIdx !== -1 && endIdx !== -1) {
  app.splice(startIdx, endIdx - startIdx + 1, sistemaTab + '\n\n' + modal);
  fs.writeFileSync('src/App.jsx', app.join('\n'), 'utf8');
  console.log('Success! startIdx:', startIdx, 'endIdx:', endIdx);
} else {
  console.log('Failed to find indices', startIdx, endIdx);
}
