const fs = require('fs');
const ext = require('./extracted.json');
let content = '';
ext.forEach(x => {
  if (x.ReplacementContent && x.ReplacementContent.includes('activeTab === \'sistema\' && (')) content = x.ReplacementContent;
  if (x.ReplacementChunks) x.ReplacementChunks.forEach(c => {
    if (c.ReplacementContent.includes('activeTab === \'sistema\' && (')) content = c.ReplacementContent;
  });
});
console.log('open:', (content.match(/<div/g)||[]).length);
console.log('close:', (content.match(/<\/div/g)||[]).length);
