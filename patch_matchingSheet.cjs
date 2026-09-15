const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const regex = /const matchingSheet = sheetPedidos\.find\([\s\S]*?\)\s*\|\|\s*sheetClientes\.find\([\s\S]*?\);/;

const replacement = `const matchingSheet = sheetPedidos.find(row => 
          (row['CPF'] && d.cpf && row['CPF'] === d.cpf) ||
          (row['CPF'] && d.customerCpf && row['CPF'] === d.customerCpf) ||
          (row['USUARIO'] && d.client && row['USUARIO'].toLowerCase() === d.client.toLowerCase())
        ) || sheetClientes.find(row => 
          (row['CPF'] && d.cpf && row['CPF'] === d.cpf) ||
          (row['CPF'] && d.customerCpf && row['CPF'] === d.customerCpf) ||
          (row['NOME'] && d.client && row['NOME'].toLowerCase() === d.client.toLowerCase())
        ) || sheetVendas.find(row => 
          (row['NOME DOS CLIENTES'] && d.client && row['NOME DOS CLIENTES'].toLowerCase() === d.client.toLowerCase())
        );`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
  console.log('Successfully patched matchingSheet to include sheetVendas');
} else {
  console.log('Regex did not match.');
}
