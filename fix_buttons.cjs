const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const badChunk1 = `<button className="btn-secondary" onClick={() =>
                    Importar Planilha
                </button>`;

const badChunk2 = `<button className="btn-secondary" onClick={() =>
                    Adicionar Cupom
                </button>`;

const goodChunk1 = `<button className="btn-secondary" onClick={() => document.getElementById('import-excel').click()} style={{ color: '#00a650', borderColor: '#00a650' }}>
                  Importar Planilha
                </button>`;

const goodChunk2 = `<button className="btn-secondary" onClick={() => setIsCouponModalOpen(true)} style={{ color: '#00a650', borderColor: '#00a650' }}>
                  Adicionar Cupom
                </button>`;

content = content.replace(badChunk1, goodChunk1);
content = content.replace(badChunk2, goodChunk2);

fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
console.log('Frontend buttons fixed.');
