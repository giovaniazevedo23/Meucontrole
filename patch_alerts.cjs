const fs = require('fs');

// Fix Admin app
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');
const adminRegex = /if \(loginData\.name && loginData\.cpf && loginData\.company && loginData\.companyCnpj && loginData\.email\) \{[\s\S]*?setCurrentUser\(\{...userDoc\}\);[\s\S]*?\}\s*\}\s*\};/m;

const adminMatch = app.match(adminRegex);
if(adminMatch) {
    let block = adminMatch[0];
    let newBlock = block.replace(/\}\s*\}\s*\};$/, '} else {\n        alert("Por favor, preencha TODOS os campos, incluindo Nome Completo!");\n      }\n    }\n  };');
    app = app.replace(adminRegex, newBlock);
    fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
    console.log("Admin fixed");
}

// Fix Client app
let client = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');
const clientRegex = /if \(loginForm\.name && loginForm\.cnpj && loginForm\.phone && loginForm\.email\) \{[\s\S]*?setCurrentUser\(customerObj\);[\s\S]*?\}\s*\}\s*\};/m;

const clientMatch = client.match(clientRegex);
if(clientMatch) {
    let block = clientMatch[0];
    let newBlock = block.replace(/\}\s*\}\s*\};$/, '} else {\n        alert("Por favor, preencha TODOS os campos, incluindo Nome Completo!");\n      }\n    }\n  };');
    client = client.replace(clientRegex, newBlock);
    fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', client, 'utf8');
    console.log("Client fixed");
}
