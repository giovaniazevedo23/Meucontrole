const fs = require('fs');

let adminApp = fs.readFileSync('frontend/src/App.jsx', 'utf8');

adminApp = adminApp.replace(
  /const couponCode = `NIVER\$\{customer\.cpf\.replace\(\/\\D\/g, ''\)\.slice\(0, 4\)\}\$\{Math\.floor\(Math\.random\(\) \* 100\)\}`;/,
  "const couponCode = `ANIVERSARIO${Math.floor(1000 + Math.random() * 9000)}`;"
);

fs.writeFileSync('frontend/src/App.jsx', adminApp, 'utf8');
console.log('Admin birthday coupon prefix patched');
