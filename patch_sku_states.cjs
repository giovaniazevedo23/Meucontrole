const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

if (!app.includes('const [skuGenOpen, setSkuGenOpen] = useState(false);')) {
    const hookInsertionPoint = "const [newItem, setNewItem] = useState({ name: '', sku: '', quantity: 0, location: '', price: 0, category: 'Tecnologia', imageUrl: '', imageUrls: [], freeShipping: false, deliveryDays: 3, allowInstallments: false, maxInstallments: 1, hasInterest: false, interestRate: 0 });";
    
    const newHooks = `${hookInsertionPoint}
  const [skuGenOpen, setSkuGenOpen] = useState(false);
  const [skuGen, setSkuGen] = useState({ chars: 4, sep: '-', name: '', char1: '', char2: '', char3: '' });

  const generateSku = () => {
    let parts = [skuGen.name, skuGen.char1, skuGen.char2, skuGen.char3].filter(Boolean);
    parts = parts.map(p => p.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, skuGen.chars));
    setNewItem({...newItem, sku: parts.join(skuGen.sep)});
  };`;

    app = app.replace(hookInsertionPoint, newHooks);
    fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
    console.log('Fixed undefined states');
} else {
    console.log('Already fixed or regex failed');
}
