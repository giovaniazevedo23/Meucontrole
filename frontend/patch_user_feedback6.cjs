const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Rename tab correctly everywhere
app = app.replace(/'config-nfe'/g, "'sistema'");
app = app.replace(/>\s*Configurações NFe\s*</g, '>Sistemas<');

// 2. Remove emojis from the modal sections
app = app.replace('👤 Dados do Cliente', 'Dados do Cliente');
app = app.replace('📄 Detalhes do Pedido', 'Detalhes do Pedido');
app = app.replace('💰 Pagamento e Produtos', 'Pagamento e Produtos');
app = app.replace('🖨️ Imprimir Recibo', 'Imprimir Recibo');

// 3. Update search input to have magnifying glass inside it
const oldSearchInput = `<input 
                  type="text" 
                  placeholder="Buscar por cliente, CPF, pedido, NFe..." 
                  value={sistemaSearch}
                  onChange={e => setSistemaSearch(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 1rem', borderRadius: '2rem', border: '2px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                />`;
const newSearchInput = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: 'var(--text-secondary)' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou SKU..." 
                  value={sistemaSearch}
                  onChange={e => setSistemaSearch(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '2rem', border: '2px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}
                />`;
app = app.replace(oldSearchInput, newSearchInput);

// 4. Update the empty search message (remove emoji 🔍)
const oldEmptySearch = `<div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>Pesquisar Registros</h3>
                      <p>Digite o nome do cliente, CPF, ID do pedido ou NFe na barra de busca para encontrar os registros.</p>`;
const newEmptySearch = `<h3 style={{ margin: '0 0 0.5rem 0' }}>Pesquisar Registros</h3>
                      <p>Digite o nome do cliente, CPF, ID do pedido ou NFe na barra de busca para encontrar os registros.</p>`;
app = app.replace(oldEmptySearch, newEmptySearch);

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('Done fixing icons and tab names.');
