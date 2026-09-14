const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Rename "Sistemas" -> "Sistema" (singular) in the button text
app = app.replace('>Sistemas</button>', '>Sistema</button>');

// 2. Add SVG lupa icon to the search input and fix placeholder
// The old search input block (lines ~2694-2701)
const oldSearchBlock = `              <div style={{ display: 'inline-block', position: 'relative', width: '100%', maxWidth: '600px' }}>
                <input 
                  type="text" 
                  placeholder="Buscar por cliente, CPF, pedido, NFe..." 
                  value={sistemaSearch}
                  onChange={e => setSistemaSearch(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 1rem', borderRadius: '2rem', border: '2px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                />
              </div>`;

const newSearchBlock = `              <div style={{ display: 'inline-block', position: 'relative', width: '100%', maxWidth: '600px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: 'var(--text-secondary)', pointerEvents: 'none', zIndex: 1 }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou SKU..." 
                  value={sistemaSearch}
                  onChange={e => setSistemaSearch(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3.25rem', borderRadius: '2rem', border: '2px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}
                />
              </div>`;

if (app.includes(oldSearchBlock)) {
  app = app.replace(oldSearchBlock, newSearchBlock);
  console.log('Search block replaced OK');
} else {
  console.log('Search block NOT FOUND - trying line-based replacement');
  // Try individual line replacement
  app = app.replace(
    "placeholder=\"Buscar por cliente, CPF, pedido, NFe...\"",
    "placeholder=\"Buscar por nome ou SKU...\""
  );
  app = app.replace(
    "padding: '1rem 1rem 1rem 1rem'",
    "padding: '1rem 1rem 1rem 3.25rem'"
  );
  // Add SVG before the input
  const inputLine = "<input \n                  type=\"text\" \n                  placeholder=\"Buscar por nome ou SKU...\"";
  const svgIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: 'var(--text-secondary)', pointerEvents: 'none', zIndex: 1 }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input \n                  type="text" \n                  placeholder="Buscar por nome ou SKU..."`;
  app = app.replace(inputLine, svgIcon);
}

// 3. Connect Sistema tab to sheetsData instead of deals
// The data source needs to merge Pedidos vitrine + Vendas e controle from sheetsData
// Replace the filter/map logic block
const oldDataLogic = `              {(() => {
                const s = sistemaSearch.toLowerCase();
                if (!s) {
                  return (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: '#999' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>Pesquisar Registros</h3>
                      <p>Digite o nome do cliente, CPF, ID do pedido ou NFe na barra de busca para encontrar os registros.</p>
                    </div>
                  );
                }
                const filtered = deals.filter(d => 
                  (d.client && d.client.toLowerCase().includes(s)) ||
                  (d.cpf && d.cpf.includes(s)) ||
                  (d.customerCpf && d.customerCpf.includes(s)) ||
                  (d.id && d.id.toLowerCase().includes(s))
                );
                
                if (filtered.length === 0) {
                  return (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: '#999' }}>
                      <p>Nenhum registro encontrado para a sua busca.</p>
                    </div>
                  );
                }
                
                return filtered.map(deal => {
                  return (
                    <div key={deal.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: \`4px solid \${deal.source === 'vitrine' ? 'var(--primary-color)' : 'var(--warning)'}\` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{deal.client || 'Cliente não informado'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(deal.date).toLocaleDateString('pt-BR')}</div>
                        </div>
                        <span style={{ fontSize: '0.8rem', background: '#eee', padding: '2px 8px', borderRadius: '10px' }}>#{deal.id.slice(-6)}</span>
                      </div>
                      
                      <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '0.5rem', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Status:</span>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{deal.status}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Prazo de Entrega:</span>
                          <span style={{ fontWeight: 'bold' }}>{deal.maxDeliveryDays || 3} dias úteis</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Status de Entrega:</span>
                          <span style={{ fontWeight: 'bold' }}>{deal.shippingStatus || 'Aguardando'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Valor Total:</span>
                          <span style={{ fontWeight: 'bold' }}>R$ {Number(deal.value || deal.total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-secondary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => {
                          const num = deal.phone || deal.customerPhone;
                          if (num) {
                            const cleanNum = num.replace(/\\D/g, '');
                            window.open(\`https://wa.me/55\${cleanNum}\`, '_blank');
                          } else alert('Telefone não informado');
                        }}>WhatsApp</button>
                        <button className="btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => setSystemDetailsModal(deal)}>
                          Detalhes
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}`;

const newDataLogic = `              {(() => {
                const s = sistemaSearch.toLowerCase();
                
                // Merge data from deals (Firestore) + sheetsData (Google Sheets: Pedidos vitrine + Vendas e controle)
                const sheetPedidos = (sheetsData['Pedidos vitrine'] || []).map((row, i) => ({
                  id: 'pv-' + i,
                  client: row['USUARIO'] || '',
                  cpf: row['CPF'] || '',
                  email: row['EMAIL'] || '',
                  address: row['ENDEREÇO'] || '',
                  phone: row['N° DE TEEFONE'] || '',
                  date: row['DATA E HORA DO PEDIDO'] || '',
                  products: row['ITEM COMPRADO'] || '',
                  salesperson: row['VENDEDOR ESCOLHIDO'] || '',
                  maxDeliveryDays: row['PRAZO DE ENTREGA'] || '',
                  quantity: row['QUANTIDADE'] || 1,
                  paymentMethod: row['METODO DE PAGAMENTO'] || '',
                  source: 'vitrine',
                  status: row['STATUS DE ENTREGA'] || 'Pendente',
                  shippingStatus: row['STATUS DE ENTREGA'] || 'Aguardando',
                  _origin: 'planilha'
                }));
                
                const allRecords = [...deals.map(d => ({...d, _origin: 'firebase'})), ...sheetPedidos];
                
                if (!s) {
                  return (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: '#999' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>Pesquisar Registros</h3>
                      <p>Digite o nome do cliente, CPF, ID do pedido ou NFe na barra de busca para encontrar os registros.</p>
                    </div>
                  );
                }
                const filtered = allRecords.filter(d => 
                  (d.client && d.client.toLowerCase().includes(s)) ||
                  (d.cpf && d.cpf.includes(s)) ||
                  (d.customerCpf && d.customerCpf.includes(s)) ||
                  (d.id && d.id.toLowerCase().includes(s)) ||
                  (d.products && typeof d.products === 'string' && d.products.toLowerCase().includes(s))
                );
                
                if (filtered.length === 0) {
                  return (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: '#999' }}>
                      <p>Nenhum registro encontrado para a sua busca.</p>
                    </div>
                  );
                }
                
                return filtered.map((deal, idx) => {
                  return (
                    <div key={deal.id || ('rec-' + idx)} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: \`4px solid \${deal.source === 'vitrine' ? 'var(--primary-color)' : 'var(--warning)'}\` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{deal.client || 'Cliente não informado'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{deal.date ? new Date(deal.date).toLocaleDateString('pt-BR') : ''}</div>
                        </div>
                        <span style={{ fontSize: '0.8rem', background: deal._origin === 'planilha' ? '#d4edda' : '#eee', padding: '2px 8px', borderRadius: '10px' }}>{deal._origin === 'planilha' ? 'Planilha' : '#' + deal.id.slice(-6)}</span>
                      </div>
                      
                      <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '0.5rem', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Status:</span>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{deal.status}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Prazo de Entrega:</span>
                          <span style={{ fontWeight: 'bold' }}>{deal.maxDeliveryDays || 3} dias úteis</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Status de Entrega:</span>
                          <span style={{ fontWeight: 'bold' }}>{deal.shippingStatus || 'Aguardando'}</span>
                        </div>
                        {deal.value || deal.total ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#666', fontSize: '0.9rem' }}>Valor Total:</span>
                            <span style={{ fontWeight: 'bold' }}>R$ {Number(deal.value || deal.total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                        ) : null}
                        {deal._origin === 'planilha' && deal.products ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                            <span style={{ color: '#666', fontSize: '0.9rem' }}>Produto:</span>
                            <span style={{ fontWeight: 'bold', textAlign: 'right', maxWidth: '60%' }}>{deal.products}</span>
                          </div>
                        ) : null}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-secondary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => {
                          const num = deal.phone || deal.customerPhone;
                          if (num) {
                            const cleanNum = num.replace(/\\D/g, '');
                            window.open(\`https://wa.me/55\${cleanNum}\`, '_blank');
                          } else alert('Telefone não informado');
                        }}>WhatsApp</button>
                        <button className="btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => setSystemDetailsModal(deal)}>
                          Detalhes
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}`;

if (app.includes(oldDataLogic)) {
  app = app.replace(oldDataLogic, newDataLogic);
  console.log('Data logic replaced OK');
} else {
  console.log('Data logic NOT FOUND - using line splice');
  const lines = app.split('\n');
  // Find start line (the {(() => { line after grid div)
  let startIdx = -1;
  let endIdx = -1;
  for (let i = 2700; i < 2790; i++) {
    if (lines[i] && lines[i].includes('{(() => {') && !startIdx) startIdx = i;
    if (startIdx && lines[i] && lines[i].trim() === '})()}') { endIdx = i; break; }
  }
  if (startIdx > -1 && endIdx > -1) {
    lines.splice(startIdx, endIdx - startIdx + 1, newDataLogic);
    app = lines.join('\n');
    console.log('Data logic replaced via splice from line', startIdx, 'to', endIdx);
  } else {
    console.log('Could not find data logic boundaries! start:', startIdx, 'end:', endIdx);
  }
}

// 4. Auto-load sheets data when Sistema tab is activated (add useEffect if not present)
// Check if there's already a useEffect for loading sheets on tab change
if (!app.includes("activeTab === 'sistema' && !sheetsLoaded")) {
  // Add a useEffect to auto-load sheets data when Sistema tab is activated
  const handleLoadSheetsFunc = "const handleLoadSheets = async () => {";
  if (app.includes(handleLoadSheetsFunc)) {
    const insertPoint = app.indexOf(handleLoadSheetsFunc);
    const autoLoadEffect = `// Auto-load sheets when Sistema tab is opened
    React.useEffect(() => {
      if (activeTab === 'sistema' && !sheetsLoaded && !sheetsLoading) {
        handleLoadSheets();
      }
    }, [activeTab]);

    `;
    app = app.substring(0, insertPoint) + autoLoadEffect + app.substring(insertPoint);
    console.log('Auto-load effect added');
  }
}

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('All patches applied successfully!');
