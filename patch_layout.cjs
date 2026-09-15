const fs = require('fs');

// 1. Update CSS
let css = fs.readFileSync('cPRODUTOS-CONTROLE/src/index.css', 'utf8');
if (!css.includes('.responsive-login-wrapper')) {
  css += `
/* Responsive Grid for products (fallback if inline changed) */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }
}

/* Responsive Login Layout */
.responsive-login-wrapper {
  max-width: 450px !important;
  transition: all 0.3s ease;
}

@media (min-width: 800px) {
  .responsive-login-wrapper {
    max-width: 900px !important;
  }
  .responsive-login-card {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    text-align: left !important;
    padding: 3rem !important;
    gap: 3rem;
  }
  .responsive-login-brand {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-right: 1px solid var(--glass-border);
    padding-right: 3rem;
  }
  .responsive-login-brand img {
    align-self: flex-start;
  }
  .responsive-login-form {
    flex: 1.5;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}
`;
  fs.writeFileSync('cPRODUTOS-CONTROLE/src/index.css', css, 'utf8');
}

// 2. Update App.jsx Layouts
let app = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// A. Product Grid
app = app.replace(
  /gridTemplateColumns: 'repeat\(auto-fill, minmax\(250px, 1fr\)\)'/g,
  "gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))'"
);
// Viewed history grid
app = app.replace(
  /gridTemplateColumns: 'repeat\(auto-fill, minmax\(200px, 1fr\)\)'/g,
  "gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))'"
);

// B. Login Screen Wrapper
app = app.replace(
  /<div style=\{\{\s*padding:\s*'2rem 1rem',\s*maxWidth:\s*'400px',\s*margin:\s*'2rem auto',\s*width:\s*'100%'\s*\}\}>/g,
  '<div className="responsive-login-wrapper" style={{ padding: "2rem 1rem", maxWidth: "400px", margin: "2rem auto", width: "100%" }}>'
);

app = app.replace(
  /<div className="glass-panel" style=\{\{\s*padding:\s*'2rem',\s*borderRadius:\s*'1rem',\s*textAlign:\s*'center'\s*\}\}>/g,
  '<div className="glass-panel responsive-login-card" style={{ padding: "2rem", borderRadius: "1rem", textAlign: "center" }}>\n            <div className="responsive-login-brand">'
);

// Close the brand div and open form div
app = app.replace(
  /<p style=\{\{\s*color:\s*'var\(--text-secondary\)',\s*marginBottom:\s*'2rem'\s*\}\}>Acesse ou crie sua conta para continuar<\/p>/g,
  '<p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Acesse ou crie sua conta para continuar</p>\n            </div>\n            <div className="responsive-login-form">'
);

// Close the form div just before the closing </div> of the glass-panel
app = app.replace(
  /<\/button>\n              <\/form>\n            <\/div>\n          <\/div>\n        \)\}/g,
  '</button>\n              </form>\n            </div>\n            </div>\n          </div>\n        )}'
);

fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', app, 'utf8');
console.log('Layout patched successfully.');
