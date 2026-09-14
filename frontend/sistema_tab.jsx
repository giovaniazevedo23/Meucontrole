              <div style={{ display: 'inline-block', position: 'relative', width: '100%', maxWidth: '600px' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Buscar por cliente, CPF, pedido, NFe..." 
                  value={sistemaSearch}
                  onChange={e => setSistemaSearch(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '2rem', border: '2px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                />
              </div>