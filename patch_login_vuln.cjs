const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Fix CPF login vulnerability
const oldLoginBlock = /const userRef = doc\(db, 'users', cpfClean\);\s*const userSnap = await getDoc\(userRef\);\s*if \(userSnap\.exists\(\)\) \{\s*const userData = userSnap\.data\(\);\s*setCurrentUser\(\{\.\.\.userData, companyCnpj: userData\.companyCnpj \|\| '00\.000\.000\/0001-00'\}\);/m;

const newLoginBlock = `const userRef = doc(db, 'users', cpfClean);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.email !== loginData.email) {
            alert('Atenção: O CPF informado não corresponde ao E-mail digitado. Verifique seus dados.');
            return;
          }
          setCurrentUser({...userData, companyCnpj: userData.companyCnpj || '00.000.000/0001-00'});`;

if (oldLoginBlock.test(app)) {
    app = app.replace(oldLoginBlock, newLoginBlock);
    fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
    console.log('Login vulnerability patched');
} else {
    console.log('Regex failed');
}
