import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList, BarChart, Bar } from 'recharts';
import logo from './assets/logo.jpg';
import './App.css';

import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, getDocs, query, where, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import emailjs from '@emailjs/browser';
import { generateDanfeHtml } from './utils/danfeTemplate';
import { fetchAllSheets, SHEET_TABS } from './utils/sheetsReader';
import { exportToExcel, exportMultipleSheetsToExcel } from './utils/excelExport';
import { exportToPdf } from './utils/pdfExport';
const getStatusDetails = (quantity) => {
  if (quantity <= 5) return { text: 'Estoque Crítico', className: 'status-critical' };
  if (quantity <= 20) return { text: 'Estoque Baixo', className: 'status-low-stock' };
  return { text: 'Em Estoque', className: 'status-in-stock' };
};

function App() {
  // Auth & User State
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('controle_user')) || null);
  const [loginMode, setLoginMode] = useState('login'); // 'login' | 'register'
  const [loginData, setLoginData] = useState({ name: '', email: '', cpf: '', company: '', companyCnpj: '', role: 'Vendedor', phone: '' });

  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('controle_orders')) || []);
  const [activeTab, setActiveTab] = useState('estoque'); // 'estoque', 'movimentacoes', 'relatorios', 'compras'
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', sku: '', quantity: 0, location: '', price: 0, category: 'Tecnologia', imageUrl: '', imageUrls: [], freeShipping: false, deliveryDays: 3 });
  const [offerFormData, setOfferFormData] = useState({ itemId: '', offerPrice: 0, hours: 24 });
  const [coupons, setCoupons] = useState([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: 10, expireDays: 30, usageLimit: '' });
  
  const [newItem, setNewItem] = useState({ name: '', sku: '', quantity: 0, location: '', price: 0, category: 'Tecnologia', imageUrl: '', imageUrls: [], freeShipping: false, deliveryDays: 3 });
  const [newOrder, setNewOrder] = useState({ supplier: '', cnpj: '', products: [], document: '', issueDate: '', totalValue: 0 });
  const [orderProduct, setOrderProduct] = useState({ sku: '', name: '', quantity: 1, price: 0, location: '' });
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [movementFilter, setMovementFilter] = useState('ALL'); // ALL, ENTRADA, SAIDA
  
  // Profile Image State
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = React.useRef(null);

  // CRM States
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isBirthdayMessageModalOpen, setIsBirthdayMessageModalOpen] = useState(false);
  const [birthdayMessageTemplate, setBirthdayMessageTemplate] = useState("Parabéns {nome}! Você acaba de ganhar um cupom de {desconto}% OFF exclusivo para você! Seu código é: {cupom}");
  const [birthdayDiscount, setBirthdayDiscount] = useState(25);
  
  const hasUnreadAdmin = deals.some(d => d.source === 'vitrine' && d.status !== 'Ganho' && d.status !== 'Perdido' && !d.viewedByAdmin);

  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [trackingModal, setTrackingModal] = useState(null);
  const [internalChat, setInternalChat] = useState(null);
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

  // Companies / Lojas States
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState({ name: '', cnpj: '' });
  
  // Expenses State
  const [expenses, setExpenses] = useState([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', dueDate: '', status: 'Pendente' });

  const [devServices, setDevServices] = useState([]);
  const [isDevManagerOpen, setIsDevManagerOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [newDevService, setNewDevService] = useState({ title: '', value: '', dueDate: '', status: 'Pendente' });

  // Google Sheets Archive State
  const [sheetsData, setSheetsData] = useState({});
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetsLoaded, setSheetsLoaded] = useState(false);
  const [sheetsActiveTab, setSheetsActiveTab] = useState('Vendas Arquivadas');

  const handleLoadSheets = async () => {
    setSheetsLoading(true);
    try {
      const data = await fetchAllSheets();
      setSheetsData(data);
      setSheetsLoaded(true);
    } catch(err) {
      console.error('Erro ao carregar planilha:', err);
    } finally {
      setSheetsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || !currentUser.companyCnpj) {
      const unsubComp = onSnapshot(collection(db, 'companies'), (snap) => {
        setCompanies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => { unsubComp(); };
    }

    const activeCnpj = currentUser.companyCnpj || currentUser.cnpj || '00.000.000/0001-00';
    const itemsQ = query(collection(db, 'items'), where('companyCnpj', '==', activeCnpj));
    const unsubItems = onSnapshot(itemsQ, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const dealsQ = query(collection(db, 'deals'), where('companyCnpj', '==', activeCnpj));
    const unsubDeals = onSnapshot(dealsQ, (snap) => {
      setDeals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const movQ = query(collection(db, 'movements'), where('companyCnpj', '==', activeCnpj));
    const unsubMov = onSnapshot(movQ, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setMovements(list);
    });

    const expensesQ = query(collection(db, 'expenses'), where('companyCnpj', '==', activeCnpj));
    const unsubExpenses = onSnapshot(expensesQ, (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubDev = onSnapshot(query(collection(db, 'devServices'), where('companyCnpj', '==', activeCnpj)), (snap) => {
      setDevServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubComp = onSnapshot(collection(db, 'companies'), (snap) => {
      setCompanies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCoupons = onSnapshot(query(collection(db, 'coupons'), where('companyCnpj', '==', activeCnpj)), (snap) => {
      setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { 
      unsubItems(); 
      unsubDeals(); 
      unsubMov(); 
      unsubComp(); 
      unsubCoupons();
      unsubCustomers();
      unsubExpenses();
      unsubDev();
    };
  }, [currentUser]);

  useEffect(() => { localStorage.setItem('controle_orders', JSON.stringify(orders)); }, [orders]);
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

  // Profile Edit Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState({ name: '', role: '', company: '', companyCnpj: '' });

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
  
  const getSalesBySalesperson = () => {
    const dataMap = {};
    deals.filter(d => d.status === 'Ganho').forEach(d => {
      const seller = d.salesperson || 'Desconhecido';
      if (!dataMap[seller]) dataMap[seller] = 0;
      dataMap[seller] += d.value;
    });
    return Object.keys(dataMap).map(seller => ({
      name: seller,
      vendas: dataMap[seller]
    })).sort((a, b) => b.vendas - a.vendas);
  };
  const salesBySalespersonData = getSalesBySalesperson();
  const totalCrmValue = deals.filter(d => d.status !== 'Ganho' && d.status !== 'Perdido').reduce((acc, d) => acc + d.value, 0);
  const totalWonValue = deals.filter(d => d.status === 'Ganho').reduce((acc, d) => acc + d.value, 0);
  const totalWonCount = deals.filter(d => d.status === 'Ganho').length;
  const totalLostCount = deals.filter(d => d.status === 'Perdido').length;
  const closedCount = totalWonCount + totalLostCount;
  const winRate = closedCount > 0 ? ((totalWonCount / closedCount) * 100).toFixed(1) : 0;
  const avgTicket = totalWonCount > 0 ? (totalWonValue / totalWonCount) : 0;

  // Real financial calculations
  const wonDeals = deals.filter(d => d.status === 'Ganho');
  const receivedByPix = wonDeals.filter(d => d.paymentMethod === 'PIX').reduce((acc, d) => acc + (d.value || 0), 0);
  const receivedByCard = wonDeals.filter(d => d.paymentMethod === 'Cartão').reduce((acc, d) => acc + (d.value || 0), 0);
  const receivedByCredit = wonDeals.filter(d => d.paymentMethod === 'Crediário').reduce((acc, d) => acc + (d.value || 0), 0);
  const receivedByOther = wonDeals.filter(d => !d.paymentMethod || (d.paymentMethod !== 'PIX' && d.paymentMethod !== 'Cartão' && d.paymentMethod !== 'Crediário')).reduce((acc, d) => acc + (d.value || 0), 0);

  const totalPendingExpenses = expenses.filter(e => e.status === 'Pendente').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const totalPaidExpenses = expenses.filter(e => e.status === 'Pago').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

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

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;
    const activeCnpj = currentUser?.companyCnpj || '00.000.000/0001-00';
    try {
      await addDoc(collection(db, 'expenses'), {
        ...newExpense,
        amount: Number(newExpense.amount),
        companyCnpj: activeCnpj,
        createdAt: new Date().toISOString()
      });
      setNewExpense({ description: '', amount: '', dueDate: '', status: 'Pendente' });
      setIsExpenseModalOpen(false);
    } catch(err) {
      console.error(err);
      alert('Erro ao adicionar despesa.');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Remover esta despesa?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch(err) {
      console.error(err);
    }
  };

  const handleToggleExpenseStatus = async (expense) => {
    const newStatus = expense.status === 'Pago' ? 'Pendente' : 'Pago';
    try {
      await updateDoc(doc(db, 'expenses', expense.id), { status: newStatus });
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'pedidos') {
      deals.filter(d => d.source === 'vitrine' && d.status !== 'Ganho' && d.status !== 'Perdido' && !d.viewedByAdmin).forEach(async (d) => {
        try {
          await updateDoc(doc(db, 'deals', d.id), { viewedByAdmin: true });
        } catch(e) {}
      });
    }
  }, [activeTab, deals]);

  useEffect(() => {
    if (activeTab === 'pedidos') {
      deals.filter(d => d.source === 'vitrine' && d.status !== 'Ganho' && d.status !== 'Perdido' && !d.viewedByAdmin).forEach(async (d) => {
        try {
          await updateDoc(doc(db, 'deals', d.id), { viewedByAdmin: true });
        } catch(e) {}
      });
    }
  }, [activeTab, deals]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    const item = {
      ...newItem,
      id: Date.now().toString(),
      quantity: Number(newItem.quantity),
      price: Number(newItem.price),
      lastMovementDate: new Date().toISOString(),
      companyCnpj: currentUser.companyCnpj || currentUser.cnpj || '00.000.000/0001-00'
    };
    await setDoc(doc(db, 'items', item.id), item);
    
    // Log movement
    const movement = {
      id: Date.now().toString(),
      sku: item.sku,
      type: 'ENTRADA',
      quantity: item.quantity,
      date: item.lastMovementDate,
      user: currentUser.name,
      reason: 'Cadastro Inicial',
      companyCnpj: currentUser.companyCnpj || currentUser.cnpj || '00.000.000/0001-00'
    };
    await setDoc(doc(db, 'movements', movement.id), movement);

    setIsModalOpen(false);
    setNewItem({ name: '', sku: '', quantity: 0, location: '', price: 0 });

  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'items', id));

  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.cnpj) return;
    const company = {
      id: Date.now().toString(),
      name: newCompany.name,
      cnpj: newCompany.cnpj
    };
    await setDoc(doc(db, 'companies', company.id), company);
    setNewCompany({ name: '', cnpj: '' });

  };

  const handleDeleteCompany = async (id) => {
    await deleteDoc(doc(db, 'companies', id));

  };

  const handleAddDevService = async (e) => {
    e.preventDefault();
    if (!newDevService.title || !newDevService.value || !newDevService.dueDate) {
      alert("Preencha todos os campos.");
      return;
    }
    const activeCnpj = currentUser?.companyCnpj || currentUser?.cnpj || '00.000.000/0001-00';
    try {
      await addDoc(collection(db, 'devServices'), {
        title: newDevService.title,
        value: Number(newDevService.value),
        dueDate: newDevService.dueDate,
        status: newDevService.status,
        companyCnpj: activeCnpj,
        createdAt: new Date().toISOString()
      });
      setIsDevModalOpen(false);
      setNewDevService({ title: '', value: '', dueDate: '', status: 'Pendente' });
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar serviço.');
    }
  };

  const deleteDevService = async (id) => {
    if (window.confirm("Deseja realmente excluir este serviço?")) {
      await deleteDoc(doc(db, 'devServices', id));
    }
  };

  const handleUpdateDevStatus = async (id, newStatus) => {
    await updateDoc(doc(db, 'devServices', id), { status: newStatus });
  };

  const handleUpdateQuantity = async (id, delta, type = delta > 0 ? 'ENTRADA' : 'SAIDA', reason = delta > 0 ? 'Entrada manual' : 'Saída manual') => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const newQuantity = Number(item.quantity) + delta;
    const date = new Date().toISOString();

    await setDoc(doc(db, 'items', id), { ...item, quantity: newQuantity, lastMovementDate: date });

    // Log movement
    const movement = {
      id: Date.now().toString(),
      sku: item.sku,
      type: type,
      quantity: Math.abs(delta),
      date: date,
      user: currentUser.name,
      reason: reason,
      companyCnpj: currentUser.companyCnpj || currentUser.cnpj || '00.000.000/0001-00'
    };
    await setDoc(doc(db, 'movements', movement.id), movement);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    
    // Check if quantity changed to log a movement
    const delta = Number(editFormData.quantity) - editItem.quantity;
    if (delta !== 0) {
       const type = delta > 0 ? 'ENTRADA' : 'SAIDA';
       handleUpdateQuantity(editItem.id, delta, type, 'Edição Manual');
    }

    const updatedItem = {
      ...editItem,
      ...editFormData,
      price: Number(editFormData.price),
      quantity: Number(editFormData.quantity),
      deliveryDays: Number(editFormData.deliveryDays || 3)
    };
    
    await setDoc(doc(db, 'items', editItem.id), updatedItem);
    
    setIsEditModalOpen(false);
    setEditItem(null);
    alert('Produto editado com sucesso!');
  };

  const handleAddOfferSubmit = async (e) => {
    e.preventDefault();
    if (!offerFormData.itemId || offerFormData.offerPrice <= 0 || offerFormData.hours <= 0) return;
    
    const targetItem = items.find(i => i.id === offerFormData.itemId);
    if (!targetItem) return;

    const offerEndsAt = new Date(Date.now() + offerFormData.hours * 3600 * 1000).toISOString();
    
    const updatedItem = {
      ...targetItem,
      price: Number(offerFormData.offerPrice),
      originalPrice: targetItem.originalPrice || targetItem.price,
      isOffer: true,
      offerEndsAt: offerEndsAt
    };
    
    await setDoc(doc(db, 'items', targetItem.id), updatedItem);
    setIsOfferModalOpen(false);
    setOfferFormData({ itemId: '', offerPrice: 0, hours: 24 });
    alert('Oferta relâmpago adicionada com sucesso!');
  };

  const handleSendBirthday = async (customer) => {
    // Gerar Cupom
    const couponCode = `NIVER${customer.cpf.replace(/\D/g, '').slice(0, 4)}${Math.floor(Math.random() * 100)}`;
    const newCoup = {
      id: Date.now().toString(),
      code: couponCode,
      discount: Number(birthdayDiscount),
      expireDays: 7, // expira em 7 dias
      companyCnpj: currentUser.companyCnpj || currentUser.cnpj || '00.000.000/0001-00',
      usageLimit: 1,
      usedCount: 0,
      targetCpf: customer.cpf
    };
    await setDoc(doc(db, 'coupons', newCoup.id), newCoup);

    // Substituir template
    const msg = birthdayMessageTemplate
      .replace('{nome}', customer.name.split(' ')[0])
      .replace('{cupom}', couponCode)
      .replace('{desconto}', birthdayDiscount);

    // Abrir WhatsApp
    const phone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      alert('Cliente sem telefone cadastrado.');
    }
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

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    
    try {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + Number(newCoupon.expireDays));
      
      await addDoc(collection(db, 'coupons'), {
        code: newCoupon.code.toUpperCase(),
        discount: Number(newCoupon.discount),
        expireDate: expireDate.toISOString(),
        usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : null,
        usedCount: 0,
        companyCnpj: currentUser.companyCnpj
      });
      setIsCouponModalOpen(false);
      setNewCoupon({ code: '', discount: 10, expireDays: 30, usageLimit: '' });
      alert('Cupom cadastrado com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao cadastrar cupom');
    }
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

  const handlePhoneChangeAdmin = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    setLoginData({...loginData, phone: value});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(loginData.cpf)) {
      alert("Por favor, insira um CPF válido no formato 000.000.000-00");
      return;
    }

    const cpfClean = loginData.cpf.replace(/\D/g, '');

    if (loginMode === 'login') {
      const userRef = doc(db, 'users', cpfClean);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setCurrentUser({...userData, companyCnpj: userData.companyCnpj || '00.000.000/0001-00'});
      } else {
        alert("Usuário não encontrado. Por favor, faça o cadastro.");
      }
    } else {
      if (loginData.role === 'Vendedor' && !loginData.phone) {
        alert("O telefone é obrigatório para vendedores.");
        return;
      }
      
      if (loginData.name && loginData.cpf && loginData.company && loginData.companyCnpj && loginData.email) {
        const userDoc = {
          name: loginData.name,
          email: loginData.email,
          cpf: loginData.cpf,
          company: loginData.company,
          companyCnpj: loginData.companyCnpj,
          role: loginData.role,
          phone: loginData.phone || '',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', cpfClean), userDoc);
        setCurrentUser({...userDoc});

        try {
          const sellerWelcomeHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #007bff; margin: 0; font-size: 28px;">GESTE</h1>
              </div>
              <p style="font-size: 16px;">Olá, <strong>${loginData.name}</strong>,</p>
              <p style="font-size: 16px;">É com muita alegria que damos as boas-vindas à GESTE! Estamos muito felizes por você ter nos escolhido para fazer parte da jornada de crescimento da sua empresa. 🚀</p>
              <p style="font-size: 16px;">Nós sabemos que gerenciar um negócio exige muito esforço. Por isso, criamos a GESTE para ser a sua parceira ideal, simplificando sua rotina para que você tenha tempo de focar no que realmente importa: vender e crescer.</p>
              <p style="font-size: 16px;">Com a nossa plataforma, você tem o controle total do seu negócio em um só lugar:</p>
              <ul style="font-size: 16px; line-height: 1.6;">
                <li>📦 <strong>Gestão de Estoque Inteligente:</strong> Saiba exatamente o que entrou, o que saiu e o que está parado no seu estoque.</li>
                <li>💰 <strong>Controle Financeiro Descomplicado:</strong> Acompanhe suas finanças de perto, registrando todas as entradas, vendas e lucros com clareza.</li>
                <li>🛍️ <strong>Sua Loja Virtual Integrada:</strong> Ao cadastrar sua empresa, você ganha automaticamente um site exclusivo! Uma plataforma completa onde seus clientes podem visualizar todos os seus produtos e fazer compras de forma rápida e segura.</li>
              </ul>
              <p style="font-size: 16px; margin-top: 20px;">Que tal darmos o primeiro passo?</p>
              <p style="font-size: 16px;">Para ver a mágica acontecer, sugerimos que você comece cadastrando os dados da sua empresa e adicionando seus primeiros produtos.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://geste.onrender.com" style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Acessar Minha Conta e Começar</a>
              </div>
              <p style="font-size: 14px; color: #777;">Se bater alguma dúvida ou precisar de ajuda para configurar sua loja, não se preocupe! Nossa equipe de suporte está sempre à disposição. É só responder a este e-mail.</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Desejamos muito sucesso e vendas incríveis!</p>
              <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Um grande abraço,<br>Equipe GESTE 💙</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <div style="text-align: center; font-size: 12px; color: #999;">
                <a href="https://geste.onrender.com" style="color: #007bff; text-decoration: none;">Acesse nosso site</a>
              </div>
            </div>
          `;

          await emailjs.send(
            'service_n2k30o9',
            'template_tht2nks',
            {
              to_email: loginData.email,
              subject: '🎉 Bem-vindo(a) à GESTE! Prepare-se para transformar o seu negócio.',
              html_message: sellerWelcomeHtml
            },
            {
              publicKey: 'mNLHg4WMPI_KmzA8c'
            }
          );
        } catch (emailErr) {
          console.error("Erro ao enviar email de boas-vindas (vendedor):", emailErr);
        }
      }
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

  const handleAddDeal = async (e) => {
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
  };

  const handleAddTrackingMessage = async (e) => {
    e.preventDefault();
    if (!trackingModal) return;

    try {
      const dealRef = doc(db, 'deals', trackingModal.dealId);
      const deal = deals.find(d => d.id === trackingModal.dealId);
      const currentTracking = deal?.tracking || [];
      const updates = {
        tracking: [...currentTracking, {
          msg: trackingModal.msg || trackingModal.status,
          date: new Date().toISOString()
        }]
      };
      
      if (trackingModal.status) {
        updates.shippingStatus = trackingModal.status;
      }

      await updateDoc(dealRef, updates);
      setTrackingModal(null);
      alert('Rastreio atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar rastreio.');
    }
  };

  const handleSendInternalMessage = async (e) => {
    e.preventDefault();
    if (!internalChat || !internalChat.msg.trim()) return;

    try {
      const dealRef = doc(db, 'deals', internalChat.dealId);
      const deal = deals.find(d => d.id === internalChat.dealId);
      const currentMessages = deal?.messages || [];
      await updateDoc(dealRef, {
        messages: [...currentMessages, {
          sender: currentUser.name,
          role: 'admin',
          text: internalChat.msg,
          date: new Date().toISOString()
        }]
      });
      setInternalChat(prev => ({ ...prev, msg: '' }));
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar mensagem.');
    }
  };

  const archiveDeal = async (dealId) => {
    if (!window.confirm('Deseja arquivar este pedido? Ele será removido do painel principal, mas poderá ser exportado no histórico.')) return;
    try {
      await updateDoc(doc(db, 'deals', dealId), { archived: true });
    } catch (err) {
      console.error(err);
      alert('Erro ao arquivar pedido.');
    }
  };

  const exportToExcel = () => {
    const data = deals.filter(d => d.archived);
    if (data.length === 0) {
      alert("Nenhum negócio (Ganho ou Perdido) disponível para exportação..");
      return;
    }
    const headers = ["Data", "Protocolo", "Cliente", "Telefone", "Vendedor", "Status", "Valor (R$)", "Produtos"];
    const csvRows = [headers.join(',')];
    data.forEach(d => {
      const prods = d.products ? d.products.map(p => `${p.quantity}x ${p.name}`).join(' | ') : '';
      const row = [
        new Date(d.date).toLocaleDateString('pt-BR'),
        `"${d.id.slice(-6)}"`,
        `"${d.client}"`,
        `"${d.phone || ''}"`,
        `"${d.salesperson || ''}"`,
        `"${d.status}"`,
        d.value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        `"${prods}"`
      ];
      csvRows.push(row.join(','));
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historico_crm_arquivados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const advanceDealStatus = async (dealId, currentStatus) => {
    const statusFlow = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Ganho', 'Perdido'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1 && currentStatus !== 'Ganho' && currentStatus !== 'Perdido') {
      const nextStatus = statusFlow[currentIndex + 1];
      
      if (nextStatus === 'Ganho') {
        const deal = deals.find(d => d.id === dealId);
        let updatedItems = [...items];
        let newMovements = [...movements];
        const date = new Date().toISOString();

        for (const prod of deal.products) {
          const existingItemIndex = updatedItems.findIndex(i => i.sku === prod.sku);
          if (existingItemIndex >= 0) {
            const updItem = updatedItems[existingItemIndex];
            updItem.quantity -= Number(prod.quantity);
            updItem.lastMovementDate = date;
            await setDoc(doc(db, 'items', updItem.id), updItem);
          } else {
             const newItemObj = {
              id: Date.now().toString() + Math.random().toString(),
              sku: prod.sku,
              name: prod.name,
              quantity: -Number(prod.quantity),
              price: Number(prod.price),
              location: 'Não definida',
              lastMovementDate: date
            };
            await setDoc(doc(db, 'items', newItemObj.id), newItemObj);
            updatedItems.push(newItemObj);
          }
          
          const mov = {
            id: Date.now().toString() + Math.random().toString(),
            sku: prod.sku,
            type: 'SAIDA',
            quantity: Number(prod.quantity),
            date: date,
            user: currentUser.name,
            reason: `Venda Fechada (Cliente: ${deal.client})`
          };
          await setDoc(doc(db, 'movements', mov.id), mov);
        }
        
        deal.status = nextStatus;
        await setDoc(doc(db, 'deals', dealId), deal);
      } else {
        const deal = deals.find(d => d.id === dealId);
        deal.status = nextStatus;
        await setDoc(doc(db, 'deals', dealId), deal);
      }
    }
  };

  const markDealLost = async (dealId) => {
    if(window.confirm('Marcar como Perdido?')) {
      const deal = deals.find(d => d.id === dealId);
      deal.status = 'Perdido';
      await setDoc(doc(db, 'deals', dealId), deal);
    }
  };

  const handleOpenNfeModal = (deal) => {
    setSelectedNfeDeal(deal);
    
    // Auto-fill from customer profile if available
    let destinatario = { cnpjDestinatario: '', cepDestinatario: '', enderecoDestinatario: '', cidadeDestinatario: '' };
    if (deal.customerCpf) {
      const customer = customers.find(c => c.cpf === deal.customerCpf);
      if (customer) {
        destinatario.cnpjDestinatario = customer.cpf;
        destinatario.cepDestinatario = customer.zip || '';
        destinatario.enderecoDestinatario = [customer.address, customer.neighborhood].filter(Boolean).join(', ');
        destinatario.cidadeDestinatario = [customer.city, customer.state].filter(Boolean).join(' / ');
      }
    }
    
    setNfeFormData(prev => ({
      ...prev,
      ...destinatario
    }));
    
    setIsNfeModalOpen(true);
  };

  const handleEmitNfe = async (e) => {
    e.preventDefault();
    setIsEmitindoNfe(true);

    const cleanCnpj = currentUser.cnpj ? currentUser.cnpj.replace(/\D/g, '').padStart(14, '0') : '00000000000000';
    const chaveAcesso = '352609' + cleanCnpj + '550010000001421' + Math.floor(100000000 + Math.random() * 900000000);
    
    const updatedDeal = { ...selectedNfeDeal, nfeEmitted: true, chaveAcesso: chaveAcesso, nfeData: nfeFormData, nfeNotification: true };
    await setDoc(doc(db, 'deals', selectedNfeDeal.id), updatedDeal);

    // Simular tempo de resposta da SEFAZ
    setTimeout(() => {
      setIsEmitindoNfe(false);
      setIsNfeModalOpen(false);
      
      // Geração do "PDF" em nova aba
      const printWindow = window.open('', '_blank');
      const invoiceHtml = generateDanfeHtml(updatedDeal, currentUser, nfeFormData);
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();

      setSelectedNfeDeal(null);
    }, 2000);
  };

  const handleViewPdf = (deal) => {
    const printWindow = window.open('', '_blank');
    const invoiceHtml = generateDanfeHtml(deal, currentUser, deal.nfeData || {});
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
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
    const deal = {
      id: newDealId,
      client: 'Cliente Web (' + checkoutMethod + ')',
      title: 'Venda via Carrinho',
      value: dealTotal,
      status: 'Ganho',
      products: cart.map(c => ({ sku: c.sku, name: c.name, quantity: c.cartQuantity, price: c.price })),
      salesperson: currentUser.name,
      companyCnpj: currentUser.companyCnpj || currentUser.cnpj || '00.000.000/0001-00'
    };
    
    setDeals([deal, ...deals]);
    
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
        reason: `Venda (ID: ${deal.id})`,
        companyCnpj: currentUser.companyCnpj || currentUser.cnpj || '00.000.000/0001-00'
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
            <img src={logo} alt="Logo GESTE" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
            <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Bem-vindo ao GESTE</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Faça login para acessar o sistema de estoque.</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button 
              type="button" 
              className={loginMode === 'login' ? 'btn-primary' : 'btn-secondary'} 
              style={{ flex: 1, padding: '0.5rem' }} 
              onClick={() => setLoginMode('login')}
            >
              Entrar
            </button>
            <button 
              type="button" 
              className={loginMode === 'register' ? 'btn-primary' : 'btn-secondary'} 
              style={{ flex: 1, padding: '0.5rem' }} 
              onClick={() => setLoginMode('register')}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleLogin}>
            {loginMode === 'register' && (
              <>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>E-mail</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="Seu melhor e-mail"
                    value={loginData.email}
                    onChange={e => setLoginData({...loginData, email: e.target.value})}
                  />
                </div>
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
              </>
            )}
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>CPF</label>
              <input 
                type="text" 
                required 
                placeholder="000.000.000-00"
                value={loginData.cpf}
                onChange={handleCpfChange}
                maxLength="14"
              />
            </div>

            {loginMode === 'register' && (
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
                      let v = e.target.value.replace(/\D/g, '');
                      if (v.length > 14) v = v.slice(0, 14);
                      v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                      v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                      v = v.replace(/(\d{4})(\d)/, '$1-$2');
                      setLoginData({...loginData, companyCnpj: v});
                    }}
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
                {loginData.role === 'Vendedor' && (
                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label>Seu WhatsApp</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="(00) 00000-0000"
                      value={loginData.phone}
                      onChange={handlePhoneChangeAdmin}
                    />
                  </div>
                )}
              </>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
              {loginMode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}
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
          <img src={logo} alt="Logo GESTE" style={{ height: '45px', width: '45px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>GESTE</h1>
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
              setTempProfile({
                name: currentUser.name || '',
                role: currentUser.role || 'Vendedor',
                company: currentUser.company || '',
                companyCnpj: currentUser.companyCnpj || currentUser.cnpj || ''
              });
              setIsProfileModalOpen(true);
            }} title="Clique para editar o seu perfil">
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {currentUser.name} <span style={{fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--primary-color)'}}>({currentUser.role || 'Vendedor'})</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentUser.company} | CNPJ: {currentUser.companyCnpj || currentUser.cnpj}</div>
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
          <button className={activeTab === 'pedidos' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('pedidos')} style={activeTab !== 'pedidos' ? { color: 'var(--text-primary)', position: 'relative' } : { position: 'relative' }}>
            Pedidos Solicitados
            {hasUnreadAdmin ? (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '50%' }}>
                !
              </span>
            ) : deals.filter(d => d.source === 'vitrine' && d.status !== 'Ganho' && d.status !== 'Perdido').length > 0 ? (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '50%' }}>
                {deals.filter(d => d.source === 'vitrine' && d.status !== 'Ganho' && d.status !== 'Perdido').length}
              </span>
            ) : null}
          </button>
          <button className={activeTab === 'lojas' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('lojas')} style={activeTab !== 'lojas' ? { color: 'var(--text-primary)' } : {}}>
            Lojas (Empresas)
          </button>
          
        </nav>

        {activeTab === 'pedidos' && (
          <>
            <div className="toolbar glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Pedidos Solicitados (Vitrine)</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', marginTop: 0 }}>Em Andamento (Sem Atendimento)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {deals.filter(d => d.source === 'vitrine' && d.shippingStatus !== 'Entregue').length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: '#f8f9fa', borderRadius: '8px' }}>Nenhum pedido em andamento.</div>
                  ) : (
                    deals.filter(d => d.source === 'vitrine' && d.shippingStatus !== 'Entregue').sort((a,b) => new Date(b.date) - new Date(a.date)).map(deal => (
                      <div key={deal.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', borderLeft: '4px solid var(--warning)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(deal.date).toLocaleString()}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', background: '#eee', padding: '2px 8px', borderRadius: '10px' }}>Protocolo #{deal.id.slice(-6)}</span>
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{deal.client}</h3>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '1rem' }}>R$ {deal.value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Status: {deal.status}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Rastreio: {deal.shippingStatus || 'Aguardando'}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>Vendedor Atribuído: {deal.salesperson || 'Nenhum'}</div>
                          {deal.products && deal.products.length > 0 && (
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px' }}>
                              <strong style={{ color: '#333' }}>Itens:</strong> {deal.products.map(p => `${p.quantity}x ${p.name}`).join(', ')}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button className="btn-primary" style={{ flex: 1, position: 'relative' }} onClick={() => setInternalChat({ dealId: deal.id, msg: '' })}>
                            Abrir Atendimento (Chat)
                            {deal.messages && deal.messages.length > 0 && deal.messages[deal.messages.length - 1].role === 'client' && (
                              <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '12px', height: '12px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></span>
                            )}
                          </button>
                          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setTrackingModal({ dealId: deal.id, msg: '' })}>
                            Atualizar Rastreio
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Pedidos Finalizados (Entregues)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {deals.filter(d => d.source === 'vitrine' && d.shippingStatus === 'Entregue').length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: '#f8f9fa', borderRadius: '8px' }}>Nenhum pedido finalizado.</div>
                  ) : (
                    deals.filter(d => d.source === 'vitrine' && d.shippingStatus === 'Entregue').sort((a,b) => new Date(b.date) - new Date(a.date)).map(deal => (
                      <div key={deal.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', borderLeft: '4px solid var(--success)', opacity: 0.85 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(deal.date).toLocaleString()}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', background: '#eee', padding: '2px 8px', borderRadius: '10px' }}>Protocolo #{deal.id.slice(-6)}</span>
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{deal.client}</h3>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '1rem' }}>R$ {deal.value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Status: {deal.status}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Rastreio: {deal.shippingStatus}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>Vendedor Atribuído: {deal.salesperson || 'Nenhum'}</div>
                          {deal.products && deal.products.length > 0 && (
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px' }}>
                              <strong style={{ color: '#333' }}>Itens:</strong> {deal.products.map(p => `${p.quantity}x ${p.name}`).join(', ')}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button className="btn-secondary" style={{ flex: 1, position: 'relative' }} onClick={() => setInternalChat({ dealId: deal.id, msg: '' })}>
                            Ver Atendimento (Chat)
                            {deal.messages && deal.messages.length > 0 && deal.messages[deal.messages.length - 1].role === 'client' && (
                              <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '12px', height: '12px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></span>
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'produtos' && (
          <>
            <div className="toolbar glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Catálogo de Produtos</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => setIsOfferModalOpen(true)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Adicionar Oferta
                </button>
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
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '150px', objectFit: 'contain', background: '#fff', borderRadius: '0.5rem' }} />
                    ) : (
                      <div style={{ width: '100%', height: '150px', background: 'var(--background-color)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--text-secondary)' }}>
                        📦
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SKU: {item.sku}</div>
                      <h3 style={{ margin: '0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{item.name}</h3>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>R$ {Number(item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{item.sold || 0} vendidos</div>
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
                        onClick={() => { 
                          setEditItem(item); 
                          setEditFormData({
                            name: item.name, sku: item.sku, quantity: item.quantity, location: item.location || '', price: item.price, category: item.category || 'Tecnologia', imageUrl: item.imageUrl || '', imageUrls: item.imageUrls || [], freeShipping: item.freeShipping || false, deliveryDays: item.deliveryDays || 3
                          });
                          setIsEditModalOpen(true); 
                        }}
                      >
                        Editar
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
                  <td>
                    {item.name}
                    {item.isOffer && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', background: 'var(--danger)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                        OFERTA
                      </span>
                    )}
                  </td>
                  <td>
                    {item.isOffer ? (
                      <div>
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.75rem', marginRight: '0.5rem' }}>
                          R$ {Number(item.originalPrice).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                        <strong style={{ color: 'var(--danger)' }}>R$ {Number(item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                      </div>
                    ) : (
                      <span>R$ {Number(item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    )}
                  </td>
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
                      <button className="btn-icon" onClick={() => { 
                        setEditItem(item); 
                        setEditFormData({
                          name: item.name, sku: item.sku, quantity: item.quantity, location: item.location || '', price: item.price, category: item.category || 'Tecnologia', imageUrl: item.imageUrl || '', imageUrls: item.imageUrls || [], freeShipping: item.freeShipping || false, deliveryDays: item.deliveryDays || 3
                        });
                        setIsEditModalOpen(true); 
                      }} title="Ajuste Geral" style={{ fontSize: '1rem' }}>
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
                <button className={movementFilter === 'PERDA' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMovementFilter('PERDA')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Perdas/Avarias</button>
                <button className={movementFilter === 'CLIENTE' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMovementFilter('CLIENTE')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Clientes (Vendas)</button>
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
                    <th>Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.filter(m => (movementFilter === 'ALL' || (movementFilter === 'CLIENTE' && (m.client || m.reason?.includes('(Cliente:'))) || m.type === movementFilter)).map(m => (
                    <tr key={m.id}>
                      <td>{new Date(m.date).toLocaleString('pt-BR')}</td>
                      <td>{m.sku}</td>
                      <td>
                        <span className={`status-badge ${m.type === 'ENTRADA' ? 'status-in-stock' : m.type === 'SAIDA' ? 'status-low-stock' : m.type === 'PERDA' ? 'status-critical' : 'status-low-stock'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                          {m.type === 'ENTRADA' ? '↓' : m.type === 'SAIDA' ? '↑' : '⚙️'} {m.type}
                        </span>
                      </td>
                      <td>{m.quantity}</td>
                      <td>{m.reason}</td>
                      <td>{m.user}</td>
                      <td>{m.client || (m.reason?.includes('(Cliente:') ? m.reason.split('(Cliente:')[1].replace(')','') : "-")}</td>
                    </tr>
                  ))}
                  {movements.filter(m => (movementFilter === 'ALL' || (movementFilter === 'CLIENTE' && (m.client || m.reason?.includes('(Cliente:'))) || m.type === movementFilter)).length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhuma movimentação encontrada para este filtro.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'relatorios' && (() => {
          // Calculate ABC Curve data
          const totalSalesValue = items.reduce((sum, item) => sum + ((item.sold || 0) * item.price), 0);
          let accumulatedValue = 0;
          
          const abcItems = [...items]
            .map(item => ({ ...item, totalValue: (item.sold || 0) * item.price }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .map(item => {
              accumulatedValue += item.totalValue;
              const accumulatedPercentage = totalSalesValue > 0 ? (accumulatedValue / totalSalesValue) * 100 : 0;
              let curva = 'C';
              if (accumulatedPercentage <= 80) curva = 'A';
              else if (accumulatedPercentage <= 95) curva = 'B';
              
              const isHighDemand = (item.sold || 0) > 0 && item.quantity > 0 && item.quantity <= 15;
              
              return { ...item, curva, isHighDemand };
            });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Curva ABC */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Curva ABC (Por Volume de Vendas)</h3>
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
                        <th>Valor Vendido (Saídas)</th>
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
                          <td>{item.name} {item.isHighDemand && <span style={{ marginLeft: '0.5rem', background: '#ee4d2d', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>🔥 Últimas Unidades</span>}</td>
                          <td>{item.sku}</td>
                          <td>{item.quantity}</td>
                          <td><strong>R$ {item.totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                          <td>
                            {item.curva === 'A' && item.quantity <= 10 ? (
                              <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--danger)', boxShadow: 'none' }} onClick={() => { setActiveTab('compras'); setIsOrderModalOpen(true); }}>
                                 Reposição Imediata
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
                              <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>R$ {val.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
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

              {/* ===== PLANILHAS ARQUIVADAS ===== */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', marginTop: '1.5rem', border: '1px solid rgba(26,115,232,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Planilhas Arquivadas (Google Sheets)
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Dados históricos arquivados automaticamente pelo Apps Script
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {sheetsLoaded && (
                      <>
                        <button
                          className="btn-secondary"
                          style={{ color: 'var(--text-primary)', fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                          onClick={() => exportToExcel(
                            sheetsData[sheetsActiveTab] || [],
                            sheetsActiveTab,
                            sheetsActiveTab
                          )}
                        >
                          Excel (aba atual)
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ color: 'var(--text-primary)', fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                          onClick={() => exportMultipleSheetsToExcel(sheetsData, 'Relatorio_Completo')}
                        >
                          Excel (tudo)
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ color: 'var(--text-primary)', fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                          onClick={() => exportToPdf(
                            sheetsData[sheetsActiveTab] || [],
                            sheetsActiveTab,
                            sheetsActiveTab
                          )}
                        >
                          PDF
                        </button>
                      </>
                    )}
                    <button
                      className="btn-primary"
                      style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                      onClick={handleLoadSheets}
                      disabled={sheetsLoading}
                    >
                      {sheetsLoading ? '⏱️ Carregando...' : sheetsLoaded ? 'Atualizar' : 'Carregar Planilhas'}
                    </button>
                  </div>
                </div>

                {!sheetsLoaded && !sheetsLoading && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'rgba(26,115,232,0.04)', borderRadius: '0.75rem', border: '1px dashed rgba(26,115,232,0.2)' }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>Clique em "Carregar Planilhas" para buscar os dados arquivados do Google Sheets</p>
                  </div>
                )}

                {sheetsLoading && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
                    <p style={{ margin: 0 }}>Buscando dados da planilha...</p>
                  </div>
                )}

                {sheetsLoaded && !sheetsLoading && (
                  <>
                    {/* Sub-tabs das abas da planilha */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                      {Object.values(SHEET_TABS).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setSheetsActiveTab(tab)}
                          style={{
                            padding: '0.3rem 0.85rem',
                            borderRadius: '20px',
                            border: '1px solid',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            background: sheetsActiveTab === tab ? 'var(--primary-color)' : 'transparent',
                            color: sheetsActiveTab === tab ? 'white' : 'var(--text-secondary)',
                            borderColor: sheetsActiveTab === tab ? 'var(--primary-color)' : 'var(--glass-border)',
                          }}
                        >
                          {tab}
                          {sheetsData[tab]?.length > 0 && (
                            <span style={{ marginLeft: '0.4rem', background: sheetsActiveTab === tab ? 'rgba(255,255,255,0.3)' : '#e2e8f0', borderRadius: '10px', padding: '0 5px', fontSize: '0.7rem' }}>
                              {sheetsData[tab].length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Tabela da aba selecionada */}
                    {(sheetsData[sheetsActiveTab] || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: '#f8f9fa', borderRadius: '0.5rem' }}>
                        Nenhum dado arquivado nesta aba ainda.
                      </div>
                    ) : (
                      <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table>
                          <thead>
                            <tr>
                              {Object.keys(sheetsData[sheetsActiveTab][0]).map(col => (
                                <th key={col}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sheetsData[sheetsActiveTab].map((row, i) => (
                              <tr key={i}>
                                {Object.values(row).map((val, j) => (
                                  <td key={j} style={{ whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)
                                      ? new Date(val).toLocaleDateString('pt-BR')
                                      : typeof val === 'number' && Object.keys(sheetsData[sheetsActiveTab][0])[j]?.toLowerCase().includes('valor')
                                        ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                        : String(val ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
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
                        <span className="card-value" style={{ fontSize: '1.1rem' }}>R$ {Number(order.totalValue).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                  Minhas Notas Fiscais
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
                        R$ {totalWonValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>R$ {totalWonValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Da meta de</p>
                          <h3 style={{ margin: 0, color: '#3b82f6' }}>R$ {salesGoal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                        </div>
                      </div>

                      <h4 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Vendas por Vendedor</h4>
                      <div style={{ width: '100%', height: '150px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={salesBySalespersonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} style={{ fontSize: '0.75rem' }} />
                            <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Vendas']} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Bar dataKey="vendas" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={30}>
                              <LabelList dataKey="vendas" position="top" formatter={(val) => `R$${val.toFixed(0)}`} style={{ fontSize: '0.7rem', fill: 'var(--text-secondary)' }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Finanças & Clientes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Contas a receber</h3>
    <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setIsDevManagerOpen(true)}>+ Serviços de Programação</button>
  </div>
                        <div style={{ fontSize: '2.5rem', color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          ↓ R$ {totalWonValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {receivedByPix > 0 && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '99px' }}>PIX: R$ {receivedByPix.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>}
                          {receivedByCard > 0 && <span style={{ background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: '99px' }}>Cartão: R$ {receivedByCard.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>}
                          {receivedByCredit > 0 && <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '99px' }}>Crediário: R$ {receivedByCredit.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>}
                          {receivedByOther > 0 && <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '99px' }}>Outros: R$ {receivedByOther.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>}
                          {totalWonValue === 0 && <span style={{ color: '#999' }}>Nenhuma venda ainda</span>}
                        </div>
                      </div>
                      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Contas a pagar</h3>
                          <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setIsExpenseModalOpen(true)}>+ Despesa</button>
                        </div>
                        <div style={{ fontSize: '2.5rem', color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          ↑ R$ {totalPendingExpenses.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                          <span style={{ color: '#dc2626' }}>Pendente: R$ {totalPendingExpenses.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          <span style={{ color: '#16a34a' }}>Pago: R$ {totalPaidExpenses.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        {expenses.length > 0 && (
                          <div style={{ marginTop: '0.75rem', maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {expenses.slice(0, 5).map(exp => (
                              <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', background: exp.status === 'Pago' ? '#f0fdf4' : '#fff7ed', padding: '4px 8px', borderRadius: '6px' }}>
                                <span style={{ color: '#333', flex: 1 }}>{exp.description}</span>
                                <span style={{ fontWeight: 'bold', color: exp.status === 'Pago' ? '#16a34a' : '#dc2626', marginLeft: '0.5rem' }}>R$ {Number(exp.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                <button onClick={() => handleToggleExpenseStatus(exp)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: exp.status === 'Pago' ? '#dc2626' : '#16a34a', padding: '2px 5px' }}>
                                  {exp.status === 'Pago' ? '↩ Reverter' : '✓ Pago'}
                                </button>
                                <button onClick={() => handleDeleteExpense(exp.id)} style={{ marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '0.85rem' }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        {expenses.length === 0 && <p style={{ fontSize: '0.8rem', color: '#999', margin: '0.5rem 0 0' }}>Nenhuma despesa cadastrada</p>}
                      </div>
                    </div>

                    {/* Controle de Clientes */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', flex: 1 }}>
                      <h2 style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Controle de Clientes</h2>
                      <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginBottom: '2rem' }}>
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>Vendas no período</p>
                          <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>R$ {totalWonValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>Peças vendidas</p>
                          <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>{deals.filter(d => d.status === 'Ganho').reduce((acc, curr) => acc + curr.products.reduce((a,c) => a + Number(c.quantity),0), 0)}</h3>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>Ticket médio</p>
                          <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>R$ {avgTicket.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
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
                            {(() => {
                              const ganhoDeals = deals.filter(d => d.status === 'Ganho');
                              const clientTotals = {};
                              ganhoDeals.forEach(d => {
                                const clientName = d.client || 'Desconhecido';
                                if (!clientTotals[clientName]) clientTotals[clientName] = 0;
                                clientTotals[clientName] += Number(d.value);
                              });
                              const topClients = Object.entries(clientTotals)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 4)
                                .map(entry => ({ client: entry[0], value: entry[1] }));
                              
                              if (topClients.length === 0) return <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nenhum ganho registrado.</p>;
                              
                              return topClients.map((d, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                  <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: i===0?'#fbbf24':i===1?'#9ca3af':i===2?'#b45309':'#e2e8f0', color: i===3?'#000':'#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{i+1}</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{d.client}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Comprou R$ {Number(d.value).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                  </div>
                                </li>
                              ));
                            })()}
                          </ul>
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Clientes aniversariantes</h4>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7rem', background: '#e2e8f0', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Do dia atual</span>
                              <button onClick={() => setIsBirthdayMessageModalOpen(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>⚙️ Configurar</button>
                            </div>
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {customers.filter(c => {
                              if (!c.birthday) return false;
                              const bDate = new Date(c.birthday);
                              const today = new Date();
                              return bDate.getDate() === today.getDate() && bDate.getMonth() === today.getMonth();
                            }).map((c, idx) => (
                              <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div style={{ fontSize: '1.5rem', color: '#60a5fa' }}>👤</div>
                                  <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.phone}</div>
                                  </div>
                                </div>
                                <button onClick={() => handleSendBirthday(c)} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  🟢 ENVIAR &gt;
                                </button>
                              </li>
                            ))}
                            {customers.filter(c => {
                              if (!c.birthday) return false;
                              const bDate = new Date(c.birthday);
                              const today = new Date();
                              return bDate.getDate() === today.getDate() && bDate.getMonth() === today.getMonth();
                            }).length === 0 && (
                              <li style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nenhum aniversariante hoje.</li>
                            )}
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
                            title={`R$ ${stage.actualValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}>
                              <span style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{stage.name}</span>
                              <span style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{stage.count} neg. (R$ {stage.actualValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

              {/* Metric Cards & Vendas por Vendedor */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="stat-card glass-panel" style={{ borderRadius: '1rem', justifyContent: 'center' }}>
                    <span className="stat-title">Valor em Aberto (Funil)</span>
                    <span className="stat-value" style={{ color: 'var(--primary-color)' }}>R$ {totalCrmValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="stat-card glass-panel" style={{ borderRadius: '1rem', justifyContent: 'center' }}>
                    <span className="stat-title">Vendas Ganhas</span>
                    <span className="stat-value" style={{ color: 'var(--success)' }}>R$ {totalWonValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="stat-card glass-panel" style={{ borderRadius: '1rem', justifyContent: 'center' }}>
                    <span className="stat-title">Ticket Médio</span>
                    <span className="stat-value">R$ {avgTicket.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="stat-card glass-panel" style={{ borderRadius: '1rem', justifyContent: 'center' }}>
                    <span className="stat-title">Taxa de Conversão</span>
                    <span className="stat-value">{winRate}%</span>
                  </div>
                </div>

              </div>
              </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Pipeline (Kanban)</h3>
              <button className="btn-secondary" onClick={exportToExcel} style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
                📥 Exportar Histórico (Arquivados)
              </button>
            </div>
            <div className="kanban-board">
              {['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Ganho', 'Perdido'].map(status => (
                <div key={status} className="kanban-column" style={status === 'Ganho' ? { borderTop: '4px solid var(--success)' } : status === 'Perdido' ? { borderTop: '4px solid var(--danger)' } : { borderTop: '4px solid var(--primary-color)' }}>
                  <h3 style={{ borderBottom: 'none' }}>{status}</h3>
                  {deals.filter(d => d.status === status && !d.archived).map(deal => (
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
                          R$ {Number(deal.value).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} 
                            onClick={(e) => { e.stopPropagation(); setTrackingModal({ dealId: deal.id, msg: '' }); }}
                            title="Atualizar Rastreamento"
                          >
                            📍 Rastreio
                          </button>
                        </div>
                      </div>
                      
                      {status !== 'Ganho' && status !== 'Perdido' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => markDealLost(deal.id)}>Perdido</button>
                          <button className="advance-btn" onClick={() => advanceDealStatus(deal.id, status)}>
                            Avançar ➡️
                          </button>
                        </div>
                      )}
                      {(status === 'Ganho' || status === 'Perdido') && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                          <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }} onClick={(e) => { e.stopPropagation(); archiveDeal(deal.id); }}>
                            📦 Arquivar Negócio
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
                  {deals.filter(d => d.status === status && !d.archived).length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1rem' }}>Vazio</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )}

    {activeTab === 'lojas' && (
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Gerenciar Lojas (Empresas)</h2>
        
        <form onSubmit={handleAddCompany} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', marginBottom: '2rem', alignItems: 'end' }}>
          <div className="form-group">
            <label>Nome da Loja/Empresa</label>
            <input 
              type="text" 
              required
              placeholder="Ex: Minha Loja LTDA"
              value={newCompany.name}
              onChange={e => setNewCompany({...newCompany, name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>CNPJ</label>
            <input 
              type="text" 
              required
              placeholder="00.000.000/0001-00"
              value={newCompany.cnpj}
              maxLength={18}
              onChange={e => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 14) v = v.slice(0, 14);
                v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                v = v.replace(/(\d{4})(\d)/, '$1-$2');
                setNewCompany({...newCompany, cnpj: v});
              }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Adicionar</button>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome da Loja</th>
                <th>CNPJ</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(comp => (
                <tr key={comp.id}>
                  <td>{comp.name}</td>
                  <td>{comp.cnpj}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-secondary"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.25rem 0.5rem' }}
                      onClick={() => handleDeleteCompany(comp.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhuma loja cadastrada ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {isDevManagerOpen && (
    <div className="modal-overlay" onClick={() => setIsDevManagerOpen(false)} style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '800px', padding: '1.5rem', borderRadius: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="toolbar" style={{ marginBottom: '1.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Controle de Serviços (Programação)</h2>
          <button className="btn-primary" onClick={() => setIsDevModalOpen(true)}>
            + Adicionar Serviço
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Descrição / Título</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {devServices.length > 0 ? (
                  devServices.map(svc => (
                    <tr key={svc.id}>
                      <td>{svc.title}</td>
                      <td style={{ fontWeight: 'bold' }}>R$ {Number(svc.value).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td>{new Date(svc.dueDate).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem',
                          background: svc.status === 'Pago' ? '#dcfce7' : '#fee2e2',
                          color: svc.status === 'Pago' ? '#166534' : '#991b1b'
                        }}>
                          {svc.status}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        {svc.status === 'Pendente' && (
                          <button className="btn-secondary" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => handleUpdateDevStatus(svc.id, 'Pago')}>
                            Marcar Pago
                          </button>
                        )}
                        {svc.status === 'Pago' && (
                          <button className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleUpdateDevStatus(svc.id, 'Pendente')}>
                            Desfazer
                          </button>
                        )}
                        <button className="btn-secondary" onClick={() => deleteDevService(svc.id)}>Excluir</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>Nenhum serviço registrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isDevModalOpen && (
          <div className="modal-overlay" onClick={() => setIsDevModalOpen(false)} style={{ zIndex: 1100 }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', background: 'var(--bg-card, #fff)' }}>
              <div className="modal-header">
                <h2>Novo Serviço (Programação)</h2>
                <button className="close-btn" onClick={() => setIsDevModalOpen(false)}>×</button>
              </div>
              <form onSubmit={handleAddDevService} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Título / Descrição</label>
                  <input type="text" required value={newDevService.title} onChange={e => setNewDevService({...newDevService, title: e.target.value})} placeholder="Ex: Criação do PDV Online" />
                </div>
                <div className="form-group">
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" min="0" required value={newDevService.value} onChange={e => setNewDevService({...newDevService, value: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Data de Vencimento</label>
                  <input type="date" required value={newDevService.dueDate} onChange={e => setNewDevService({...newDevService, dueDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={newDevService.status} onChange={e => setNewDevService({...newDevService, status: e.target.value})}>
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Salvar Serviço</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
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
                <label>Categoria</label>
                <select 
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                >
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Casa e Móveis">Casa e Móveis</option>
                  <option value="Eletrodomésticos">Eletrodomésticos</option>
                  <option value="Esportes e Fitness">Esportes e Fitness</option>
                  <option value="Ferramentas">Ferramentas</option>
                  <option value="Supermercado">Supermercado</option>
                  <option value="Veículos">Veículos</option>
                  <option value="Construção">Construção</option>
                  <option value="Indústria e Comércio">Indústria e Comércio</option>
                  <option value="Outros">Outros</option>
                </select>
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
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <input 
                  type="checkbox" 
                  id="freeShipping"
                  checked={newItem.freeShipping}
                  onChange={e => setNewItem({...newItem, freeShipping: e.target.checked})}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="freeShipping" style={{ margin: 0 }}>Oferecer Frete Grátis</label>
              </div>
              <div className="form-group">
                <label>Fotos do Produto (Selecione 1 ou mais)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {newItem.imageUrls && newItem.imageUrls.map((url, idx) => (
                    <img key={idx} src={url} alt={`Preview ${idx}`} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  ))}
                  {newItem.imageUrl && (!newItem.imageUrls || newItem.imageUrls.length === 0) && (
                    <img src={newItem.imageUrl} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  )}
                  <input 
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const urls = [];
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          urls.push(reader.result);
                          if(urls.length === files.length) {
                            setNewItem({...newItem, imageUrls: urls, imageUrl: urls[0]});
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                    style={{ flex: 1 }}
                  />
                </div>
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
              <div className="form-group">
                <label>Prazo de Entrega (dias)</label>
                <input 
                  type="number" 
                  min="0"
                  required 
                  value={newItem.deliveryDays}
                  onChange={e => setNewItem({...newItem, deliveryDays: e.target.value})}
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

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Novo Cupom</h2>
              <button className="close-btn" onClick={() => setIsCouponModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddCoupon}>
              <div className="form-group">
                <label>Código do Cupom</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: OFERTA10"
                  value={newCoupon.code}
                  onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="form-group">
                <label>Desconto (%)</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  max="100"
                  value={newCoupon.discount}
                  onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Validade (Dias)</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  value={newCoupon.expireDays}
                  onChange={e => setNewCoupon({...newCoupon, expireDays: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Limite de Usos (Opcional)</label>
                <input 
                  type="number" 
                  min="1"
                  placeholder="Sem limite"
                  value={newCoupon.usageLimit}
                  onChange={e => setNewCoupon({...newCoupon, usageLimit: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsCouponModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Cupom</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editItem && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Editar Produto: {editItem.name}</h2>
              <button className="close-btn" onClick={() => { setIsEditModalOpen(false); setEditItem(null); }}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Nome do Produto</label>
                <input type="text" required value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>SKU (Código)</label>
                <input type="text" required value={editFormData.sku} onChange={e => setEditFormData({...editFormData, sku: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <input type="text" required value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Preço (R$)</label>
                <input type="number" step="0.01" required min="0" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Quantidade em Estoque</label>
                <input type="number" required min="0" value={editFormData.quantity} onChange={e => setEditFormData({...editFormData, quantity: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Prazo de Entrega (dias)</label>
                <input type="number" min="0" required value={editFormData.deliveryDays} onChange={e => setEditFormData({...editFormData, deliveryDays: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Frete Grátis?</label>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '0.5rem' }}>
                  <input type="checkbox" checked={editFormData.freeShipping} onChange={e => setEditFormData({...editFormData, freeShipping: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                  <span>Sim, oferecer frete grátis</span>
                </div>
              </div>
              
              <div className="form-actions" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => { setIsEditModalOpen(false); setEditItem(null); }}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Offer Modal */}
      {isOfferModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Adicionar Oferta Relâmpago</h2>
              <button className="close-btn" onClick={() => setIsOfferModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddOfferSubmit}>
              <div className="form-group">
                <label>Selecione o Produto</label>
                <select required value={offerFormData.itemId} onChange={e => setOfferFormData({...offerFormData, itemId: e.target.value})}>
                  <option value="">-- Escolha um produto --</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.sku} - {i.name} (R$ {Number(i.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Novo Valor Promocional (R$)</label>
                <input type="number" step="0.01" min="0.01" required value={offerFormData.offerPrice} onChange={e => setOfferFormData({...offerFormData, offerPrice: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Duração da Oferta (Horas)</label>
                <input type="number" min="1" required value={offerFormData.hours} onChange={e => setOfferFormData({...offerFormData, hours: e.target.value})} placeholder="Ex: 24" />
                <small style={{ color: 'var(--text-secondary)' }}>O cronômetro na vitrine iniciará a partir de agora com a duração definida.</small>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsOfferModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>Lançar Oferta</button>
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
                <span style={{ fontSize: '1.2rem', color: 'var(--success)', fontWeight: 'bold' }}>R$ {newOrder.totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                  <span style={{ fontSize: '1.5rem' }}>{item.quantity <= 5 ? '' : '⚠️'}</span>
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
                      R$ {Number(selectedOrder.totalValue).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                            <td>R$ {Number(p.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
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
                        <td style={{ textAlign: 'center' }}>R$ {(c.price * c.cartQuantity).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
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
                    R$ {cart.reduce((a,c) => a + (c.price * c.cartQuantity), 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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

      {/* Profile Edit Modal */}
      {isProfileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Editar Meu Perfil</h2>
              <button className="close-btn" onClick={() => setIsProfileModalOpen(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label>Seu Nome</label>
              <input 
                type="text" 
                value={tempProfile.name}
                onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Sua Função</label>
              <select 
                value={tempProfile.role}
                onChange={(e) => setTempProfile({...tempProfile, role: e.target.value})}
              >
                <option value="Administrador">Administrador</option>
                <option value="Gerente">Gerente</option>
                <option value="Vendedor">Vendedor</option>
                <option value="Estoque">Estoque</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Nome da Empresa (Loja)</label>
              <input 
                type="text" 
                value={tempProfile.company}
                onChange={(e) => setTempProfile({...tempProfile, company: e.target.value})}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
              <label>CNPJ da Empresa</label>
              <input 
                type="text" 
                placeholder="00.000.000/0000-00"
                value={tempProfile.companyCnpj}
                maxLength={18}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 14) v = v.slice(0, 14);
                  v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                  v = v.replace(/(\d{4})(\d)/, '$1-$2');
                  setTempProfile({...tempProfile, companyCnpj: v});
                }}
              />
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsProfileModalOpen(false)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={async () => {
                const cpfClean = currentUser.cpf.replace(/\D/g, '');
                const userRef = doc(db, 'users', cpfClean);
                try {
                  await setDoc(userRef, {
                    name: tempProfile.name,
                    role: tempProfile.role,
                    company: tempProfile.company,
                    companyCnpj: tempProfile.companyCnpj,
                    cnpj: tempProfile.companyCnpj
                  }, { merge: true });
                  
                  setCurrentUser({
                    ...currentUser, 
                    name: tempProfile.name,
                    role: tempProfile.role,
                    company: tempProfile.company,
                    companyCnpj: tempProfile.companyCnpj,
                    cnpj: tempProfile.companyCnpj
                  });
                  setIsProfileModalOpen(false);
                  alert("Perfil atualizado com sucesso! Os produtos cadastrados a partir de agora estarão no novo CNPJ.");
                } catch (e) {
                  console.error(e);
                  alert("Erro ao atualizar o perfil. Tente novamente.");
                }
              }}>Salvar Alterações</button>
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
                      <option key={item.id} value={item.sku}>{item.name} (SKU: {item.sku} - R$ {Number(item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})</option>
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
                          <td>R$ {(p.quantity * p.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td><button type="button" onClick={() => handleRemoveProductFromDeal(i)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>X</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', marginTop: '1rem' }}>
                <span style={{ fontWeight: 'bold' }}>Valor Total da Oportunidade:</span>
                <span style={{ fontSize: '1.2rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>R$ {newDeal.value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                          <td>R$ {Number(p.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td><strong>R$ {(p.quantity * p.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 5. Resumo e Botões */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Impostos Aproximados (ICMS/PIS/COFINS): <strong style={{ color: 'var(--warning)' }}>R$ {(selectedNfeDeal.value * 0.18).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total dos Produtos:</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>R$ {Number(selectedNfeDeal.value).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.filter(d => d.nfeEmitted).length > 0 ? (
                    deals.filter(d => d.nfeEmitted).map(deal => (
                      <tr key={deal.id}>
                        <td>{new Date(deal.date).toLocaleDateString('pt-BR')}</td>
                        <td>{deal.client}</td>
                        <td><strong>R$ {Number(deal.value).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {deal.chaveAcesso ? deal.chaveAcesso.replace(/(\d{4})/g, '$1 ').trim() : '3526 0900 ... 5500 1000'}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', background: 'var(--success)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            Autorizada
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleViewPdf(deal)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Visualizar PDF">
                            📄
                          </button>
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

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2>📋 Cadastrar Despesa</h2>
              <button className="close-btn" onClick={() => setIsExpenseModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Descrição *</label>
                <input
                  className="input-primary"
                  placeholder="Ex: Fornecedor de Celulares, Conta de Luz..."
                  value={newExpense.description}
                  onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Valor (R$) *</label>
                <input
                  className="input-primary"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={newExpense.amount}
                  onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Vencimento</label>
                <input
                  className="input-primary"
                  type="date"
                  value={newExpense.dueDate}
                  onChange={e => setNewExpense(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Status</label>
                <select
                  className="input-primary"
                  value={newExpense.status}
                  onChange={e => setNewExpense(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Pendente">⏳ Pendente</option>
                  <option value="Pago">✅ Pago</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsExpenseModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Salvar Despesa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Atualizar Rastreamento</h2>
              <button className="close-btn" onClick={() => setTrackingModal(null)}>×</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', background: '#f5f5f5', padding: '1rem', borderRadius: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Histórico:</h4>
              {(() => {
                const deal = deals.find(d => d.id === trackingModal.dealId);
                const trackList = deal?.tracking || [];
                if(trackList.length === 0) return <p style={{ fontSize: '0.85rem', color: '#666' }}>Nenhuma atualização ainda.</p>;
                return trackList.map((t, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(t.date).toLocaleString('pt-BR')}</div>
                    <div style={{ fontSize: '0.85rem' }}>{t.msg}</div>
                  </div>
                ));
              })()}
            </div>

            <form onSubmit={handleAddTrackingMessage}>
              <div className="form-group">
                <label>Status Principal</label>
                <select 
                  value={trackingModal.status || 'Recebido'}
                  onChange={e => setTrackingModal({...trackingModal, status: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', marginBottom: '1rem', background: '#fff' }}
                >
                  <option value="Recebido">Recebido</option>
                  <option value="Preparando">Preparando</option>
                  <option value="Em Trânsito">Em Trânsito</option>
                  <option value="Entregue">Entregue</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nova Atualização (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Saiu para entrega..."
                  value={trackingModal.msg || ''}
                  onChange={e => setTrackingModal({...trackingModal, msg: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setTrackingModal(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Atualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Chat Modal (Admin) */}
      {internalChat && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-panel" style={{ width: '400px', maxWidth: '90%', display: 'flex', flexDirection: 'column', height: '600px' }}>
            <div className="modal-header">
              <h2>Atendimento (Protocolo #{internalChat.dealId.slice(-6)})</h2>
              <button className="close-btn" onClick={() => setInternalChat(null)}>×</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f5', padding: '1rem', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {(() => {
                const deal = deals.find(d => d.id === internalChat.dealId);
                const messages = deal?.messages || [];
                if (messages.length === 0) return <div style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>Nenhuma mensagem ainda.</div>;
                
                return messages.map((m, i) => {
                  const isAdmin = m.role === 'admin';
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        background: isAdmin ? '#dcf8c6' : '#fff', 
                        padding: '0.75rem', 
                        borderRadius: '0.5rem', 
                        maxWidth: '85%',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isAdmin ? '#00a650' : '#333', marginBottom: '0.25rem' }}>
                          {m.sender} {isAdmin ? '(Vendedor)' : '(Cliente)'}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#333', wordBreak: 'break-word' }}>
                          {m.text}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#999', textAlign: 'right', marginTop: '0.25rem' }}>
                          {new Date(m.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {["Olá, como posso ajudar?", "Seu pedido está em separação.", "Produto em rota de entrega!", "Obrigado pela compra!"].map((msg, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => setInternalChat({...internalChat, msg})}
                  style={{ background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', color: '#333' }}
                >
                  {msg}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendInternalMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Digite sua mensagem..." 
                value={internalChat.msg}
                onChange={e => setInternalChat({...internalChat, msg: e.target.value})}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '2rem', border: '1px solid #ccc' }}
              />
              <button type="submit" className="btn-primary" style={{ borderRadius: '2rem', padding: '0.75rem 1.5rem' }}>
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Birthday Message Modal */}
      {isBirthdayMessageModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Configurar Mensagem de Aniversário</h2>
              <button className="close-btn" onClick={() => setIsBirthdayMessageModalOpen(false)}>×</button>
            </div>
            <div className="form-group">
              <label>Desconto (%)</label>
              <input 
                type="number" 
                value={birthdayDiscount} 
                onChange={(e) => setBirthdayDiscount(e.target.value)} 
                min="1" max="100" 
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Template da Mensagem (WhatsApp)</label>
              <textarea 
                rows="4" 
                value={birthdayMessageTemplate}
                onChange={(e) => setBirthdayMessageTemplate(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                Variáveis disponíveis: {'{nome}'}, {'{cupom}'}, {'{desconto}'}
              </p>
            </div>
            <button className="btn-primary" onClick={() => setIsBirthdayMessageModalOpen(false)} style={{ width: '100%' }}>
              Salvar Modelo
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        textAlign: 'center',
        padding: '2rem 1rem',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        borderTop: '1px solid var(--glass-border)',
        width: '100%',
        background: 'transparent'
      }}>
        © 2026 Direitos Reservados GESTE
      </footer>
    </div>
  );
}

export default App;
