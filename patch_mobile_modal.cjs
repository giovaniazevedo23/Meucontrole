const fs = require('fs');

let app = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// 1. Remove inline window.innerWidth and add class modal-ml-layout
app = app.replace(
  /<div style=\{\{ width: '100%', background: '#fff', borderRadius: '0\.5rem', padding: '1rem', display: 'flex', gap: '1rem', flexDirection: window\.innerWidth < 768 \? 'column-reverse' : 'row', alignItems: 'flex-start' \}\}>/g,
  '<div className="modal-ml-layout" style={{ width: "100%", background: "#fff", borderRadius: "0.5rem", padding: "1rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>'
);

// 2. Remove inline window.innerWidth and add class modal-ml-thumbnails
app = app.replace(
  /<div style=\{\{ display: 'flex', flexDirection: window\.innerWidth < 768 \? 'row' : 'column', gap: '0\.5rem', overflow: 'auto', maxHeight: window\.innerWidth < 768 \? 'none' : '400px' \}\}>/g,
  '<div className="modal-ml-thumbnails" style={{ display: "flex", gap: "0.5rem", overflow: "auto" }}>'
);

// 3. Add class to buttons row
app = app.replace(
  /<div style=\{\{ display: 'flex', gap: '0\.5rem' \}\}>\s*<button\s*className="btn-secondary"/g,
  '<div className="modal-buttons-row" style={{ display: "flex", gap: "0.5rem" }}>\n                    <button \n                      className="btn-secondary"'
);

// 4. Add the missing units text to the modal
app = app.replace(
  /<p style=\{\{ margin: '0 0 0\.25rem 0', color: '#3483fa', fontSize: '0\.9rem', fontWeight: '500' \}\}>Chegar\ em at\ \{viewingProduct\.deliveryDays \|\| 3\} dias<\/p>/g,
  `<p style={{ margin: '0 0 0.25rem 0', color: '#3483fa', fontSize: '0.9rem', fontWeight: '500' }}>Chegará em até {viewingProduct.deliveryDays || 3} dias</p>\n                  <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Em estoque: <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{viewingProduct.quantity} und</span></p>`
);

fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', app, 'utf8');

let css = fs.readFileSync('cPRODUTOS-CONTROLE/src/index.css', 'utf8');
css += `
/* Modal ML Layout Responsive */
.modal-ml-layout {
  flex-direction: row;
}
.modal-ml-thumbnails {
  flex-direction: column;
  max-height: 400px;
}
.modal-buttons-row {
  flex-direction: row;
}

@media (max-width: 768px) {
  .modal-ml-layout {
    flex-direction: column !important;
  }
  .modal-ml-thumbnails {
    flex-direction: row !important;
    max-height: none !important;
    width: 100%;
  }
  .modal-ml-thumbnails img {
    width: 60px !important;
    height: 60px !important;
  }
  .modal-buttons-row {
    flex-direction: column !important;
  }
}
`;

fs.writeFileSync('cPRODUTOS-CONTROLE/src/index.css', css, 'utf8');

console.log('Mobile optimizations and stock units applied.');
