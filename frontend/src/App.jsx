import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import logo from './assets/logo.jpg';
import './App.css';

// Mocked data to simulate AWS Backend initially
const initialItems = [
  { id: '1', sku: 'LAP-01', name: 'MacBook Pro 16"', quantity: 45, location: 'A-12', price: 12000, lastMovementDate: '2023-10-01T10:00:00Z' },
  { id: '2', sku: 'MON-02', name: 'Monitor Dell 27"', quantity: 12, location: 'B-04', price: 2500, lastMovementDate: '2023-10-05T14:30:00Z' },
  { id: '3', sku: 'MSE-03', name: 'Logitech MX Master 3', quantity: 150, location: 'C-01', price: 600, lastMovementDate: '2023-10-10T09:15:00Z' },
  { id: '4', sku: 'KBD-04', name: 'Keychron K2', quantity: 4, location: 'C-02', price: 800, lastMovementDate: '2023-09-20T16:45:00Z' },
];

const initialMovements = [
  // Mock movements for Jan
  { id: 'm1', sku: 'LAP-01', type: 'ENTRADA', quantity: 120, date: '2023-01-15T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  { id: 'm2', sku: 'LAP-01', type: 'SAIDA', quantity: 80, date: '2023-01-20T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  // Fev
  { id: 'm3', sku: 'LAP-01', type: 'ENTRADA', quantity: 150, date: '2023-02-15T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  { id: 'm4', sku: 'LAP-01', type: 'SAIDA', quantity: 90, date: '2023-02-20T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  // Mar
  { id: 'm5', sku: 'LAP-01', type: 'ENTRADA', quantity: 200, date: '2023-03-15T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  { id: 'm6', sku: 'LAP-01', type: 'SAIDA', quantity: 180, date: '2023-03-20T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  // Abr
  { id: 'm7', sku: 'LAP-01', type: 'ENTRADA', quantity: 170, date: '2023-04-15T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  { id: 'm8', sku: 'LAP-01', type: 'SAIDA', quantity: 210, date: '2023-04-20T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  // Mai
  { id: 'm9', sku: 'LAP-01', type: 'ENTRADA', quantity: 250, date: '2023-05-15T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  { id: 'm10', sku: 'LAP-01', type: 'SAIDA', quantity: 150, date: '2023-05-20T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  // Jun
  { id: 'm11', sku: 'LAP-01', type: 'ENTRADA', quantity: 310, date: '2023-06-15T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  { id: 'm12', sku: 'LAP-01', type: 'SAIDA', quantity: 220, date: '2023-06-20T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  // Jul
  { id: 'm13', sku: 'LAP-01', type: 'ENTRADA', quantity: 280, date: '2023-07-15T10:00:00Z', user: 'Admin', reason: 'Histórico' },
  { id: 'm14', sku: 'LAP-01', type: 'SAIDA', quantity: 240, date: '2023-07-20T10:00:00Z', user: 'Admin', reason: 'Histórico' },
];

const getStatusDetails = (quantity) => {
  if (quantity <= 5) return { text: 'Estoque Crítico', className: 'status-critical' };
  if (quantity <= 20) return { text: 'Estoque Baixo', className: 'status-low-stock' };
  return { text: 'Em Estoque', className: 'status-in-stock' };
};

function App() {
  // Auth & User State
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('controle_user')) || null);
  const [loginData, setLoginData] = useState({ name: '', cpf: '', company: '', role: 'Vendedor' });

  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('controle_items')) || initialItems);
  const [movements, setMovements] = useState(() => JSON.parse(localStorage.getItem('controle_movements')) || initialMovements);
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('controle_orders')) || []);
  const [activeTab, setActiveTab] = useState('estoque'); // 'estoque', 'movimentacoes', 'relatorios', 'compras'
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  
  const [newItem, setNewItem] = useState({ name: '', sku: '', quantity: 0, location: '', price: 0 });
  const [adjustData, setAdjustData] = useState({ reason: '', type: 'AJUSTE', quantity: 0 });
  const [newOrder, setNewOrder] = useState({ supplier: '', cnpj: '', products: [], document: '', issueDate: '', totalValue: 0 });
  const [orderProduct, setOrderProduct] = useState({ sku: '', name: '', quantity: 1, price: 0, location: '' });
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [movementFilter, setMovementFilter] = useState('ALL'); // ALL, ENTRADA, SAIDA
  
  // Profile Image State
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = React.useRef(null);

  // CRM States
  const [deals, setDeals] = useState(() => JSON.parse(localStorage.getItem('controle_deals')) || []);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({ client: '', phone: '', salesperson: currentUser?.name || '', title: '', value: 0, products: [] });
  const [dealProduct, setDealProduct] = useState({ sku: '', name: '', quantity: 1, price: 0 });
  const [crmTab, setCrmTab] = useState('dashboard');
  const [salesGoal, setSalesGoal] = useState(() => JSON.parse(localStorage.getItem('controle_goal')) || 30500);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  
  // Cart States
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('controle_cart')) || []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState('PIX');
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('controle_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('controle_movements', JSON.stringify(movements)); }, [movements]);
  useEffect(() => { localStorage.setItem('controle_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('controle_deals', JSON.stringify(deals)); }, [deals]);
  useEffect(() => { localStorage.setItem('controle_user', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('controle_goal', JSON.stringify(salesGoal)); }, [salesGoal]);
  useEffect(() => { localStorage.setItem('controle_cart', JSON.stringify(cart)); }, [cart]);
  
  // NF-e States
  const [isNfeModalOpen, setIsNfeModalOpen] = useState(false);
  const [selectedNfeDeal, setSelectedNfeDeal] = useState(null);
  const [nfeFormData, setNfeFormData] = useState({
    cnpjDestinatario: '',
    cepDestinatario: '',
    enderecoDestinatario: '',
    cidadeDestinatario: '',
    cfop: '5102 - Venda de mercadoria adquirida ou recebida de terceiros',
    ncm: '8471.30.12'
  });
  const [isEmitindoNfe, setIsEmitindoNfe] = useState(false);
  const [isNfeListModalOpen, setIsNfeListModalOpen] = useState(false);

  // CNPJ Modal States
  const [isCnpjModalOpen, setIsCnpjModalOpen] = useState(false);
  const [tempCnpj, setTempCnpj] = useState('');

  // Dynamic Chart Data based on movements from Jan to Dec
  const getChartData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(m => ({ name: m, entradas: 0, saidas: 0 }));
    
    movements.forEach(m => {
      const date = new Date(m.date);
      const monthIndex = date.getMonth(); // 0-11
      if (m.type === 'ENTRADA') {
        data[monthIndex].entradas += Number(m.quantity);
      } else if (m.type === 'SAIDA') {
        data[monthIndex].saidas += Number(m.quantity);
      }
    });
    
    return data;
  };
  const chartData = getChartData();

  // CRM Funnel Data calculation
  const getFunnelData = () => {
    const funnelStages = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação'];
    // Filter active deals in funnel
    const funnelDeals = deals.filter(d => funnelStages.includes(d.status));
    
    const colors = ['#3b82f6', '#0ea5e9', '#84cc16', '#eab308'];
    
    return funnelStages.map((stage, index) => {
      const value = deals.filter(d => d.status === stage).reduce((sum, d) => sum + d.value, 0);
      const count = deals.filter(d => d.status === stage).length;
      return {
        name: stage,
        value: value > 0 ? value : 0.01, // 0.01 to force render in Recharts if 0, but usually we map values
        actualValue: value,
        count: count,
        fill: colors[index]
      };
    }).sort((a, b) => funnelStages.indexOf(a.name) - funnelStages.indexOf(b.name));
  };
  
  const funnelData = getFunnelData();
  const totalCrmValue = deals.filter(d => d.status !== 'Ganho' && d.status !== 'Perdido').reduce((acc, d) => acc + d.value, 0);
  const totalWonValue = deals.filter(d => d.status === 'Ganho').reduce((acc, d) => acc + d.value, 0);
  const totalWonCount = deals.filter(d => d.status === 'Ganho').length;
  const totalLostCount = deals.filter(d => d.status === 'Perdido').length;
  const closedCount = totalWonCount + totalLostCount;
  const winRate = closedCount > 0 ? ((totalWonCount / closedCount) * 100).toFixed(1) : 0;
  const avgTicket = totalWonCount > 0 ? (totalWonValue / totalWonCount) : 0;

  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockAlertsCount = items.filter(i => i.quantity <= 20).length;

  const totalItems = items.length;
  const totalQuantity = items.reduce((acc, curr) => acc + Number(curr.quantity), 0);
  const criticalStockItems = items.filter(i => i.quantity <= 5).length;
  const lowStockItems = items.filter(i => i.quantity > 5 && i.quantity <= 20).length;

  const handleAddItem = (e) => {
    e.preventDefault();
    const item = {
      ...newItem,
      id: Date.now().toString(),
      quantity: Number(newItem.quantity),
      price: Number(newItem.price),
      lastMovementDate: new Date().toISOString()
    };
    setItems([...items, item]);
    
    // Log movement
    const movement = {
      id: Date.now().toString(),
      sku: item.sku,
      type: 'ENTRADA',
      quantity: item.quantity,
      date: item.lastMovementDate,
      user: currentUser.name,
      reason: 'Cadastro Inicial'
    };
    setMovements([movement, ...movements]);

    setIsModalOpen(false);
    setNewItem({ name: '', sku: '', quantity: 0, location: '', price: 0 });
  };

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id, delta, type = delta > 0 ? 'ENTRADA' : 'SAIDA', reason = delta > 0 ? 'Entrada manual' : 'Saída manual') => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const newQuantity = Number(item.quantity) + delta;
    
    const date = new Date().toISOString();

    setItems(items.map(i => i.id === id ? { ...i, quantity: newQuantity, lastMovementDate: date } : i));

    // Log movement
    const movement = {
      id: Date.now().toString(),
      sku: item.sku,
      type: type,
      quantity: Math.abs(delta),
      date: date,
      user: currentUser.name,
      reason: reason
    };
    setMovements([movement, ...movements]);
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustItem) return;
    
    // SAIDA e PERDA devem subtrair do estoque atual
    const isSubtraction = adjustData.type === 'SAIDA' || adjustData.type === 'PERDA';
    const delta = isSubtraction ? -Math.abs(adjustData.quantity) : Number(adjustData.quantity);
    
    // Passar o tipo real para a função para logar no histórico corretamente
    handleUpdateQuantity(adjustItem.id, delta, adjustData.type, adjustData.reason);
    
    setIsAdjustModalOpen(false);
    setAdjustItem(null);
    setAdjustData({ reason: '', type: 'AJUSTE', quantity: 0 });
  };

  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (value.length > 11) value = value.slice(0, 11);
    
    // Aplica a máscara
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    
    setLoginData({...loginData, cpf: value});
  };

  const handleCnpjChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 14) value = value.slice(0, 14);
    
    // Aplica a máscara XX.XXX.XXX/XXXX-XX
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    
    setCurrentUser({...currentUser, cnpj: value});
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(loginData.cpf)) {
      alert("Por favor, insira um CPF válido no formato 000.000.000-00");
      return;
    }
    
    if (loginData.name && loginData.cpf && loginData.company) {
      setCurrentUser({...loginData, role: 'Administrador', cnpj: '00.000.000/0001-00'});
    }
  };

  const handleAddProductToOrder = () => {
    if (!orderProduct.sku || !orderProduct.name || orderProduct.quantity <= 0) return;
    const updatedProducts = [...newOrder.products, { ...orderProduct }];
    const total = updatedProducts.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price)), 0);
    setNewOrder({ ...newOrder, products: updatedProducts, totalValue: total });
    setOrderProduct({ sku: '', name: '', quantity: 1, price: 0, location: '' });
  };
  
  const handleRemoveProductFromOrder = (index) => {
    const updatedProducts = newOrder.products.filter((_, i) => i !== index);
    const total = updatedProducts.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price)), 0);
    setNewOrder({ ...newOrder, products: updatedProducts, totalValue: total });
  };

  const handleAddOrder = (e) => {
    e.preventDefault();
    if (newOrder.products.length === 0) {
      alert('Adicione pelo menos um produto ao pedido!');
      return;
    }
    const order = {
      ...newOrder,
      id: Date.now().toString(),
      status: 'Requisição',
      date: new Date().toISOString()
    };
    setOrders([...orders, order]);
    setIsOrderModalOpen(false);
    setNewOrder({ supplier: '', cnpj: '', products: [], document: '', issueDate: '', totalValue: 0 });
  };

  const advanceOrderStatus = (orderId, currentStatus) => {
    const statusFlow = ['Requisição', 'Pedido de Compra', 'Aprovação', 'Faturado pelo Fornecedor', 'Recebido'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      
      if (nextStatus === 'Recebido') {
        const order = orders.find(o => o.id === orderId);
        let updatedItems = [...items];
        let newMovements = [...movements];
        const date = new Date().toISOString();

        order.products.forEach(prod => {
          const existingItemIndex = updatedItems.findIndex(i => i.sku === prod.sku);
          if (existingItemIndex >= 0) {
            updatedItems[existingItemIndex].quantity += Number(prod.quantity);
            updatedItems[existingItemIndex].lastMovementDate = date;
          } else {
            updatedItems.push({
              id: Date.now().toString() + Math.random().toString(),
              sku: prod.sku,
              name: prod.name,
              quantity: Number(prod.quantity),
              price: Number(prod.price),
              location: prod.location || 'Não definida',
              lastMovementDate: date
            });
          }
          
          newMovements.unshift({
            id: Date.now().toString() + Math.random().toString(),
            sku: prod.sku,
            type: 'ENTRADA',
            quantity: Number(prod.quantity),
            date: date,
            user: currentUser.name,
            reason: `Pedido de Compra: ${order.supplier}`
          });
        });
        
        setItems(updatedItems);
        setMovements(newMovements);
      }
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    }
  };

  // CRM Logic
  const handleAddProductToDeal = () => {
    if (!dealProduct.sku || !dealProduct.name || dealProduct.quantity <= 0) return;
    const updatedProducts = [...newDeal.products, { ...dealProduct }];
    const total = updatedProducts.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price)), 0);
    setNewDeal({ ...newDeal, products: updatedProducts, value: total });
    setDealProduct({ sku: '', name: '', quantity: 1, price: 0 });
  };

  const handleRemoveProductFromDeal = (index) => {
    const updatedProducts = newDeal.products.filter((_, i) => i !== index);
    const total = updatedProducts.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price)), 0);
    setNewDeal({ ...newDeal, products: updatedProducts, value: total });
  };

  const handleAddDeal = (e) => {
    e.preventDefault();
    const deal = {
      ...newDeal,
      id: Date.now().toString(),
      status: 'Prospecção',
      date: new Date().toISOString(),
      salesperson: currentUser.name
    };
    setDeals([...deals, deal]);
    setIsDealModalOpen(false);
    setNewDeal({ client: '', title: '', value: 0, products: [] });
  };

  const advanceDealStatus = (dealId, currentStatus) => {
    const statusFlow = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Ganho', 'Perdido'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1 && currentStatus !== 'Ganho' && currentStatus !== 'Perdido') {
      const nextStatus = statusFlow[currentIndex + 1];
      
      if (nextStatus === 'Ganho') {
        const deal = deals.find(d => d.id === dealId);
        let updatedItems = [...items];
        let newMovements = [...movements];
        const date = new Date().toISOString();

        deal.products.forEach(prod => {
          const existingItemIndex = updatedItems.findIndex(i => i.sku === prod.sku);
          if (existingItemIndex >= 0) {
            updatedItems[existingItemIndex].quantity -= Number(prod.quantity);
            updatedItems[existingItemIndex].lastMovementDate = date;
          } else {
             // Caso não exista e seja vendido, cadastra negativo? Regra diz saldo negativo é aceito.
             updatedItems.push({
              id: Date.now().toString() + Math.random().toString(),
              sku: prod.sku,
              name: prod.name,
              quantity: -Number(prod.quantity),
              price: Number(prod.price),
              location: 'Não definida',
              lastMovementDate: date
            });
          }
          
          newMovements.unshift({
            id: Date.now().toString() + Math.random().toString(),
            sku: prod.sku,
            type: 'SAIDA',
            quantity: Number(prod.quantity),
            date: date,
            user: currentUser.name,
            reason: `Venda Fechada (Cliente: ${deal.client})`
          });
        });
        
        setItems(updatedItems);
        setMovements(newMovements);
      }
      
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: nextStatus } : d));
    }
  };

  const markDealLost = (dealId) => {
    setDeals(deals.map(d => d.id === dealId ? { ...d, status: 'Perdido' } : d));
  };

  const handleOpenNfeModal = (deal) => {
    setSelectedNfeDeal(deal);
    setIsNfeModalOpen(true);
  };

  const handleEmitNfe = (e) => {
    e.preventDefault();
    setIsEmitindoNfe(true);
    // Simular tempo de resposta da SEFAZ
    setTimeout(() => {
      setDeals(deals.map(d => d.id === selectedNfeDeal.id ? { ...d, nfeEmitted: true } : d));
      setIsEmitindoNfe(false);
      setIsNfeModalOpen(false);
      
      // Geração do "PDF" em nova aba
      const printWindow = window.open('', '_blank');
      const emitDate = new Date().toLocaleString('pt-BR');
      const invoiceHtml = `
        <html>
          <head>
            <title>DANFE - ${selectedNfeDeal.client}</title>
            <style>
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #000; font-size: 11px; }
              .danfe-container { border: 1px solid #000; width: 100%; max-width: 800px; margin: 0 auto; }
              .section-title { font-weight: bold; font-size: 10px; margin-top: 5px; margin-bottom: 2px; text-transform: uppercase; }
              .box { border: 1px solid #000; padding: 2px 4px; box-sizing: border-box; }
              .box-label { font-size: 8px; color: #333; display: block; margin-bottom: 2px; text-transform: uppercase; }
              .box-value { font-size: 11px; font-weight: bold; }
              .header-grid { display: grid; grid-template-columns: 2fr 1fr 1.5fr; border-bottom: 1px solid #000; }
              .header-col { border-right: 1px solid #000; padding: 5px; }
              .header-col:last-child { border-right: none; }
              .flex-row { display: flex; width: 100%; border-bottom: 1px solid #000; }
              .flex-col { border-right: 1px solid #000; padding: 2px 4px; flex: 1; }
              .flex-col:last-child { border-right: none; }
              table.items-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #000; }
              table.items-table th { border: 1px solid #000; padding: 4px; font-size: 9px; text-align: left; background: #eee; }
              table.items-table td { border: 1px solid #000; padding: 4px; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="danfe-container">
              <div class="header-grid">
                <div class="header-col" style="text-align: center;">
                  <h2 style="margin: 0; font-size: 16px;">${currentUser.company}</h2>
                  <p style="margin: 2px 0; font-size: 10px;">CNPJ: ${currentUser.cnpj}</p>
                </div>
                <div class="header-col" style="text-align: center;">
                  <h1 style="margin: 0; font-size: 18px;">DANFE</h1>
                  <p style="margin: 2px 0; font-size: 10px;">Documento Auxiliar da<br/>Nota Fiscal Eletrônica</p>
                </div>
                <div class="header-col">
                  <div class="box-label">CHAVE DE ACESSO</div>
                  <div class="box-value" style="font-size: 10px;">${Math.random().toString().slice(2, 12)} ${Math.random().toString().slice(2, 12)} ${Math.random().toString().slice(2, 12)} ${Math.random().toString().slice(2, 12)}</div>
                </div>
              </div>

              <div class="section-title">DESTINATÁRIO / REMETENTE</div>
              <div class="flex-row">
                <div class="flex-col" style="flex: 2;"><span class="box-label">NOME / RAZÃO SOCIAL</span><span class="box-value">${selectedNfeDeal.client}</span></div>
                <div class="flex-col" style="flex: 1;"><span class="box-label">CNPJ / CPF</span><span class="box-value">${nfeFormData.cnpjDestinatario || 'Não Informado'}</span></div>
                <div class="flex-col" style="flex: 1;"><span class="box-label">DATA DA EMISSÃO</span><span class="box-value">${emitDate}</span></div>
              </div>
              <div class="flex-row">
                <div class="flex-col" style="flex: 2;"><span class="box-label">ENDEREÇO</span><span class="box-value">${nfeFormData.enderecoDestinatario || 'Não Informado'}</span></div>
                <div class="flex-col" style="flex: 1;"><span class="box-label">MUNICÍPIO</span><span class="box-value">${nfeFormData.cidadeDestinatario || 'Não Informado'}</span></div>
                <div class="flex-col" style="flex: 1;"><span class="box-label">CEP</span><span class="box-value">${nfeFormData.cepDestinatario || 'Não Informado'}</span></div>
              </div>

              <div class="section-title">DADOS DOS PRODUTOS / SERVIÇOS</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>CÓDIGO</th>
                    <th>DESCRIÇÃO DO PRODUTO/SERVIÇO</th>
                    <th>NCM/SH</th>
                    <th>CFOP</th>
                    <th>UNID.</th>
                    <th>QTD.</th>
                    <th>VLR. UNIT.</th>
                    <th>VLR. TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedNfeDeal.products.map(p => `
                    <tr>
                      <td>${p.sku}</td>
                      <td>${p.name}</td>
                      <td>${nfeFormData.ncm}</td>
                      <td>${nfeFormData.cfop.split(' ')[0]}</td>
                      <td>UN</td>
                      <td>${p.quantity}</td>
                      <td>${Number(p.price).toFixed(2)}</td>
                      <td>${(Number(p.quantity) * Number(p.price)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="section-title" style="margin-top: 20px;">CÁLCULO DO IMPOSTO (TOTAL)</div>
              <div class="flex-row">
                <div class="flex-col"><span class="box-label">VALOR TOTAL DOS PRODUTOS</span><span class="box-value">R$ ${Number(selectedNfeDeal.value).toFixed(2)}</span></div>
                <div class="flex-col"><span class="box-label">VALOR TOTAL DA NOTA</span><span class="box-value">R$ ${Number(selectedNfeDeal.value).toFixed(2)}</span></div>
              </div>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();

      setSelectedNfeDeal(null);
    }, 2000);
  };

  const confirmAddToCart = () => {
    if (!purchaseItem) return;
    
    const existing = cart.find(c => c.sku === purchaseItem.sku);
    if (existing) {
      setCart(cart.map(c => c.sku === purchaseItem.sku ? { ...c, cartQuantity: c.cartQuantity + purchaseQuantity } : c));
    } else {
      setCart([...cart, { ...purchaseItem, cartQuantity: purchaseQuantity }]);
    }
    
    setPurchaseItem(null);
    setIsCartOpen(true);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const newDealId = Date.now().toString();
    const dealTotal = cart.reduce((a,c) => a + (c.price * c.cartQuantity), 0);
    const newDealObj = {
      id: newDealId,
      client: 'Cliente Web (' + checkoutMethod + ')',
      title: 'Venda via Carrinho',
      value: dealTotal,
      status: 'Ganho',
      products: cart.map(c => ({ sku: c.sku, name: c.name, quantity: c.cartQuantity, price: c.price })),
      salesperson: currentUser.name
    };
    
    setDeals([newDealObj, ...deals]);
    
    let updatedItems = [...items];
    let newMovements = [...movements];
    const date = new Date().toISOString();
    
    cart.forEach(c => {
      const idx = updatedItems.findIndex(i => i.sku === c.sku);
      if (idx >= 0) {
        updatedItems[idx].quantity -= c.cartQuantity;
        updatedItems[idx].lastMovementDate = date;
      }
      newMovements.unshift({
        id: Date.now().toString() + Math.random().toString(),
        sku: c.sku,
        type: 'SAIDA',
        quantity: c.cartQuantity,
        date: date,
        user: currentUser.name,
        reason: `Venda Carrinho (ID: ${newDealId})`
      });
    });
    
    setItems(updatedItems);
    setMovements(newMovements);

    alert(`Compra finalizada com sucesso via ${checkoutMethod}!\nVenda registrada automaticamente no CRM e baixa do estoque efetuada.`);
    setCart([]);
    setIsCartOpen(false);
  };

  if (!currentUser) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
        <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src={logo} alt="Logo Controle-se" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
            <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Bem-vindo ao Controle-se</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Faça login para acessar o sistema de estoque.</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Nome Completo</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: João Silva"
                value={loginData.name}
                onChange={e => setLoginData({...loginData, name: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>CPF (Servirá como seu ID)</label>
              <input 
                type="text" 
                required 
                placeholder="000.000.000-00"
                value={loginData.cpf}
                onChange={handleCpfChange}
                maxLength="14"
              />
            </div>
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
              <label>Cargo (Perfil de Acesso)</label>
              <select 
                value={loginData.role}
                onChange={e => setLoginData({...loginData, role: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'white' }}
              >
                <option value="Vendedor">Vendedor</option>
                <option value="Gestor">Gestor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="glass-panel" style={{ padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="Logo Controle-se" style={{ height: '45px', width: '45px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Controle-se</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginLeft: 'auto' }}>
          <div 
            style={{ position: 'relative', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }} 
            onClick={() => setShowNotifications(true)}
            title="Notificações"
          >
            <span style={{ fontSize: '1.5rem' }}>🔔</span>
            {lowStockAlertsCount > 0 && (
              <span style={{ position: 'absolute', top: '0', right: '0', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                {lowStockAlertsCount}
              </span>
            )}
          </div>
          
          {/* User Profile Header */}
          <div className="user-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--glass-border)' }}>
            <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => {
              setTempCnpj(currentUser.cnpj || '');
              setIsCnpjModalOpen(true);
            }} title="Clique para editar o CNPJ da Empresa">
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {currentUser.name} <span style={{fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--primary-color)'}}>({currentUser.role || 'Vendedor'})</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentUser.company} | CNPJ: {currentUser.cnpj}</div>
            </div>
            
            <div 
              onClick={() => fileInputRef.current.click()}
              style={{ 
                width: '45px', height: '45px', borderRadius: '50%', background: profileImage ? 'none' : 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', 
                color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255, 146, 28, 0.3)',
                cursor: 'pointer', overflow: 'hidden', border: profileImage ? '2px solid var(--primary-color)' : 'none'
              }}
              title="Clique para alterar a foto de perfil"
            >
              {profileImage ? (
                <img src={profileImage} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setProfileImage(URL.createObjectURL(file));
                }
              }} 
            />
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={() => {
              localStorage.removeItem('controle_user');
              setCurrentUser(null);
            }} 
            style={{
              background: 'none',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              borderRadius: '8px',
              padding: '0.4rem 0.8rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              marginLeft: '0.5rem'
            }}
            title="Sair do sistema"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="stats-container">
        <div className="stat-card glass-panel">
          <span className="stat-title">Total de Produtos (SKUs)</span>
          <span className="stat-value">{totalItems}</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-title">Itens Físicos</span>
          <span className="stat-value">{totalQuantity}</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-title">Estoque Baixo / Crítico</span>
          <span className="stat-value" style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: 'var(--warning)' }} title="Estoque Baixo">{lowStockItems}</span>
            <span style={{ color: 'var(--text-secondary)' }}>/</span>
            <span style={{ color: 'var(--danger)' }} title="Estoque Crítico">{criticalStockItems}</span>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <nav className="glass-panel" style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: '1rem', overflowX: 'auto' }}>
          <button className={activeTab === 'produtos' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('produtos')} style={activeTab !== 'produtos' ? { color: 'var(--text-primary)' } : {}}>
            Produtos (Catálogo)
          </button>
          <button className={activeTab === 'estoque' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('estoque')} style={activeTab !== 'estoque' ? { color: 'var(--text-primary)' } : {}}>
            Estoque Atual
          </button>
          <button className={activeTab === 'movimentacoes' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('movimentacoes')} style={activeTab !== 'movimentacoes' ? { color: 'var(--text-primary)' } : {}}>
            Histórico de Movimentações
          </button>
          <button className={activeTab === 'relatorios' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('relatorios')} style={activeTab !== 'relatorios' ? { color: 'var(--text-primary)' } : {}}>
            Relatórios e Indicadores
          </button>
          <button className={activeTab === 'compras' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('compras')} style={activeTab !== 'compras' ? { color: 'var(--text-primary)' } : {}}>
            Compras
          </button>
          <button className={activeTab === 'crm' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('crm')} style={activeTab !== 'crm' ? { color: 'var(--text-primary)' } : {}}>
            CRM & Vendas
          </button>
        </nav>

        {activeTab === 'produtos' && (
          <>
            <div className="toolbar glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Catálogo de Produtos</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                  + Adicionar Produto
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {items.map(item => {
                const status = getStatusDetails(item.quantity);
                return (
                  <div key={item.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '150px', background: 'var(--background-color)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--text-secondary)' }}>
                      📦
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SKU: {item.sku}</div>
                      <h3 style={{ margin: '0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{item.name}</h3>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>R$ {Number(item.price).toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Em estoque</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.quantity} und</span>
                      </div>
                      <span className={`status-badge ${status.className}`}>{status.text}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                        onClick={() => { setAdjustItem(item); setIsAdjustModalOpen(true); }}
                      >
                        ⚙️ Ajustar
                      </button>
                    </div>
                  </div>
                )
              })}
              {items.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Nenhum produto cadastrado no momento.</div>
              )}
            </div>
          </>
        )}

        {activeTab === 'estoque' && (
          <>
            <div className="toolbar glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '1rem' }}>
          <div className="search-bar">
            <span className="search-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Buscar por nome ou SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setIsChartModalOpen(true)} style={{ color: 'var(--text-primary)' }}>
              📊 Ver Gráfico
            </button>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              + Adicionar Produto
            </button>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Produto</th>
                <th>Preço Unit.</th>
                <th>Localização</th>
                <th>Quantidade</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>{item.sku}</td>
                  <td>{item.name}</td>
                  <td>R$ {Number(item.price).toFixed(2)}</td>
                  <td>{item.location}</td>
                  <td>{item.quantity}</td>
                  <td>
                    <span className={`status-badge ${getStatusDetails(item.quantity).className}`}>
                      {getStatusDetails(item.quantity).text}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => handleUpdateQuantity(item.id, 1)} title="Entrada (Adicionar)">
                        +
                      </button>
                      <button className="btn-icon" onClick={() => handleUpdateQuantity(item.id, -1)} title="Saída (Remover)" disabled={item.quantity <= 0}>
                        -
                      </button>
                      <button className="btn-icon" onClick={() => { setAdjustItem(item); setIsAdjustModalOpen(true); }} title="Ajuste Manual" style={{ fontSize: '1rem' }}>
                        ⚙️
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(item.id)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
        )}

        {activeTab === 'movimentacoes' && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Histórico de Movimentações</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={movementFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMovementFilter('ALL')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Todas</button>
                <button className={movementFilter === 'ENTRADA' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMovementFilter('ENTRADA')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>↓ Entradas</button>
                <button className={movementFilter === 'SAIDA' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMovementFilter('SAIDA')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>↑ Saídas</button>
                <button className={movementFilter === 'PERDA' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMovementFilter('PERDA')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>🚨 Perdas/Avarias</button>
              </div>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>SKU</th>
                    <th>Tipo</th>
                    <th>Qtd</th>
                    <th>Motivo</th>
                    <th>Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.filter(m => movementFilter === 'ALL' || m.type === movementFilter).map(m => (
                    <tr key={m.id}>
                      <td>{new Date(m.date).toLocaleString('pt-BR')}</td>
                      <td>{m.sku}</td>
                      <td>
                        <span className={`status-badge ${m.type === 'ENTRADA' ? 'status-in-stock' : m.type === 'SAIDA' ? 'status-low-stock' : m.type === 'PERDA' ? 'status-critical' : 'status-low-stock'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                          {m.type === 'ENTRADA' ? '↓' : m.type === 'SAIDA' ? '↑' : m.type === 'PERDA' ? '🚨' : '⚙️'} {m.type}
                        </span>
                      </td>
                      <td>{m.quantity}</td>
                      <td>{m.reason}</td>
                      <td>{m.user}</td>
                    </tr>
                  ))}
                  {movements.filter(m => movementFilter === 'ALL' || m.type === movementFilter).length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhuma movimentação encontrada para este filtro.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'relatorios' && (() => {
          // Calculate ABC Curve data
          const totalInventoryValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
          let accumulatedValue = 0;
          
          const abcItems = [...items]
            .map(item => ({ ...item, totalValue: item.quantity * item.price }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .map(item => {
              accumulatedValue += item.totalValue;
              const accumulatedPercentage = totalInventoryValue > 0 ? (accumulatedValue / totalInventoryValue) * 100 : 0;
              let curva = 'C';
              if (accumulatedPercentage <= 80) curva = 'A';
              else if (accumulatedPercentage <= 95) curva = 'B';
              
              return { ...item, curva };
            });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Curva ABC */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Curva ABC (Por Valor em Estoque)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: 0 }}>
                  Curva A (Top 80% do valor), Curva B (Próximos 15%), Curva C (Últimos 5%). Produtos da Curva A exigem atenção máxima!
                </p>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Classificação</th>
                        <th>Produto</th>
                        <th>SKU</th>
                        <th>Quantidade</th>
                        <th>Valor Total</th>
                        <th>Ação Recomendada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abcItems.map(item => (
                        <tr key={item.id}>
                          <td>
                            <span style={{ 
                              padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold',
                              background: item.curva === 'A' ? '#fee2e2' : item.curva === 'B' ? '#fef3c7' : '#e0e7ff',
                              color: item.curva === 'A' ? '#991b1b' : item.curva === 'B' ? '#92400e' : '#3730a3'
                            }}>
                              Curva {item.curva}
                            </span>
                          </td>
                          <td>{item.name}</td>
                          <td>{item.sku}</td>
                          <td>{item.quantity}</td>
                          <td><strong>R$ {item.totalValue.toFixed(2)}</strong></td>
                          <td>
                            {item.curva === 'A' && item.quantity <= 10 ? (
                              <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--danger)', boxShadow: 'none' }} onClick={() => { setActiveTab('compras'); setIsOrderModalOpen(true); }}>
                                🚨 Reposição Imediata
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Estoque Adequado</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Giro de Estoque */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Giro de Estoque (Tempo Parado)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: 0 }}>
                  Acompanhe há quanto tempo seus produtos não têm movimentação.
                </p>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Produto</th>
                        <th>SKU</th>
                        <th>Última Movimentação</th>
                        <th>Dias Parado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...items].sort((a, b) => new Date(a.lastMovementDate) - new Date(b.lastMovementDate)).map(item => {
                        const days = Math.floor((new Date() - new Date(item.lastMovementDate)) / (1000 * 60 * 60 * 24));
                        const statusColor = days > 60 ? '#ef4444' : days > 30 ? '#f59e0b' : '#10b981';
                        
                        return (
                          <tr key={item.id}>
                            <td>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 5px ${statusColor}` }}></div>
                            </td>
                            <td>{item.name}</td>
                            <td>{item.sku}</td>
                            <td>{new Date(item.lastMovementDate).toLocaleDateString('pt-BR')}</td>
                            <td>
                              <span style={{ color: days > 60 ? 'var(--danger)' : days > 30 ? 'var(--warning)' : 'var(--text-primary)', fontWeight: days > 30 ? 'bold' : 'normal' }}>
                                {days} dias
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relatório de Prejuízos */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--danger)' }}>Desperdícios e Prejuízos (Perdas)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: 0 }}>
                  Acompanhe itens que geraram prejuízo por avaria, perda ou roubo.
                </p>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Produto (SKU)</th>
                        <th>Motivo</th>
                        <th>Qtd Perdida</th>
                        <th>Prejuízo Estimado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.filter(m => m.type === 'PERDA').length > 0 ? (
                        movements.filter(m => m.type === 'PERDA').sort((a,b) => new Date(b.date) - new Date(a.date)).map(m => {
                          const item = items.find(i => i.sku === m.sku);
                          const val = (item ? item.price : 0) * m.quantity;
                          return (
                            <tr key={m.id}>
                              <td>{new Date(m.date).toLocaleDateString('pt-BR')}</td>
                              <td>{item ? `${item.name} (${item.sku})` : 'Produto Excluído'}</td>
                              <td>{m.reason}</td>
                              <td>{m.quantity} und</td>
                              <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>R$ {val.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>Nenhum registro de perda.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'compras' && (
          <>
            <div className="toolbar glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Gestão de Compras (Fornecedores)</h2>
              <button className="btn-primary" onClick={() => setIsOrderModalOpen(true)}>
                + Novo Pedido
              </button>
            </div>
            
            <div className="kanban-board">
              {['Requisição', 'Pedido de Compra', 'Aprovação', 'Faturado pelo Fornecedor', 'Recebido'].map(status => (
                <div key={status} className="kanban-column">
                  <h3>{status}</h3>
                  {orders.filter(o => o.status === status).map(order => (
                    <div key={order.id} className="kanban-card" onClick={() => setSelectedOrder(order)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>NF-e Nº {order.document || 'S/N'}</span>
                        <span style={{ fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>⋮</span>
                      </div>
                      <h4>{order.supplier}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0' }}>Emissão: {order.issueDate ? new Date(order.issueDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span className="card-value" style={{ fontSize: '1.1rem' }}>R$ {Number(order.totalValue).toFixed(2)}</span>
                        {status === 'Recebido' ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 'bold' }}>▷ Concluído</span>
                        ) : (
                          <button className="advance-btn" onClick={(e) => { e.stopPropagation(); advanceOrderStatus(order.id, status); }}>
                            Avançar ➡️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {orders.filter(o => o.status === status).length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1rem' }}>Vazio</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'crm' && (
          <>
            <div className="toolbar glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Controle de Vendas (CRM)</h2>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                  <button className={crmTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'} onClick={() => setCrmTab('dashboard')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Dashboard de Vendas</button>
                  <button className={crmTab === 'funil' ? 'btn-primary' : 'btn-secondary'} onClick={() => setCrmTab('funil')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Funil de Negociações (Kanban)</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => setIsNfeListModalOpen(true)} style={{ color: 'var(--text-primary)' }}>
                  🧾 Minhas Notas Fiscais
                </button>
                <button className="btn-primary" onClick={() => setIsDealModalOpen(true)}>
                  + Nova Oportunidade
                </button>
              </div>
            </div>
            
            {crmTab === 'dashboard' && (
              <div className="crm-dashboard">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  
                  {/* Left Column: Vendas and Meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Vendas (Mês atual)</h3>
                      <div style={{ fontSize: '2.5rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                        R$ {totalWonValue.toFixed(2)}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                        {deals.filter(d => d.status === 'Ganho').length} vendas realizadas
                      </p>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Meta de vendas</h3>
                        {isEditingGoal ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="number" value={salesGoal} onChange={e => setSalesGoal(Number(e.target.value))} style={{ padding: '0.2rem', width: '100px' }} />
                            <button onClick={() => setIsEditingGoal(false)} style={{ background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 0.5rem' }}>Salvar</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Fixo: Do mês atual</span>
                            <span style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => setIsEditingGoal(true)}>✏️ Editar</span>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '2rem 0' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(var(--primary-color) ${(totalWonValue / salesGoal) * 100}%, #e2e8f0 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {Math.min(100, Math.round((totalWonValue / salesGoal) * 100))}%
                          </div>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Já vendeu</p>
                          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>R$ {totalWonValue.toFixed(2)}</h3>
                          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Da meta de</p>
                          <h3 style={{ margin: 0, color: '#3b82f6' }}>R$ {salesGoal.toFixed(2)}</h3>
                        </div>
                      </div>

                      <h4 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Vendas por vendedor</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100px', gap: '0.5rem' }}>
                        {(() => {
                          const salesBySeller = deals.filter(d => d.status === 'Ganho').reduce((acc, d) => {
                            const seller = d.salesperson || 'Admin';
                            if (!acc[seller]) acc[seller] = 0;
                            acc[seller] += d.value;
                            return acc;
                          }, {});
                          const sellersArray = Object.keys(salesBySeller).map(s => ({ name: s, value: salesBySeller[s] }));
                          if (sellersArray.length === 0) return <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nenhuma venda registrada.</p>;
                          const maxSellerValue = Math.max(...sellersArray.map(s => s.value));
                          
                          return sellersArray.map((seller, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }} title={`R$ ${seller.value.toFixed(2)}`}>
                              <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'flex-end', height: '100%' }}>
                                <div style={{ width: '25px', height: `${(seller.value / maxSellerValue) * 100}%`, background: 'var(--primary-color)', borderRadius: '2px 2px 0 0' }}></div>
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{seller.name.split(' ')[0]}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Finanças & Clientes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Contas a receber</h3>
                        <div style={{ fontSize: '2.5rem', color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          ↓ R$ {Number(totalWonValue * 0.4).toFixed(2)}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.5rem 0' }}>
                          Cartão de crédito: {Number(totalWonValue * 0.2).toFixed(2)} &nbsp;&nbsp; Crediário: {Number(totalWonValue * 0.2).toFixed(2)}
                        </p>
                      </div>
                      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Contas a pagar</h3>
                        <div style={{ fontSize: '2.5rem', color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          ↑ R$ 1.338,00
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.5rem 0' }}>
                          Fornecedores: 838,00 &nbsp;&nbsp; Despesas: 500,00
                        </p>
                      </div>
                    </div>

                    {/* Controle de Clientes */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', flex: 1 }}>
                      <h2 style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Controle de Clientes</h2>
                      <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginBottom: '2rem' }}>
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>Vendas no período</p>
                          <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>R$ {totalWonValue.toFixed(2)}</h3>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>Peças vendidas</p>
                          <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>{deals.filter(d => d.status === 'Ganho').reduce((acc, curr) => acc + curr.products.reduce((a,c) => a + Number(c.quantity),0), 0)}</h3>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>Ticket médio</p>
                          <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>R$ {avgTicket.toFixed(2)}</h3>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>Clientes que compraram</p>
                          <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>{deals.filter(d => d.status === 'Ganho').length}</h3>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Top clientes (Mês)</h4>
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {deals.filter(d => d.status === 'Ganho').sort((a,b) => b.value - a.value).slice(0,4).map((d, i) => (
                              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: i===0?'#fbbf24':i===1?'#9ca3af':i===2?'#b45309':'#e2e8f0', color: i===3?'#000':'#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{i+1}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{d.client}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Comprou R$ {Number(d.value).toFixed(2)}</div>
                                </div>
                              </li>
                            ))}
                            {deals.filter(d => d.status === 'Ganho').length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nenhum ganho registrado.</p>}
                          </ul>
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Clientes aniversariantes</h4>
                            <span style={{ fontSize: '0.7rem', background: '#e2e8f0', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Fixo: Do dia atual</span>
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ fontSize: '1.5rem', color: '#60a5fa' }}>👤</div>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Maria Fernanda Ferreira</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(31) 95555-5555</div>
                                </div>
                              </div>
                              <button onClick={() => window.open('https://wa.me/5531955555555', '_blank')} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                🟢 ENVIAR &gt;
                              </button>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ fontSize: '1.5rem', color: '#60a5fa' }}>👤</div>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Josélia Macedo</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(31) 95555-5555</div>
                                </div>
                              </div>
                              <button onClick={() => window.open('https://wa.me/5531955555555', '_blank')} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                🟢 ENVIAR &gt;
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}

            {crmTab === 'funil' && (
              <>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                  <div className="glass-panel" style={{ flex: '1 1 400px', padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Funil de Negociações</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%', paddingTop: '1rem' }}>
                        {funnelData.map((stage, idx) => {
                          const widthPercent = 100 - (idx * 15);
                          return (
                            <div key={idx} style={{ 
                              width: `${widthPercent}%`, 
                              backgroundColor: stage.fill, 
                              padding: '1rem 1.5rem',
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              color: 'white', 
                              fontWeight: 'bold',
                              clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
                              transition: 'transform 0.2s',
                              cursor: 'default'
                            }} 
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            title={`R$ ${stage.actualValue.toFixed(2)}`}>
                              <span style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{stage.name}</span>
                              <span style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{stage.count} neg. (R$ {stage.actualValue.toFixed(2)})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

              {/* Metric Cards */}
              <div style={{ flex: '1 1 300px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="stat-card glass-panel" style={{ borderRadius: '1rem', justifyContent: 'center' }}>
                  <span className="stat-title">Valor em Aberto (Funil)</span>
                  <span className="stat-value" style={{ color: 'var(--primary-color)' }}>R$ {totalCrmValue.toFixed(2)}</span>
                </div>
                <div className="stat-card glass-panel" style={{ borderRadius: '1rem', justifyContent: 'center' }}>
                  <span className="stat-title">Vendas Ganhas</span>
                  <span className="stat-value" style={{ color: 'var(--success)' }}>R$ {totalWonValue.toFixed(2)}</span>
                </div>
                <div className="stat-card glass-panel" style={{ borderRadius: '1rem', justifyContent: 'center' }}>
                  <span className="stat-title">Ticket Médio</span>
                  <span className="stat-value">R$ {avgTicket.toFixed(2)}</span>
                </div>
                <div className="stat-card glass-panel" style={{ borderRadius: '1rem', justifyContent: 'center' }}>
                  <span className="stat-title">Taxa de Conversão</span>
                  <span className="stat-value">{winRate}%</span>
                </div>
              </div>
              </div>
            
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Pipeline (Kanban)</h3>
            <div className="kanban-board">
              {['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Ganho', 'Perdido'].map(status => (
                <div key={status} className="kanban-column" style={status === 'Ganho' ? { borderTop: '4px solid var(--success)' } : status === 'Perdido' ? { borderTop: '4px solid var(--danger)' } : { borderTop: '4px solid var(--primary-color)' }}>
                  <h3 style={{ borderBottom: 'none' }}>{status}</h3>
                  {deals.filter(d => d.status === status).map(deal => (
                    <div 
                      key={deal.id} 
                      className="kanban-card" 
                      style={{ 
                        borderLeftColor: status === 'Ganho' ? 'var(--success)' : status === 'Perdido' ? 'var(--danger)' : 'var(--primary-color)',
                        cursor: status === 'Ganho' ? 'pointer' : 'default',
                        position: 'relative'
                      }}
                      onClick={() => { if(status === 'Ganho') handleOpenNfeModal(deal); }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{deal.client}</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(deal.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><strong>Telefone:</strong> {deal.phone || 'Não informado'}</p>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><strong>Vendedor:</strong> {deal.salesperson || 'Não informado'}</p>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{deal.title}</p>
                      
                      {deal.products.length > 0 && (
                        <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>Itens da Venda:</span>
                          {deal.products.map((p, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                              <span>{p.quantity}x {p.sku}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span className="card-value" style={{ fontSize: '1rem', color: status === 'Ganho' ? 'var(--success)' : status === 'Perdido' ? 'var(--danger)' : 'var(--primary-hover)' }}>
                          R$ {Number(deal.value).toFixed(2)}
                        </span>
                      </div>
                      
                      {status !== 'Ganho' && status !== 'Perdido' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => markDealLost(deal.id)}>Perdido</button>
                          <button className="advance-btn" onClick={() => advanceDealStatus(deal.id, status)}>
                            Avançar ➡️
                          </button>
                        </div>
                      )}
                      {status === 'Ganho' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 'bold' }}>
                            🎉 Ganho (Saída registrada)
                          </span>
                          {deal.nfeEmitted && (
                            <span style={{ fontSize: '0.75rem', background: 'var(--success)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', marginTop: '0.25rem', fontWeight: 'bold' }}>
                              🧾 NF-e Emitida
                            </span>
                          )}
                          {!deal.nfeEmitted && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)', marginTop: '0.25rem', textDecoration: 'underline' }}>
                              Clique para emitir NF-e
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {deals.filter(d => d.status === status).length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1rem' }}>Vazio</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )}
      </main>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>Novo Produto</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label>Nome do Produto</label>
                <input 
                  type="text" 
                  required 
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input 
                  type="text" 
                  required 
                  value={newItem.sku}
                  onChange={e => setNewItem({...newItem, sku: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Quantidade</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  value={newItem.quantity}
                  onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Preço/Custo (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  min="0"
                  value={newItem.price}
                  onChange={e => setNewItem({...newItem, price: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Localização (Setor/Corredor)</label>
                <input 
                  type="text" 
                  required 
                  value={newItem.location}
                  onChange={e => setNewItem({...newItem, location: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Chart Modal */}
      {isChartModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h2>Movimentação de Estoque (Jan - Dez)</h2>
              <button className="close-btn" onClick={() => setIsChartModalOpen(false)}>×</button>
            </div>
            <div style={{ width: '100%', height: 400, marginTop: '1rem' }}>
              <ResponsiveContainer>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="entradas" name="Entradas" stroke="var(--success)" activeDot={{ r: 8 }} strokeWidth={3} />
                  <Line type="monotone" dataKey="saidas" name="Saídas" stroke="var(--danger)" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {isAdjustModalOpen && adjustItem && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>Ajuste de Inventário: {adjustItem.name}</h2>
              <button className="close-btn" onClick={() => { setIsAdjustModalOpen(false); setAdjustItem(null); }}>×</button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div className="form-group">
                <label>Tipo de Ajuste</label>
                <select 
                  style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(0, 0, 0, 0.03)', color: 'var(--text-primary)', outline: 'none' }}
                  value={adjustData.type} 
                  onChange={e => setAdjustData({...adjustData, type: e.target.value})}
                >
                  <option value="AJUSTE">Ajuste Geral</option>
                  <option value="ENTRADA">Entrada Extra</option>
                  <option value="SAIDA">Saída Avulsa</option>
                  <option value="PERDA">Perda / Roubo / Avaria</option>
                </select>
              </div>
              <div className="form-group">
                <label>Quantidade a Ajustar</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  value={adjustData.quantity}
                  onChange={e => setAdjustData({...adjustData, quantity: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Motivo</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Quebra, Furto, Recontagem..."
                  value={adjustData.reason}
                  onChange={e => setAdjustData({...adjustData, reason: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setIsAdjustModalOpen(false); setAdjustItem(null); }}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar Ajuste</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {isOrderModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>Novo Pedido de Compra</h2>
              <button className="close-btn" onClick={() => setIsOrderModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddOrder}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Fornecedor</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Nome da Indústria/Fornecedor"
                    value={newOrder.supplier}
                    onChange={e => setNewOrder({...newOrder, supplier: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>CNPJ do Fornecedor</label>
                  <input 
                    type="text" 
                    placeholder="00.000.000/0001-00"
                    value={newOrder.cnpj}
                    onChange={e => setNewOrder({...newOrder, cnpj: e.target.value})}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Número da NF-e (Opcional na requisição)</label>
                  <input 
                    type="text" 
                    placeholder="000000000"
                    value={newOrder.document}
                    onChange={e => setNewOrder({...newOrder, document: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Data de Emissão</label>
                  <input 
                    type="date" 
                    value={newOrder.issueDate}
                    onChange={e => setNewOrder({...newOrder, issueDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Adicionar Produtos ao Pedido</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" placeholder="Código (SKU)" value={orderProduct.sku} onChange={e => setOrderProduct({...orderProduct, sku: e.target.value})} style={{ padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '0.25rem', width: '100%', boxSizing: 'border-box' }} />
                  <input type="text" placeholder="Nome do Produto" value={orderProduct.name} onChange={e => setOrderProduct({...orderProduct, name: e.target.value})} style={{ padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '0.25rem', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="number" placeholder="Qtd" value={orderProduct.quantity} onChange={e => setOrderProduct({...orderProduct, quantity: e.target.value})} style={{ padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '0.25rem', width: '100%', boxSizing: 'border-box' }} min="1" />
                  <input type="number" step="0.01" placeholder="Custo Unit." value={orderProduct.price} onChange={e => setOrderProduct({...orderProduct, price: e.target.value})} style={{ padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '0.25rem', width: '100%', boxSizing: 'border-box' }} min="0" />
                  <input type="text" placeholder="Localização" value={orderProduct.location} onChange={e => setOrderProduct({...orderProduct, location: e.target.value})} style={{ padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '0.25rem', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <button type="button" onClick={handleAddProductToOrder} style={{ width: '100%', background: 'var(--success)', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>+ Incluir Produto na Lista</button>
              </div>

              {newOrder.products.length > 0 && (
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', padding: '0.5rem' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Produto</th>
                        <th>Qtd</th>
                        <th>Preço</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {newOrder.products.map((p, i) => (
                        <tr key={i}>
                          <td>{p.sku}</td>
                          <td>{p.name}</td>
                          <td>{p.quantity}</td>
                          <td>R$ {p.price}</td>
                          <td><button type="button" onClick={() => handleRemoveProductFromOrder(i)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>X</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontWeight: 'bold' }}>Valor Total Calculado:</span>
                <span style={{ fontSize: '1.2rem', color: 'var(--success)', fontWeight: 'bold' }}>R$ {newOrder.totalValue.toFixed(2)}</span>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsOrderModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Requisição</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Dropdown / Modal */}
      {showNotifications && (
        <div className="modal-overlay" style={{ background: 'transparent' }} onClick={() => setShowNotifications(false)}>
          <div 
            className="modal-content glass-panel" 
            style={{ position: 'absolute', top: '90px', right: '2rem', width: '380px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Notificações e Alertas</h3>
              <button className="close-btn" style={{ fontSize: '1.2rem' }} onClick={() => setShowNotifications(false)}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {items.filter(i => i.quantity <= 20).sort((a, b) => a.quantity - b.quantity).map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', borderRadius: '0.5rem', background: item.quantity <= 5 ? '#fee2e2' : '#ffedd5', border: `1px solid ${item.quantity <= 5 ? '#ef4444' : '#f59e0b'}` }}>
                  <span style={{ fontSize: '1.5rem' }}>{item.quantity <= 5 ? '🚨' : '⚠️'}</span>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: item.quantity <= 5 ? '#991b1b' : '#9a3412', fontSize: '0.9rem' }}>{item.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: item.quantity <= 5 ? '#b91c1c' : '#b45309' }}>
                      Restam apenas <strong>{item.quantity} unidades</strong> em estoque.
                    </p>
                  </div>
                </div>
              ))}
              
              {items.filter(i => i.quantity <= 20).length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Nenhum alerta de estoque no momento.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NF-e Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: '900px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: 'var(--primary-hover)' }}>Recebimento NF-e Nº {selectedOrder.document || 'S/N'}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            
            <div className="nfe-detail-container">
              {/* Fornecedor */}
              <div>
                <div className="nfe-section-title">✓ Fornecedor</div>
                <div className="nfe-grid">
                  <div className="nfe-field">
                    <label>Razão Social</label>
                    <div className="nfe-value">{selectedOrder.supplier}</div>
                  </div>
                  <div className="nfe-field">
                    <label>CNPJ</label>
                    <div className="nfe-value">{selectedOrder.cnpj || 'Não informado'}</div>
                  </div>
                  <div className="nfe-field">
                    <label>Status Atual</label>
                    <div className="nfe-value" style={{ color: selectedOrder.status === 'Recebido' ? 'var(--success)' : 'var(--warning)' }}>
                      {selectedOrder.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados NF-e */}
              <div>
                <div className="nfe-section-title">Dados da NF-e Recebida</div>
                <div className="nfe-grid">
                  <div className="nfe-field">
                    <label>Número da NF-e</label>
                    <div className="nfe-value">{selectedOrder.document || 'S/N'}</div>
                  </div>
                  <div className="nfe-field">
                    <label>Data de Emissão</label>
                    <div className="nfe-value">{selectedOrder.issueDate ? new Date(selectedOrder.issueDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
                  </div>
                  <div className="nfe-field">
                    <label>Valor Total da Nota Fiscal</label>
                    <div className="nfe-value" style={{ background: '#f8fafc', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      R$ {Number(selectedOrder.totalValue).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div>
                <div className="nfe-tabs">
                  <div className="nfe-tab active">Itens da NF-e</div>
                  <div className="nfe-tab">Transporte</div>
                  <div className="nfe-tab">Totais</div>
                </div>
                
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <span style={{ color: '#ef4444' }}>+ Cadastrar como novo produto</span>
                  <span style={{ color: '#16a34a' }}>✓ Associar a um produto existente</span>
                </div>

                <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Código</th>
                        <th>Descrição do Produto</th>
                        <th>Quantidade</th>
                        <th>Valor Unitário</th>
                        <th>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.products.map((p, i) => {
                        const exists = items.some(item => item.sku === p.sku);
                        const rowClass = exists ? 'table-row-assoc' : 'table-row-new';
                        return (
                          <tr key={i} className={rowClass}>
                            <td>{i + 1}</td>
                            <td>{p.sku}</td>
                            <td>{p.name}</td>
                            <td>{p.quantity}</td>
                            <td>R$ {Number(p.price).toFixed(2)}</td>
                            <td>
                              {exists ? (
                                <span><span style={{color: '#16a34a'}}>✓</span> Associado com o produto {p.sku} - {p.name}</span>
                              ) : (
                                <span style={{color: '#ef4444'}}>+ Cadastrar como novo produto</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {selectedOrder.products.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>Nenhum item na nota.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Purchase Item Quantity Modal */}
      {purchaseItem && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Quantidade: {purchaseItem.name}</h2>
              <button className="close-btn" onClick={() => setPurchaseItem(null)}>×</button>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <label>Estoque disponível: {purchaseItem.quantity}</label>
              <input 
                type="number" 
                min="1" 
                max={purchaseItem.quantity}
                value={purchaseQuantity}
                onChange={e => {
                  let val = Number(e.target.value);
                  if (val > purchaseItem.quantity) val = purchaseItem.quantity;
                  if (val < 1) val = 1;
                  setPurchaseQuantity(val);
                }}
                style={{ fontSize: '2rem', textAlign: 'center', padding: '1rem', width: '100px', margin: '0 auto', display: 'block' }}
              />
            </div>
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn-secondary" onClick={() => setPurchaseItem(null)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={confirmAddToCart}>🛒 Adicionar ao Carrinho</button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>🛒 Seu Carrinho</h2>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>×</button>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>O carrinho está vazio.</p>
              ) : (
                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Produto</th>
                      <th style={{ padding: '0.5rem' }}>Qtd</th>
                      <th style={{ padding: '0.5rem' }}>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '0.5rem' }}>{c.name}</td>
                        <td style={{ textAlign: 'center' }}>{c.cartQuantity}</td>
                        <td style={{ textAlign: 'center' }}>R$ {(c.price * c.cartQuantity).toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setCart(cart.filter(item => item.sku !== c.sku))}>X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                  <span>Total:</span>
                  <span style={{ color: 'var(--primary-color)' }}>
                    R$ {cart.reduce((a,c) => a + (c.price * c.cartQuantity), 0).toFixed(2)}
                  </span>
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Forma de Pagamento</label>
                  <select value={checkoutMethod} onChange={e => setCheckoutMethod(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-actions" style={{ justifyContent: 'space-between' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ background: '#25D366', color: 'white', border: 'none' }}
                onClick={() => window.open('https://wa.me/5586998113557?text=Olá,%20gostaria%20de%20falar%20com%20um%20vendedor!', '_blank')}
              >
                Falar com Vendedor (WhatsApp)
              </button>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCartOpen(false)}>Continuar Comprando</button>
                {cart.length > 0 && (
                  <button type="button" className="btn-primary" onClick={handleCheckout}>Finalizar Compra</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CNPJ Edit Modal */}
      {isCnpjModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Editar CNPJ da Empresa</h2>
              <button className="close-btn" onClick={() => setIsCnpjModalOpen(false)}>×</button>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Digite o CNPJ (Apenas Números)</label>
              <input 
                type="text" 
                placeholder="00.000.000/0000-00"
                value={tempCnpj}
                maxLength={18}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 14) v = v.slice(0, 14);
                  v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                  v = v.replace(/(\d{4})(\d)/, '$1-$2');
                  setTempCnpj(v);
                }}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsCnpjModalOpen(false)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={() => {
                setCurrentUser({...currentUser, cnpj: tempCnpj});
                setIsCnpjModalOpen(false);
              }}>Salvar Alteração</button>
            </div>
          </div>
        </div>
      )}

      {/* New Deal (CRM) Modal */}
      {isDealModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>Nova Oportunidade de Venda</h2>
              <button className="close-btn" onClick={() => setIsDealModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddDeal}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Cliente (Nome/Razão Social)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Maria Joaquina"
                    value={newDeal.client}
                    onChange={e => setNewDeal({...newDeal, client: e.target.value})}
                  />
                </div>
                <div className="form-group">
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
                  <label>Título do Negócio</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Venda de 10 Laptops"
                    value={newDeal.title}
                    onChange={e => setNewDeal({...newDeal, title: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Vendedor Responsável</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Nome do vendedor"
                    value={newDeal.salesperson}
                    onChange={e => setNewDeal({...newDeal, salesperson: e.target.value})}
                  />
                </div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', marginTop: '1rem' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Adicionar Produtos da Venda</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select
                    value={dealProduct.sku}
                    onChange={(e) => {
                      const selectedItem = items.find(i => i.sku === e.target.value);
                      if (selectedItem) {
                        setDealProduct({ ...dealProduct, sku: selectedItem.sku, name: selectedItem.name, price: selectedItem.price });
                      } else {
                        setDealProduct({ ...dealProduct, sku: '', name: '', price: 0 });
                      }
                    }}
                    style={{ padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '0.25rem', width: '100%', boxSizing: 'border-box', background: 'white' }}
                  >
                    <option value="">Selecione um Produto...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.sku}>{item.name} (SKU: {item.sku} - R$ {Number(item.price).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="number" placeholder="Quantidade" value={dealProduct.quantity} onChange={e => setDealProduct({...dealProduct, quantity: e.target.value})} style={{ padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '0.25rem', width: '100%', boxSizing: 'border-box' }} min="1" />
                  <input type="number" step="0.01" placeholder="Valor de Venda Unit. (R$)" value={dealProduct.price} onChange={e => setDealProduct({...dealProduct, price: e.target.value})} style={{ padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '0.25rem', width: '100%', boxSizing: 'border-box' }} min="0" />
                </div>
                <button type="button" onClick={handleAddProductToDeal} style={{ width: '100%', background: 'var(--primary-color)', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>+ Incluir Produto na Venda</button>
              </div>

              {newDeal.products.length > 0 && (
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', padding: '0.5rem', marginTop: '1rem' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Qtd</th>
                        <th>Preço Unit.</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {newDeal.products.map((p, i) => (
                        <tr key={i}>
                          <td>{p.sku}</td>
                          <td>{p.quantity}</td>
                          <td>R$ {p.price}</td>
                          <td>R$ {(p.quantity * p.price).toFixed(2)}</td>
                          <td><button type="button" onClick={() => handleRemoveProductFromDeal(i)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>X</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', marginTop: '1rem' }}>
                <span style={{ fontWeight: 'bold' }}>Valor Total da Oportunidade:</span>
                <span style={{ fontSize: '1.2rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>R$ {newDeal.value.toFixed(2)}</span>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsDealModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Oportunidade</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* NF-e Modal */}
      {isNfeModalOpen && selectedNfeDeal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>Emissão de NF-e</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nota Fiscal Eletrônica - Modelo 55</p>
              </div>
              <button className="close-btn" onClick={() => setIsNfeModalOpen(false)}>×</button>
            </div>
            
            {selectedNfeDeal.nfeEmitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ color: 'var(--success)', margin: '0 0 1rem 0' }}>NF-e Autorizada!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>A Nota Fiscal Eletrônica desta venda já foi transmitida para a SEFAZ e autorizada com sucesso.</p>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', margin: '2rem 0' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Chave de Acesso:</p>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: 'bold' }}>3526 0900 0000 0000 0100 5500 1000 {Math.floor(100000000 + Math.random() * 900000000)}</p>
                </div>
                <button className="btn-primary" onClick={() => setIsNfeModalOpen(false)}>Fechar</button>
              </div>
            ) : (
              <form onSubmit={handleEmitNfe}>
                {/* 1. Emitente */}
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>1. Emitente</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>Razão Social</label>
                    <input type="text" value={currentUser.company} disabled style={{ background: '#f1f5f9' }} />
                  </div>
                  <div className="form-group">
                    <label>CNPJ</label>
                    <input type="text" value={currentUser.cnpj} disabled style={{ background: '#f1f5f9' }} />
                  </div>
                </div>

                {/* 2. Destinatário */}
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>2. Destinatário</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Nome / Razão Social</label>
                    <input type="text" value={selectedNfeDeal.client} disabled style={{ background: '#f1f5f9' }} />
                  </div>
                  <div className="form-group">
                    <label>CPF / CNPJ</label>
                    <input type="text" required placeholder="000.000.000-00 ou 00.000.000/0001-00" value={nfeFormData.cnpjDestinatario} onChange={e => setNfeFormData({...nfeFormData, cnpjDestinatario: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>CEP</label>
                    <input type="text" required placeholder="00000-000" value={nfeFormData.cepDestinatario} onChange={e => setNfeFormData({...nfeFormData, cepDestinatario: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Endereço Completo</label>
                    <input type="text" required placeholder="Rua, Número, Bairro" value={nfeFormData.enderecoDestinatario} onChange={e => setNfeFormData({...nfeFormData, enderecoDestinatario: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Cidade / UF</label>
                    <input type="text" required placeholder="Ex: São Paulo / SP" value={nfeFormData.cidadeDestinatario} onChange={e => setNfeFormData({...nfeFormData, cidadeDestinatario: e.target.value})} />
                  </div>
                </div>

                {/* 3. Operação */}
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>3. Dados da Operação</h3>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>CFOP (Natureza da Operação)</label>
                  <select value={nfeFormData.cfop} onChange={e => setNfeFormData({...nfeFormData, cfop: e.target.value})}>
                    <option value="5102 - Venda de mercadoria adquirida ou recebida de terceiros">5102 - Venda de mercadoria de terceiros</option>
                    <option value="5101 - Venda de produção do estabelecimento">5101 - Venda de produção própria</option>
                    <option value="6102 - Venda de mercadoria para outro estado">6102 - Venda para outro estado</option>
                  </select>
                </div>

                {/* 4. Produtos */}
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>4. Produtos e Tributos</h3>
                <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Produto (SKU)</th>
                        <th>NCM</th>
                        <th>Qtd</th>
                        <th>V. Unit</th>
                        <th>V. Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedNfeDeal.products.map((p, i) => (
                        <tr key={i}>
                          <td>{p.sku}</td>
                          <td>{nfeFormData.ncm}</td>
                          <td>{p.quantity}</td>
                          <td>R$ {Number(p.price).toFixed(2)}</td>
                          <td><strong>R$ {(p.quantity * p.price).toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 5. Resumo e Botões */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Impostos Aproximados (ICMS/PIS/COFINS): <strong style={{ color: 'var(--warning)' }}>R$ {(selectedNfeDeal.value * 0.18).toFixed(2)}</strong></p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total dos Produtos:</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>R$ {Number(selectedNfeDeal.value).toFixed(2)}</span>
                  </div>
                </div>

                <div className="form-actions" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsNfeModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={isEmitindoNfe} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', background: 'var(--success)', border: 'none' }}>
                    {isEmitindoNfe ? '📡 Transmitindo SEFAZ...' : '🧾 Emitir NF-e'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* NF-e List Modal */}
      {isNfeListModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>Minhas Notas Fiscais</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Histórico de NF-es emitidas pelo sistema</p>
              </div>
              <button className="close-btn" onClick={() => setIsNfeListModalOpen(false)}>×</button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Destinatário</th>
                    <th>Valor Total</th>
                    <th>Chave de Acesso</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.filter(d => d.nfeEmitted).length > 0 ? (
                    deals.filter(d => d.nfeEmitted).map(deal => (
                      <tr key={deal.id}>
                        <td>{new Date(deal.date).toLocaleDateString('pt-BR')}</td>
                        <td>{deal.client}</td>
                        <td><strong>R$ {Number(deal.value).toFixed(2)}</strong></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          3526 0900 ... 5500 1000
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', background: 'var(--success)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            Autorizada
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhuma Nota Fiscal emitida ainda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setIsNfeListModalOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
