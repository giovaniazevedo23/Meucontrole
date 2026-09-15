const fs = require('fs');
let app = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// Add imports
app = app.replace(
  "import { collection, onSnapshot, doc, setDoc, getDocs, query, where, getDoc, updateDoc } from 'firebase/firestore';",
  "import { collection, onSnapshot, doc, setDoc, getDocs, query, where, getDoc, updateDoc } from 'firebase/firestore';\nimport { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';"
);

app = app.replace(
  "import { db } from './firebase';",
  "import { db, auth } from './firebase';"
);

// Add password state
app = app.replace(
  /const \[loginForm, setLoginForm\] = useState\(\{\s*cpf: '',\s*name: '',\s*cnpj: '',\s*phone: '',\s*email: ''\s*\}\);/,
  `const [loginForm, setLoginForm] = useState({
    cpf: '',
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    password: ''
  });`
);

// Add Forgot Password logic
const handleLoginStart = 'const handleLogin = async (e) => {';
const forgotPasswordFunc = `const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!loginForm.email) {
      alert('Por favor, informe seu E-mail de cadastro no campo "E-mail" e clique em "Esqueci minha senha" novamente.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginForm.email);
      alert('Se o e-mail estiver cadastrado, um link de restauração de senha foi enviado para ele!');
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar e-mail de recuperação.');
    }
  };

  `;
app = app.replace(handleLoginStart, forgotPasswordFunc + handleLoginStart);

// Rewrite login logic
const oldLoginLogic = `    if (loginMode === 'login') {
      const custRef = doc(db, 'customers', cpfClean);
      const custSnap = await getDoc(custRef);
      if (custSnap.exists()) {
        setCustomerInfo(custSnap.data());
      } else {
        alert("Cliente não encontrado. Por favor, crie uma conta.");
      }
    } else {`;

const newLoginLogic = `    if (loginMode === 'login') {
      try {
        if (!loginForm.email || !loginForm.password) {
          alert('Por favor, preencha E-mail e Senha para entrar.');
          return;
        }
        await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
        
        const custRef = doc(db, 'customers', cpfClean);
        const custSnap = await getDoc(custRef);
        if (custSnap.exists()) {
          setCustomerInfo(custSnap.data());
        } else {
          alert("Dados do cliente não encontrados no banco.");
        }
      } catch (error) {
        console.error(error);
        alert('Credenciais inválidas. Verifique seu E-mail, Senha e CPF.');
      }
    } else {`;

app = app.replace(oldLoginLogic, newLoginLogic);

// Rewrite register logic
const oldRegLogic = `        if (loginForm.name && loginForm.cnpj && loginForm.phone && loginForm.email) {
          const custRefCheck = doc(db, 'customers', cpfClean);
          const custSnapCheck = await getDoc(custRefCheck);
          if (custSnapCheck.exists()) {
            alert('Esse CPF já está vinculado a outro cadastro.');
            return;
          }
          const customerObj = {`;

const newRegLogic = `        if (loginForm.name && loginForm.cnpj && loginForm.phone && loginForm.email) {
          const custRefCheck = doc(db, 'customers', cpfClean);
          const custSnapCheck = await getDoc(custRefCheck);
          if (custSnapCheck.exists()) {
            alert('Esse CPF já está vinculado a outro cadastro.');
            return;
          }

          if (!loginForm.password || loginForm.password.length < 6) {
            alert('A senha deve ter no mínimo 6 caracteres.');
            return;
          }

          try {
            await createUserWithEmailAndPassword(auth, loginForm.email, loginForm.password);
          } catch(err) {
            if (err.code === 'auth/email-already-in-use') {
               alert('Este e-mail já está em uso.');
            } else {
               alert('Erro ao criar conta: ' + err.message);
            }
            return;
          }

          const customerObj = {`;

app = app.replace(oldRegLogic, newRegLogic);

// Replace UI inputs
const oldEmailRegInput = `<input 
                            type="email" 
                            required 
                            placeholder="seu.email@exemplo.com"
                            value={loginForm.email}
                            onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                            style={styles.input}
                          />`;

const newEmailRegInput = `<input 
                            type="email" 
                            required 
                            placeholder="seu.email@exemplo.com"
                            value={loginForm.email}
                            onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                            style={styles.input}
                          />
                          <input 
                            type="password" 
                            required 
                            placeholder="Crie uma senha (mínimo 6 caracteres)"
                            value={loginForm.password}
                            onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                            style={styles.input}
                          />`;

app = app.replace(oldEmailRegInput, newEmailRegInput);

const oldLoginCpfBlock = `                  <input 
                    type="text" 
                    required 
                    placeholder="000.000.000-00"
                    value={loginForm.cpf}
                    onChange={handleCpfChangeClient}
                    maxLength="14"
                    style={styles.input}
                  />`;

const newLoginInputs = `                  {loginMode === 'login' && (
                    <>
                      <input 
                        type="email" 
                        required 
                        placeholder="Seu E-mail cadastrado"
                        value={loginForm.email}
                        onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                        style={styles.input}
                      />
                      <input 
                        type="password" 
                        required 
                        placeholder="Sua senha"
                        value={loginForm.password}
                        onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                        style={styles.input}
                      />
                    </>
                  )}
                  <input 
                    type="text" 
                    required 
                    placeholder="CPF (000.000.000-00)"
                    value={loginForm.cpf}
                    onChange={handleCpfChangeClient}
                    maxLength="14"
                    style={styles.input}
                  />`;

app = app.replace(oldLoginCpfBlock, newLoginInputs);

const oldSubmitBtnClient = `<button type="submit" style={styles.btnPrimary}>`;
const newSubmitBtnClient = `{loginMode === 'login' && (
                    <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                      <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: '#FF921C', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '14px' }}>
                        Esqueci minha senha
                      </button>
                    </div>
                  )}
                  <button type="submit" style={styles.btnPrimary}>`;

app = app.replace(oldSubmitBtnClient, newSubmitBtnClient);

fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', app, 'utf8');
console.log('Client Auth logic and UI patched.');
