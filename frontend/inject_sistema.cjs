const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add states
const stateMatch = "const [searchTerm, setSearchTerm] = useState('');";
if (app.includes(stateMatch) && !app.includes('sistemaSearch')) {
  app = app.replace(stateMatch, stateMatch + '\n  const [sistemaSearch, setSistemaSearch] = useState(\'\');\n  const [systemDetailsModal, setSystemDetailsModal] = useState(null);');
}

// 2. Replace button
const btnMatch = "<button className={activeTab === 'config-nfe' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('config-nfe')} style={activeTab !== 'config-nfe' ? { color: 'var(--text-primary)' } : {}}>\n            Configurações NFe\n          </button>";
if (app.includes(btnMatch)) {
  app = app.replace(btnMatch, "<button className={activeTab === 'sistema' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('sistema')} style={activeTab !== 'sistema' ? { color: 'var(--text-primary)' } : {}}>\n            Sistema\n          </button>");
}

// 3. Extract the clean tab content
const cleanTab = `
        {activeTab === 'sistema' && (
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1rem', minHeight: '600px' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', position: 'relative', width: '100%', maxWidth: '600px' }}>
                <input 
                  type="text" 
                  placeholder="Buscar por cliente, CPF, pedido, NFe..." 
                  value={sistemaSearch}
                  onChange={e => setSistemaSearch(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 1rem', borderRadius: '2rem', border: '2px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {(() => {
                const s = sistemaSearch.toLowerCase();
                return deals.filter(d => 
                  !s || 
                  (d.client && d.client.toLowerCase().includes(s)) ||
                  (d.cpf && d.cpf.includes(s)) ||
                  (d.customerCpf && d.customerCpf.includes(s)) ||
                  (d.id && d.id.toLowerCase().includes(s))
                ).map(deal => {
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
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Rastreio:</span>
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
              })()}
            </div>
          </div>
        )}

      </main>

      {systemDetailsModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2>Detalhes do Pedido #{systemDetailsModal.id.slice(-6)}</h2>
              <button className="close-btn" onClick={() => setSystemDetailsModal(null)}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3>Dados do Cliente</h3>
                <div><strong>Nome:</strong> {systemDetailsModal.client || 'N/A'}</div>
                <div><strong>Telefone:</strong> {systemDetailsModal.phone || systemDetailsModal.customerPhone || 'N/A'}</div>
              </div>
              <div>
                <h3>Detalhes Financeiros</h3>
                <div><strong>Valor:</strong> R$ {Number(systemDetailsModal.value || systemDetailsModal.total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div><strong>Status:</strong> {systemDetailsModal.status}</div>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button className="btn-primary" onClick={() => setSystemDetailsModal(null)} style={{ width: '100%', padding: '1rem' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
`;

// Replace the block from activeTab === 'config-nfe' to </main>
const lines = app.split('\n');
const startIdx = lines.findIndex(l => l.includes("activeTab === 'config-nfe' && ("));
const endIdx = lines.findIndex(l => l.trim() === "</main>");

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 1, cleanTab);
  app = lines.join('\n');
}

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('App.jsx reconstructed successfully!');
