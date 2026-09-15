const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

content = content.replace(
  "birthday: d.birthday || (matchingCustomer && (matchingCustomer.birthday || matchingCustomer.birthDate)) || (matchingSheet && matchingSheet['DATA DE NASCIMENTO']) || '',",
  "birthday: d.birthday || (matchingCustomer && (matchingCustomer.birthday || matchingCustomer.birthDate)) || (matchingSheet && (matchingSheet['DATA DE NASCIMENTO'] || matchingSheet['ANIVERSÁRIO'])) || '',"
);

fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
console.log('Birthday logic updated in frontend modal.');
