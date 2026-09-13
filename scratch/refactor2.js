const fs = require('fs');
let dashPath = 'frontend/src/App.jsx';
let dash = fs.readFileSync(dashPath, 'utf8');

// 1. Movimentacoes - Cliente Column & Remove Alert Icon
// In the headers:
dash = dash.replace(
  /<th>Usuário<\/th>/,
  '<th>Usuário</th>\n                    <th>Cliente</th>'
);
// In the rows:
dash = dash.replace(
  /<td>\{m\.user\}<\/td>/g,
  '<td>{m.user}</td>\n                      <td>{m.client || "-"}</td>'
);
// In the filter buttons:
dash = dash.replace(
  /<button className=\{movementFilter === 'PERDA'.*?🚨 Perdas\/Avarias<\/button>/,
  `<button className={movementFilter === 'PERDA' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMovementFilter('PERDA')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Perdas/Avarias</button>
                <button className={movementFilter === 'CLIENTE' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMovementFilter('CLIENTE')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Clientes (Vendas)</button>`
);
// In the rows filter logic:
dash = dash.replace(
  /movementFilter === 'ALL' \|\| m\.type === movementFilter/g,
  `(movementFilter === 'ALL' || (movementFilter === 'CLIENTE' && m.client) || m.type === movementFilter)`
);

// Remove alert icon from type string:
dash = dash.replace(
  /\{m\.type === 'ENTRADA' \? '↓' : m\.type === 'SAIDA' \? '↑' : m\.type === 'PERDA' \? '🚨' : '⚙️'\} \{m\.type\}/g,
  `{m.type === 'ENTRADA' ? '↓' : m.type === 'SAIDA' ? '↑' : '⚙️'} {m.type}`
);
dash = dash.replace(
  /🚨/g,
  ''
);

// 2. Curva ABC Quantity
// I need to look up where Curva ABC renders its table. Let's do a loose replace of item.quantity in that table.
dash = dash.replace(
  /<td style=\{\{ textAlign: 'right' \}\}>\{item\.quantity\}<\/td>/g,
  `<td style={{ textAlign: 'right' }}>{item.sold || 0}</td>`
);

// 3. Remove Programacao tab button from Sidebar
dash = dash.replace(
  /<button className=\{activeTab === 'programacao'.*?Serviços de Programação.*?<\/button>/s,
  ''
);

// 4. Transform Programacao from activeTab to a Modal `isDevManagerOpen`
// First, add the state for it
dash = dash.replace(
  /const \[isDevModalOpen, setIsDevModalOpen\] = useState\(false\);/,
  `const [isDevManagerOpen, setIsDevManagerOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);`
);

// Add the button in CRM Vendas
// Look for Contas a pagar and add the button next to it. Wait, the user said "em contas a receber" or "CRM Vendas".
// Let's add it right under Contas a Receber block.
dash = dash.replace(
  /<h3 style=\{\{ margin: '0 0 0\.5rem 0', color: 'var\(--text-primary\)' \}\}>Contas a receber<\/h3>/,
  `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Contas a receber</h3>
    <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setIsDevManagerOpen(true)}>+ Serviços de Programação</button>
  </div>`
);

// Now change the activeTab === 'programacao' rendering to isDevManagerOpen modal rendering.
// We will replace {activeTab === 'programacao' && ( with {isDevManagerOpen && ( <div className="modal-overlay"...> <div className="modal-content"...>
dash = dash.replace(
  /\{activeTab === 'programacao' && \(\s*<>\s*<div className="toolbar glass-panel" style=\{\{ padding: '1\.5rem', marginBottom: '1\.5rem'/s,
  `{isDevManagerOpen && (
    <div className="modal-overlay" onClick={() => setIsDevManagerOpen(false)} style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '800px', padding: '1.5rem', borderRadius: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="toolbar" style={{ marginBottom: '1.5rem'`
);

// We need to close this modal properly. Where it ended with `</>\n    )}` we replace with `</div></div>)}`.
// We have to be careful with the exact string. Let's do it using Regex.
dash = dash.replace(
  /<\/form>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/>\s*\)\}/,
  `</form>
            </div>
          </div>
        )}
      </div>
    </div>
  )}`
);

// 5. Replace 'Gestão de compras (Fornecedores)'
dash = dash.replace(/Gestão de compras \(Fornecedores\)/g, 'Gestão de Compras');


fs.writeFileSync(dashPath, dash);
console.log('Done refactor 2');
