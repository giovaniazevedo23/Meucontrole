const fs = require('fs');

let dashPath = 'frontend/src/App.jsx';
let dash = fs.readFileSync(dashPath, 'utf8');

// 1. Remove the remaining "Adicionar Cupom" button that has the emoji ???
dash = dash.replace(
  /<button className="btn-secondary" onClick=\{.*?setIsCouponModalOpen\(true\).*?\}>[\s\S]*?Adicionar Cupom\s*<\/button>/,
  ''
);

// 2. Fix Movimentacoes client display logic: `m.client || "-"` -> `m.client || (m.reason?.includes('(Cliente:') ? m.reason.split('(Cliente:')[1].replace(')','') : "-")`
dash = dash.replace(
  /\{m\.client \|\| "-"\}/g,
  `{m.client || (m.reason?.includes('(Cliente:') ? m.reason.split('(Cliente:')[1].replace(')','') : "-")}`
);

// 3. Fix Clientes (Vendas) filter logic
dash = dash.replace(
  /\(movementFilter === 'ALL' \|\| \(movementFilter === 'CLIENTE' && m\.client\) \|\| m\.type === movementFilter\)/g,
  `(movementFilter === 'ALL' || (movementFilter === 'CLIENTE' && (m.client || m.reason?.includes('(Cliente:'))) || m.type === movementFilter)`
);

fs.writeFileSync(dashPath, dash);
console.log('Done refactor 4');
