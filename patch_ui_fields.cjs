const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const oldRegEmail = `<div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>E-mail</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="Seu melhor e-mail"
                        value={loginData.email}
                        onChange={e => setLoginData({...loginData, email: e.target.value})}
                      />
                    </div>`;

const newRegEmail = `<div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>E-mail</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="Seu melhor e-mail"
                        value={loginData.email}
                        onChange={e => setLoginData({...loginData, email: e.target.value})}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Senha</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="Crie uma senha forte"
                        value={loginData.password}
                        onChange={e => setLoginData({...loginData, password: e.target.value})}
                      />
                    </div>`;

app = app.replace(oldRegEmail, newRegEmail);

const oldLoginCpf = `<div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>CPF</label>`;

const newLoginCpf = `{loginMode === 'login' && (
                  <>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>E-mail</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="Seu e-mail cadastrado"
                        value={loginData.email}
                        onChange={e => setLoginData({...loginData, email: e.target.value})}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Senha</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="Sua senha"
                        value={loginData.password}
                        onChange={e => setLoginData({...loginData, password: e.target.value})}
                      />
                    </div>
                  </>
                )}
                
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>CPF</label>`;

app = app.replace(oldLoginCpf, newLoginCpf);

const oldSubmitButton = `<button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
                  {loginMode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}
                </button>`;

const newSubmitButton = `{loginMode === 'login' && (
                  <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                    <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--brand-orange)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.9rem' }}>
                      Esqueci minha senha
                    </button>
                  </div>
                )}
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
                  {loginMode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}
                </button>`;

app = app.replace(oldSubmitButton, newSubmitButton);

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
