import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ name: '', cpf: '' });

  const [items, setItems] = useState(initialItems);
  const [movements, setMovements] = useState(initialMovements);
  const [activeTab, setActiveTab] = useState('estoque'); // 'estoque', 'movimentacoes', 'relatorios'
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  
  const [newItem, setNewItem] = useState({ name: '', sku: '', quantity: 0, location: '', price: 0 });
  const [adjustData, setAdjustData] = useState({ reason: '', type: 'AJUSTE', quantity: 0 });
  const [showNotifications, setShowNotifications] = useState(false);

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
    
    const delta = adjustData.type === 'SAIDA' ? -Math.abs(adjustData.quantity) : Number(adjustData.quantity);
    handleUpdateQuantity(adjustItem.id, delta, 'AJUSTE', adjustData.reason);
    
    setIsAdjustModalOpen(false);
    setAdjustItem(null);
    setAdjustData({ reason: '', type: 'AJUSTE', quantity: 0 });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.name && loginData.cpf) {
      setCurrentUser(loginData);
    }
  };

  if (!currentUser) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
        <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src={logo} alt="Logo Meu controle" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
            <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Bem-vindo ao Meu controle</h2>
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
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>CPF (Servirá como seu ID)</label>
              <input 
                type="text" 
                required 
                placeholder="000.000.000-00"
                value={loginData.cpf}
                onChange={e => setLoginData({...loginData, cpf: e.target.value})}
              />
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
      <header className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="Logo Meu controle" style={{ height: '45px', width: '45px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
          <h1 style={{ margin: 0 }}>Meu controle</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
          <div 
            style={{ position: 'relative', cursor: 'pointer', padding: '0.5rem' }} 
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
          <div className="user-profile">
            <span>{currentUser.name}</span>
          </div>
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
          <button className={activeTab === 'estoque' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('estoque')} style={activeTab !== 'estoque' ? { color: 'var(--text-primary)' } : {}}>
            📦 Posição Atual
          </button>
          <button className={activeTab === 'movimentacoes' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('movimentacoes')} style={activeTab !== 'movimentacoes' ? { color: 'var(--text-primary)' } : {}}>
            🔄 Histórico de Movimentações
          </button>
          <button className={activeTab === 'relatorios' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('relatorios')} style={activeTab !== 'relatorios' ? { color: 'var(--text-primary)' } : {}}>
            📈 Relatórios e Indicadores
          </button>
        </nav>

        {activeTab === 'estoque' && (
          <>
            <div className="toolbar glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '1rem' }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
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
                {movements.map(m => (
                  <tr key={m.id}>
                    <td>{new Date(m.date).toLocaleString('pt-BR')}</td>
                    <td>{m.sku}</td>
                    <td>
                      <span className={`status-badge ${m.type === 'ENTRADA' ? 'status-in-stock' : m.type === 'SAIDA' ? 'status-critical' : 'status-low-stock'}`}>
                        {m.type}
                      </span>
                    </td>
                    <td>{m.quantity}</td>
                    <td>{m.reason}</td>
                    <td>{m.user}</td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhuma movimentação registrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'relatorios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Curva ABC */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Curva ABC (Por Valor em Estoque)</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>SKU</th>
                      <th>Quantidade</th>
                      <th>Preço Unitário</th>
                      <th>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...items].sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price)).map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.sku}</td>
                        <td>{item.quantity}</td>
                        <td>R$ {Number(item.price).toFixed(2)}</td>
                        <td><strong>R$ {(item.quantity * item.price).toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Giro de Estoque */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Giro de Estoque (Tempo Parado)</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>SKU</th>
                      <th>Última Movimentação</th>
                      <th>Dias Parado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...items].sort((a, b) => new Date(a.lastMovementDate) - new Date(b.lastMovementDate)).map(item => {
                      const days = Math.floor((new Date() - new Date(item.lastMovementDate)) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.sku}</td>
                          <td>{new Date(item.lastMovementDate).toLocaleDateString('pt-BR')}</td>
                          <td>
                            <span style={{ color: days > 30 ? 'var(--danger)' : 'var(--text-primary)' }}>
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
                  <option value="SAIDA">Saída / Perda / Quebra</option>
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
    </div>
  );
}

export default App;
