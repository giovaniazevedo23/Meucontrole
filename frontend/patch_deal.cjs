const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update useState
const stateSearch = "const [newDeal, setNewDeal] = useState({ client: '', phone: '', salesperson: currentUser?.name || '', title: '', value: 0, products: [] });";
const stateRep = "const [newDeal, setNewDeal] = useState({ client: '', phone: '', customerCpf: '', birthday: '', salesperson: currentUser?.name || '', title: '', value: 0, products: [] });";
app = app.replace(stateSearch, stateRep);

// 2. Update handleAddDeal
const handleSearch = `  const handleAddDeal = async (e) => {
    e.preventDefault();
    const deal = {
      ...newDeal,
      id: Date.now().toString(),
      status: 'Prospecção',
      date: new Date().toISOString(),
      salesperson: currentUser.name,
      companyCnpj: currentUser.companyCnpj || currentUser.cnpj || '00.000.000/0001-00',
      tracking: [{ msg: 'Oportunidade criada', date: new Date().toISOString() }]
    };
    await setDoc(doc(db, 'deals', deal.id), deal);
    setIsDealModalOpen(false);
    setNewDeal({ client: '', title: '', value: 0, products: [] });
  };`;

const handleRep = `  const handleAddDeal = async (e) => {
    e.preventDefault();
    const deal = {
      ...newDeal,
      id: Date.now().toString(),
      status: 'Prospecção',
      date: new Date().toISOString(),
      salesperson: newDeal.salesperson || currentUser.name,
      companyCnpj: currentUser.companyCnpj || currentUser.cnpj || '00.000.000/0001-00',
      tracking: [{ msg: 'Oportunidade criada', date: new Date().toISOString() }]
    };
    
    // Save or create customer to enable birthday tracking
    if (newDeal.client && (newDeal.phone || newDeal.customerCpf || newDeal.birthday)) {
      const custId = newDeal.customerCpf ? newDeal.customerCpf.replace(/\\D/g, '') : Date.now().toString();
      await setDoc(doc(db, 'customers', custId), {
        name: newDeal.client,
        phone: newDeal.phone || '',
        cpf: newDeal.customerCpf || custId,
        birthday: newDeal.birthday || '',
        companyCnpj: currentUser.companyCnpj || currentUser.cnpj || '00.000.000/0001-00'
      }, { merge: true });
    }
    
    await setDoc(doc(db, 'deals', deal.id), deal);
    setIsDealModalOpen(false);
    setNewDeal({ client: '', phone: '', customerCpf: '', birthday: '', salesperson: currentUser?.name || '', title: '', value: 0, products: [] });
  };`;
app = app.replace(handleSearch, handleRep);

// 3. Update Modal UI
const uiSearch = `                <div className="form-group">
                  <label>Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    value={newDeal.phone}
                    onChange={e => setNewDeal({...newDeal, phone: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Título do Negócio</label>`;

const uiRep = `                <div className="form-group">
                  <label>Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    value={newDeal.phone}
                    onChange={e => setNewDeal({...newDeal, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>CPF do Cliente (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="000.000.000-00"
                    value={newDeal.customerCpf || ''}
                    onChange={e => setNewDeal({...newDeal, customerCpf: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={newDeal.birthday || ''}
                    onChange={e => setNewDeal({...newDeal, birthday: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Título do Negócio</label>`;
app = app.replace(uiSearch, uiRep);

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('Done!');
