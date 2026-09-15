const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const regex = /const userDoc = \{\s*name: loginData\.name,[\s\S]*?await setDoc\(doc\(db, 'users', cpfClean\), userDoc\);\s*setCurrentUser\(\{\.\.\.userDoc\}\);/m;

const newBlock = `const userDoc = {
            name: loginData.name,
            email: loginData.email,
            cpf: loginData.cpf,
            company: loginData.company,
            companyCnpj: loginData.companyCnpj,
            role: loginData.role,
            phone: loginData.phone || '',
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', cpfClean), userDoc);
          
          if (loginData.companyCnpj && loginData.company) {
             const compRef = doc(db, 'companies', loginData.companyCnpj.replace(/\\D/g, ''));
             await setDoc(compRef, {
                 name: loginData.company,
                 cnpj: loginData.companyCnpj,
                 createdAt: new Date().toISOString()
             }, { merge: true });
          }

          setCurrentUser({...userDoc});`;

if(regex.test(app)) {
    app = app.replace(regex, newBlock);
    fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
    console.log('Fixed handleLogin companies registration');
} else {
    console.log('Regex failed for handleLogin companies');
}
