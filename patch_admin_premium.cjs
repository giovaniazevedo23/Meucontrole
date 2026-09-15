const fs = require('fs');

// 1. Rewrite CSS
let css = fs.readFileSync('frontend/src/index.css', 'utf8');

// Remove the old injected CSS block
const startIdx = css.indexOf('/* Responsive Admin Login Layout */');
if (startIdx !== -1) {
  css = css.substring(0, startIdx);
}

css += `
/* Responsive Premium Admin Login Layout */
.responsive-admin-login-wrapper {
  width: 100%;
  max-width: 450px !important;
  padding: 2.5rem !important;
  transition: all 0.3s ease;
  overflow: hidden;
}

.responsive-admin-login-image {
  display: none;
}

@media (min-width: 800px) {
  .responsive-admin-login-wrapper {
    max-width: 1000px !important;
    padding: 0 !important;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    min-height: 600px;
    border-radius: 24px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }
  
  .responsive-admin-login-form-container {
    flex: 1;
    padding: 4rem 3rem !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: var(--glass-bg);
  }

  .responsive-admin-login-image {
    display: block;
    flex: 1.2;
    background-image: url('/login-hero.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
  }
  
  /* Add a subtle overlay to the image */
  .responsive-admin-login-image::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(255,255,255,0.1), transparent);
  }

  .responsive-admin-login-brand {
    text-align: left !important;
    margin-bottom: 3rem !important;
  }
  
  .responsive-admin-login-brand img {
    height: 70px !important;
    width: 70px !important;
    margin-bottom: 1.5rem !important;
  }
  
  .responsive-admin-login-brand h2 {
    font-size: 2rem !important;
    font-weight: 800;
  }
}
`;
fs.writeFileSync('frontend/src/index.css', css, 'utf8');

// 2. Rewrite App.jsx structure
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Instead of relying on finding exact strings which might be mangled, let's use a regex to replace the entire login modal body.
// The login block starts at `<div className="modal-content glass-panel responsive-admin-login-wrapper"` 
// and ends at the closing `</div>` right before `</div>\n        </div>\n      );\n    }`

const replaceRegex = /<div className="modal-content glass-panel responsive-admin-login-wrapper".*?(?=\n\s*<\/div>\n\s*<\/div>\n\s*\);\n\s*\})/s;

const newBlock = `<div className="modal-content glass-panel responsive-admin-login-wrapper" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
          <div className="responsive-admin-login-form-container">
            <div className="responsive-admin-login-brand" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <img src={logo} alt="Logo GESTE" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Bem-vindo ao GESTE</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Faça login para acessar o sistema de estoque.</p>
            </div>

            <div className="responsive-admin-login-form">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button 
                  type="button" 
                  className={loginMode === 'login' ? 'btn-primary' : 'btn-secondary'} 
                  style={{ flex: 1, padding: '0.5rem' }} 
                  onClick={() => setLoginMode('login')}
                >
                  Entrar
                </button>
                <button 
                  type="button" 
                  className={loginMode === 'register' ? 'btn-primary' : 'btn-secondary'} 
                  style={{ flex: 1, padding: '0.5rem' }} 
                  onClick={() => setLoginMode('register')}
                >
                  Cadastrar
                </button>
              </div>

              <form onSubmit={handleLogin}>
                {loginMode === 'register' && (
                  <>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Nome Completo</label>
                      <input 
                        type="text" 
                        required 
                        value={loginForm.name}
                        onChange={e => setLoginForm({...loginForm, name: e.target.value})}
                      />
                    </div>
                  </>
                )}
                
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Email</label>
                  <input 
                    type="email" 
                    required 
                    value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Senha</label>
                  <input 
                    type="password" 
                    required 
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}>
                  {loginMode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}
                </button>
              </form>
            </div>
          </div>
          <div className="responsive-admin-login-image"></div>`;

if (replaceRegex.test(app)) {
  app = app.replace(replaceRegex, newBlock);
  fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
  console.log('Login layout injected.');
} else {
  console.log('Could not find regex match for login block.');
}
