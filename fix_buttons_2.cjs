const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

content = content.replace(
  /<button className="btn-secondary" onClick=\{\(\) =>\s*Importar Planilha\s*<\/button>/g,
  `<button className="btn-secondary" onClick={() => document.getElementById('import-excel').click()} style={{ color: '#00a650', borderColor: '#00a650' }}>\n                  Importar Planilha\n                </button>`
);

content = content.replace(
  /<button className="btn-secondary" onClick=\{\(\) =>\s*Adicionar Cupom\s*<\/button>/g,
  `<button className="btn-secondary" onClick={() => setIsCouponModalOpen(true)} style={{ color: '#00a650', borderColor: '#00a650' }}>\n                  Adicionar Cupom\n                </button>`
);

fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
console.log('Frontend buttons fixed safely.');
