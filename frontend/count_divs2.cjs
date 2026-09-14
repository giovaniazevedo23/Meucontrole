const fs = require('fs');
const ext = require('./extracted.json');
let sistemaTab = '';
let modal = '';
ext.forEach(x => {
  if (x.ReplacementChunks) x.ReplacementChunks.forEach(c => {
    if (c.ReplacementContent.includes('activeTab === \\'sistema\\' && (')) sistemaTab = c.ReplacementContent;
    if (c.ReplacementContent.includes('systemDetailsModal && (')) modal = c.ReplacementContent;
  });
  if (x.ReplacementContent && x.ReplacementContent.includes('activeTab === \\'sistema\\' && (')) sistemaTab = x.ReplacementContent;
  if (x.ReplacementContent && x.ReplacementContent.includes('systemDetailsModal && (')) modal = x.ReplacementContent;
});

sistemaTab = sistemaTab.replace('          </div>\n        )}\n\n', '');
modal = modal.replace('        )}\n\n', '');

let content = sistemaTab + '\n\n' + modal;
console.log('open:', (content.match(/<div/g)||[]).length);
console.log('close:', (content.match(/<\/div/g)||[]).length);
