const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to \n for easier manipulation
content = content.replace(/\r\n/g, '\n');

// Remove duplicate whatsapp
const whatsappField = `                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                      <label>Seu WhatsApp</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="(00) 00000-0000"
                        value={loginData.phone}
                        onChange={handlePhoneChangeAdmin}
                      />
                    </div>`;
const doubleWhatsapp = whatsappField + '\n' + whatsappField;
if (content.includes(doubleWhatsapp)) {
  content = content.replace(doubleWhatsapp, whatsappField);
  console.log('Removed duplicate whatsapp via normalized string');
}

// Find the block from Nome da Empresa up to E-mail da Empresa
const startRegex = /<div className="form-group" style={{ marginBottom: '2rem' }}>\s*<label>Nome da Empresa<\/label>/;
const endStr = `                      <input 
                        type="email" 
                        required 
                        placeholder="contato@empresa.com"
                        value={loginData.companyEmail}
                        onChange={e => setLoginData({...loginData, companyEmail: e.target.value})}
                      />
                    </div>`;

const matchStart = content.match(startRegex);
if (matchStart) {
  const startIndex = matchStart.index;
  const endIndex = content.indexOf(endStr, startIndex);
  if (endIndex !== -1) {
    const fullEndIndex = endIndex + endStr.length;
    
    const newCompanyFields = `                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                      <label>Selecione sua Empresa</label>
                      <select 
                        value={loginData.companySelect || ''} 
                        onChange={e => {
                          const selectedValue = e.target.value;
                          if (selectedValue === 'NEW') {
                            setLoginData({...loginData, companySelect: 'NEW', companyCnpj: '', company: ''});
                          } else if (selectedValue) {
                            const selectedCompany = companies.find(c => c.cnpj === selectedValue);
                            setLoginData({
                              ...loginData, 
                              companySelect: selectedValue,
                              companyCnpj: selectedCompany?.cnpj || '',
                              company: selectedCompany?.name || '',
                              companyEmail: selectedCompany?.email || loginData.companyEmail || ''
                            });
                          } else {
                            setLoginData({...loginData, companySelect: '', companyCnpj: '', company: ''});
                          }
                        }}
                        required
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white', width: '100%', outline: 'none' }}
                      >
                        <option value="">Selecione uma empresa</option>
                        {companies.map(c => (
                          <option key={c.id || c.cnpj} value={c.cnpj}>{c.name} ({c.cnpj})</option>
                        ))}
                        <option value="NEW">+ Cadastrar Empresa</option>
                      </select>
                    </div>

                    {loginData.companySelect === 'NEW' && (
                      <>
                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                          <label>Nome da Empresa</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Ex: Minha Empresa Ltda"
                            value={loginData.company}
                            onChange={e => setLoginData({...loginData, company: e.target.value})}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                          <label>CNPJ da Empresa</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="00.000.000/0000-00"
                            value={loginData.companyCnpj}
                            maxLength={18}
                            onChange={e => {
                              let v = e.target.value.replace(/\\D/g, '');
                              if (v.length > 14) v = v.slice(0, 14);
                              v = v.replace(/^(\\d{2})(\\d)/, '$1.$2');
                              v = v.replace(/^(\\d{2})\\.(\\d{3})(\\d)/, '$1.$2.$3');
                              v = v.replace(/\\.(\\d{3})(\\d)/, '.$1/$2');
                              v = v.replace(/(\\d{4})(\\d)/, '$1-$2');
                              setLoginData({...loginData, companyCnpj: v});
                            }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                          <label>E-mail da Empresa</label>
                          <input 
                            type="email" 
                            required 
                            placeholder="contato@empresa.com"
                            value={loginData.companyEmail}
                            onChange={e => setLoginData({...loginData, companyEmail: e.target.value})}
                          />
                        </div>
                      </>
                    )}`;
    
    content = content.slice(0, startIndex) + newCompanyFields + content.slice(fullEndIndex);
    console.log('Replaced Company fields successfully!');
  } else {
    console.log('Could not find the endStr');
  }
} else {
  console.log('Could not match startRegex');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
