const fs = require('fs');

// 1. Update CSS
let css = fs.readFileSync('frontend/src/index.css', 'utf8');
if (!css.includes('.responsive-admin-login-wrapper')) {
  css += `

/* Responsive Admin Login Layout */
.responsive-admin-login-wrapper {
  width: 100%;
  max-width: 450px !important;
  padding: 2.5rem !important;
  transition: all 0.3s ease;
}

@media (min-width: 800px) {
  .responsive-admin-login-wrapper {
    max-width: 800px !important;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 3rem;
  }
  .responsive-admin-login-brand {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-right: 1px solid var(--glass-border);
    padding-right: 3rem;
    text-align: left !important;
  }
  .responsive-admin-login-brand img {
    margin-bottom: 1rem !important;
  }
  .responsive-admin-login-form {
    flex: 1.2;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}
`;
  fs.writeFileSync('frontend/src/index.css', css, 'utf8');
}

// 2. Update App.jsx Layouts
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// The admin login structure:
const oldLoginWrapper = '<div className="modal-content glass-panel" style={{ width: \'100%\', maxWidth: \'400px\', padding: \'2.5rem\' }}>';
const newLoginWrapper = '<div className="modal-content glass-panel responsive-admin-login-wrapper" style={{ width: \'100%\', maxWidth: \'400px\', padding: \'2.5rem\' }}>';
app = app.replace(oldLoginWrapper, newLoginWrapper);

const oldBrandStart = '<div style={{ textAlign: \'center\', marginBottom: \'2rem\' }}>';
const newBrandStart = '<div className="responsive-admin-login-brand" style={{ textAlign: \'center\', marginBottom: \'2rem\' }}>';
app = app.replace(oldBrandStart, newBrandStart);

const oldBrandEnd = '<p style={{ color: \'var(--text-secondary)\', fontSize: \'0.9rem\', marginTop: \'0.5rem\' }}>Faça login para acessar o sistema de estoque.</p>\n            </div>';
const newBrandEnd = '<p style={{ color: \'var(--text-secondary)\', fontSize: \'0.9rem\', marginTop: \'0.5rem\' }}>Faça login para acessar o sistema de estoque.</p>\n            </div>\n\n            <div className="responsive-admin-login-form">';
app = app.replace(oldBrandEnd, newBrandEnd);

const oldFormEnd = '</form>\n          </div>\n        </div>\n      );\n    }';
const newFormEnd = '</form>\n            </div>\n          </div>\n        </div>\n      );\n    }';
app = app.replace(oldFormEnd, newFormEnd);

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
console.log('Admin login layout patched successfully.');
