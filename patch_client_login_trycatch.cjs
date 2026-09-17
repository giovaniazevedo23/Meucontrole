const fs = require('fs');

let app = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

const target = `    if (loginMode === 'login') {
      const custRef = doc(db, 'customers', cpfClean);
      const custSnap = await getDoc(custRef);
      if (custSnap.exists()) {
        setCustomerInfo(custSnap.data());
      } else {
        alert("Cliente no encontrado. Por favor, crie uma conta.");
      }
    } else {`;

const replacement = `    if (loginMode === 'login') {
      try {
        const custRef = doc(db, 'customers', cpfClean);
        const custSnap = await getDoc(custRef);
        if (custSnap.exists()) {
          setCustomerInfo(custSnap.data());
        } else {
          alert("Cliente não encontrado. Por favor, crie uma conta.");
        }
      } catch (error) {
        console.error("Login error:", error);
        if (error.code === 'permission-denied') {
          alert("ERRO DE PERMISSÃO: O Firebase está bloqueando o acesso. Vá no painel do Firebase > Firestore Database > Regras e permita leitura (read: if true) para a coleção 'customers'.");
        } else {
          alert("Erro ao fazer login: " + error.message);
        }
      }
    } else {`;

// Replace dealing with encoding issues
let lines = app.split('\n');
let replaced = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("if (loginMode === 'login') {")) {
    if (lines[i+1].includes("const custRef = doc(db, 'customers', cpfClean);")) {
       lines[i+1] = `      try {\n        const custRef = doc(db, 'customers', cpfClean);`;
       lines[i+2] = `        const custSnap = await getDoc(custRef);`;
       lines[i+3] = `        if (custSnap.exists()) {`;
       lines[i+4] = `          setCustomerInfo(custSnap.data());`;
       lines[i+5] = `        } else {`;
       lines[i+6] = `          alert("Cliente não encontrado. Por favor, crie uma conta.");`;
       lines[i+7] = `        }\n      } catch (error) {\n        console.error("Login error:", error);\n        if (error.code === 'permission-denied') {\n          alert("ERRO DE PERMISSÃO: O banco de dados bloqueou o acesso. As Regras de Segurança do Firebase precisam ser ajustadas para permitir leitura.");\n        } else {\n          alert("Erro ao fazer login: " + error.message);\n        }\n      }`;
       replaced = true;
       break;
    }
  }
}

if (replaced) {
  fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', lines.join('\n'), 'utf8');
  console.log("Successfully injected try/catch into store login.");
} else {
  console.log("Failed to find login block.");
}
