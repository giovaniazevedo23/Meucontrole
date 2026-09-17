const fs = require('fs');

let adminApp = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const newTemplate = `Parabéns, {nome}! 🎉

Hoje o dia é todo seu, e nós não poderíamos deixar de comemorar juntos! 🎂

Para deixar o seu aniversário ainda mais especial, preparamos um presente exclusivo para você. Use o cupom abaixo em sua próxima compra e garanta {desconto}% de desconto em todo o nosso site:

🎫 Cupom: *{cupom}*

Aproveite, pois ele é válido por tempo limitado!

Clique no link abaixo para escolher o seu presente:
🌐 https://cprodutos-controle.onrender.com/

Tenha um dia incrível e cheio de alegrias!`;

adminApp = adminApp.replace(
  /const \[birthdayMessageTemplate, setBirthdayMessageTemplate\] = useState\(.*?\);/s,
  "const [birthdayMessageTemplate, setBirthdayMessageTemplate] = useState(`" + newTemplate + "`);"
);

fs.writeFileSync('frontend/src/App.jsx', adminApp, 'utf8');
console.log('Admin template patched');
