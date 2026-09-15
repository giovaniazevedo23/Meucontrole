const fs = require('fs');

const cssBlock = `
/* Responsive Premium Admin Login Layout */
.responsive-admin-login-wrapper {
  flex-wrap: nowrap !important;
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
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    padding: 0 !important;
    margin: 0 !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: stretch !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    z-index: 9999 !important;
    flex-wrap: nowrap !important;
  }
  
  .responsive-admin-login-form-container {
    flex: 1;
    padding: 3rem 4rem !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
    background: #ffffff !important;
    overflow-y: auto !important;
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
  
  .responsive-admin-login-image::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(255,255,255,0.1), transparent);
  }

  .responsive-admin-login-brand {
    text-align: center !important;
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

fs.appendFileSync('cPRODUTOS-CONTROLE/src/index.css', cssBlock, 'utf8');

// Now patch App.jsx
let app = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

const regex = /if \(\!customerInfo\) \{\s*return \(\s*<div className="app-container"[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}/m;

const newLoginBlock = `if (!customerInfo) {
      return (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
          <div className="modal-content glass-panel responsive-admin-login-wrapper" style={{ padding: 0 }}>
            <div className="responsive-admin-login-form-container">
              <div className="responsive-admin-login-brand">
                <img src={logo} alt="Logo" style={{ height: '70px', width: '70px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)', fontSize: '1.8rem' }}>Bem-vindo à Loja</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Identifique-se para acessar o catálogo de produtos.</p>
              </div>
  
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                  type="button" 
                  className={loginMode === 'login' ? 'btn-primary' : 'btn-secondary'} 
                  style={{ flex: 1, padding: '0.75rem', fontWeight: 'bold' }} 
                  onClick={() => setLoginMode('login')}
                >
                  Já sou cliente
                </button>
                <button 
                  type="button" 
                  className={loginMode === 'register' ? 'btn-primary' : 'btn-secondary'} 
                  style={{ flex: 1, padding: '0.75rem', fontWeight: 'bold' }} 
                  onClick={() => setLoginMode('register')}
                >
                  Criar Conta
                </button>
              </div>
  
              <form onSubmit={handleLogin}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>CPF</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="000.000.000-00" 
                    value={loginForm.cpf}
                    onChange={handleCpfChange}
                  />
                </div>
                
                {loginMode === 'register' && (
                  <>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>CNPJ da Empresa (Fornecedor)</label>
                      <select 
                        required 
                        value={loginForm.cnpj}
                        onChange={handleCompanyChange}
                      >
                        <option value="">Selecione uma empresa...</option>
                        {companies.map(comp => (
                          <option key={comp.id || comp.cnpj} value={comp.cnpj}>{comp.name} - {comp.cnpj}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Seu Nome Completo</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: João da Silva" 
                        value={loginForm.name}
                        onChange={e => setLoginForm({ ...loginForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>E-mail</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="seu.email@exemplo.com"
                        value={loginForm.email}
                        onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                      <label>Seu WhatsApp</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="(00) 00000-0000"
                        value={loginForm.phone}
                        onChange={handlePhoneChange}
                        maxLength="15"
                      />
                    </div>
                  </>
                )}
                
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontWeight: 'bold', fontSize: '1rem' }}>
                  {loginMode === 'login' ? 'Entrar no Catálogo' : 'Acessar Catálogo'}
                </button>
              </form>
            </div>
            <div className="responsive-admin-login-image"></div>
          </div>
        </div>
      );
    }`;

if (regex.test(app)) {
  app = app.replace(regex, newLoginBlock);
  fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', app, 'utf8');
  console.log('Client login updated');
} else {
  console.log('Regex failed to match');
}
