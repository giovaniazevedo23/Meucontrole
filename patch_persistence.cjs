const fs = require('fs');

let app = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

app = app.replace(
  /useEffect\(\(\) => \{\s*if \(customerInfo\?\.email\) \{\s*localStorage\.setItem\('vitrine_customer', JSON\.stringify\(customerInfo\)\);\s*\}\s*\}, \[customerInfo\]\);/g,
  `useEffect(() => {
    if (customerInfo && customerInfo.cpf) {
      localStorage.setItem('vitrine_customer', JSON.stringify(customerInfo));
    } else {
      localStorage.removeItem('vitrine_customer');
    }
  }, [customerInfo]);`
);

fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', app, 'utf8');
console.log('Patched customerInfo persistence.');
