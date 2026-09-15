const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Remove emojis from Importar Planilha and Adicionar Cupom
content = content.replace(/>\s*.\s*Importar Planilha/g, "> Importar Planilha");
content = content.replace(/>\s*.\s*Adicionar Cupom/g, "> Adicionar Cupom");

// 2. Add chatViewedByAdmin check for red dot
const redDotHtml = `deal.messages && deal.messages.length > 0 && deal.messages[deal.messages.length - 1].role === 'client' && !deal.chatViewedByAdmin && (`;
content = content.replace(/deal\.messages && deal\.messages\.length > 0 && deal\.messages\[deal\.messages\.length - 1\]\.role === 'client' && \(/g, redDotHtml);

// 3. Mark chatViewedByAdmin as true when opening chat
content = content.replace(
  "onClick={() => setInternalChat({ dealId: deal.id, msg: '' })}",
  "onClick={() => { setInternalChat({ dealId: deal.id, msg: '' }); updateDoc(doc(db, 'deals', deal.id), { chatViewedByAdmin: true }).catch(console.error); }}"
);
content = content.replace(
  "onClick={() => setInternalChat({ dealId: deal.id, msg: '' })}",
  "onClick={() => { setInternalChat({ dealId: deal.id, msg: '' }); updateDoc(doc(db, 'deals', deal.id), { chatViewedByAdmin: true }).catch(console.error); }}"
);

// 4. Mark chatViewedByAdmin as true when opening details
content = content.replace(
  "onClick={() => setSystemDetailsModal(deal)}",
  "onClick={() => { setSystemDetailsModal(deal); updateDoc(doc(db, 'deals', deal.id), { chatViewedByAdmin: true }).catch(console.error); }}"
);

fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
console.log('Frontend patched.');
