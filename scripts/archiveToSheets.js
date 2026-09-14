/**
 * SCRIPT COMPLETO - FIREBASE -> GOOGLE SHEETS (MOTOR DINÂMICO REVERSO)
 *
 * Este script pega as abas e, lendo os cabeçalhos (Linha 1), preenche os
 * dados correspondentes puxando diretamente do Firebase, ou seja:
 * "A planilha dita as regras das colunas, e o Firebase obedece preenchendo."
 */

const CONFIG = {
  projectId: "controle-1bc41",

  // Abas mapeadas dinamicamente
  abaDeals:       "Vendas Arquivadas",
  abaMovements:   "Movimentacoes Antigas",
  abaClientes:    "Clientes",
  abaCompras:     "Compras finalizadas",
  abaEstoque:     "Estoque atual",
  abaPedidos:     "Pedidos vitrine",
  
  // Abas especiais (Matrizes ou layouts diferenciados)
  abaFinancas:    "TABELAS DE FINANÇAS E CRESCIMENTO",
  abaVendas:      "Vendas e controle",
  abaIndicadores: "Indicadores"
};

// Mapeador Inteligente de Títulos de Colunas para Campos do Firebase
const DIRETORIO_DE_CAMPOS = {
  // Dados de Clientes / Usuários
  "NOME": ["name", "client"],
  "USUARIO": ["client"],
  "CLIENTE": ["client", "supplier"],
  "CPF": ["cpf", "customerCpf"],
  "N° TELEFONE": ["phone", "customerPhone"],
  "N° DE TELEFONE": ["phone", "customerPhone"],
  "N° DE TEEFONE": ["phone", "customerPhone"], // Corrigindo typo
  "TELEFONE": ["phone", "customerPhone"],
  "EMAIL": ["email"],
  "DATA DE NASCIMENTO": ["birthDate", "birthday"],
  "COMPRAS": ["totalPurchases", "purchases"],
  "ENDEREÇO": ["address", "fullAddress"],
  
  // Produtos / Vendas / Estoque
  "PRODUTO": ["name", "productName"],
  "SKU": ["sku"],
  "PREÇO UNIT.": ["price", "unitPrice"],
  "PREÇO": ["price", "value", "total"],
  "LOCALIZAÇÃO": ["location"],
  "QUANTIDADE": ["quantity", "qtdTotal"],
  "ITEM COMPRADO": ["itensStr"],
  "STATUS": ["stockStatus", "status"],
  
  // Pedidos e Metadados
  "DATA E HORA DO PEDIDO": ["date", "createdAt"],
  "DATA E HORA": ["date", "createdAt", "issueDate"],
  "DATA": ["dateStr"],
  "HORA": ["timeStr"],
  "VENDEDOR ESCOLHIDO": ["salesperson"],
  "VENDEDOR ESCLHIDO": ["salesperson"], // typo antigo
  "VENDEDOR": ["user", "salesperson"],
  "PRAZO DE ENTREGA": ["deliveryDays"],
  "STATUS DE ENTREGA": ["shippingStatus", "status"],
  "METODO DE PAGAMENTO": ["paymentMethod", "checkoutMethod"],
  "LOCAL DA COMPRA": ["localComp"],
  "LOCAL DE VENDA": ["localComp"],
  "TIPO": ["type"],
  "MOTIVO": ["reason"],
  "SITUAÇÃO": ["status"],
  "N° DO PROTOCOLO": ["id"],
  "CODIGO DA NOTA FISCAL": ["document"]
};

// ============================================================
//  WEB APP - doGet: serve os dados como JSON para o site
// ============================================================

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const nomeDaAba = params.aba || null;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultado = {};
    const todasAsAbas = Object.values(CONFIG);

    if (nomeDaAba) {
      resultado[nomeDaAba] = lerAba(ss, nomeDaAba);
    } else {
      todasAsAbas.forEach(aba => { resultado[aba] = lerAba(ss, aba); });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: resultado }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function lerAba(ss, nomeAba) {
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) return [];
  const dados = sheet.getDataRange().getValues();
  if (dados.length < 2) return [];
  const cabecalhos = dados[0];
  return dados.slice(1).map(linha => {
    const obj = {};
    cabecalhos.forEach((col, i) => {
      let valor = linha[i];
      if (valor instanceof Date) valor = valor.toISOString();
      obj[col] = valor;
    });
    return obj;
  });
}

// ============================================================
//  FUNCAO PRINCIPAL - chame esta no Acionador (cron)
// ============================================================

function arquivarDados() {
  Logger.log("=== Iniciando rotina de arquivamento ===");
  
  // Abas Dinâmicas Baseadas em Colunas
  processarAbaDinamica("deals", CONFIG.abaPedidos, doc => doc.source === 'vitrine');
  
  // Movimentacoes: arquiva e deleta APENAS as que tem mais de 30 dias, para não sumir do gráfico do painel ADM
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
  processarAbaDinamica("movements", CONFIG.abaMovements, doc => {
    if (!doc.date) return true;
    return new Date(doc.date) < trintaDiasAtras;
  }, true); 
  
  processarAbaDinamica("customers", CONFIG.abaClientes, doc => true);
  processarAbaDinamica("orders", CONFIG.abaCompras, doc => doc.status === 'Recebido', true);
  processarAbaDinamica("items", CONFIG.abaEstoque, doc => true);
  
  // Abas Especiais / Matrizes
  atualizarFinancasCrescimento();
  atualizarVendasControle();
  atualizarIndicadores();
  
  Logger.log("=== Rotina finalizada ===");
}

// ============================================================
//  O MOTOR DINÂMICO DE PROCESSAMENTO DE COLUNAS
// ============================================================

function processarAbaDinamica(collectionName, abaNome, filterFn, deletarApos = false) {
  const url = "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/" + collectionName;
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return;
    const data = JSON.parse(response.getContentText());
    if (!data.documents) return;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(abaNome);
    if (!sheet) { Logger.log("Aba nao encontrada: " + abaNome); return; }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (!headers || headers.length === 0) return;

    // Snapshot: limpa dados e reescreve caso nao seja log de append com delecao
    if (!deletarApos) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }

    data.documents.forEach(doc => {
      let fDoc = parseFirestoreDoc(doc);
      if (filterFn && !filterFn(fDoc)) return;
      
      // Enriquecimento de Dados Auxiliares (Para facilitar o de-para)
      fDoc = enriquecerDados(collectionName, fDoc);

      const novaLinha = [];
      headers.forEach(headerStr => {
        novaLinha.push(resolverCampo(fDoc, headerStr));
      });

      sheet.appendRow(novaLinha);

      if (deletarApos) {
        deletarDocumento(doc.name);
      }
    });

    Logger.log("Sincronizado [" + collectionName + "] -> Aba [" + abaNome + "]");
  } catch (e) { Logger.log("Erro " + abaNome + ": " + e.message); }
}

let cachedCustomers = null;
function getCustomersMap() {
  if (cachedCustomers) return cachedCustomers;
  const url = "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/customers";
  try {
    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const data = JSON.parse(resp.getContentText());
    const arr = (data.documents || []).map(d => parseFirestoreDoc(d));
    const map = {};
    arr.forEach(c => {
      if (c.cpf) map[c.cpf] = c;
      if (c.name) map[c.name.toLowerCase()] = c;
    });
    cachedCustomers = map;
    return map;
  } catch(e) { return {}; }
}

function enriquecerDados(col, doc) {
  // Prepara variaveis extras baseadas na colecao
  if (col === 'deals' || col === 'orders' || col === 'movements') {
    const cMap = getCustomersMap();
    let customer = null;
    if (doc.customerCpf && cMap[doc.customerCpf]) {
      customer = cMap[doc.customerCpf];
    } else if (doc.client && cMap[doc.client.toLowerCase()]) {
      customer = cMap[doc.client.toLowerCase()];
    }

    if (customer) {
      doc.email = doc.email || customer.email || '';
      doc.cpf = doc.cpf || doc.customerCpf || customer.cpf || '';
      doc.phone = doc.phone || customer.phone || '';
      doc.address = doc.address || [customer.address, customer.neighborhood, customer.city, customer.state, customer.zip].filter(Boolean).join(', ') || '';
      doc.birthDate = doc.birthDate || customer.birthDate || customer.birthday || '';
    }

    let prods = typeof doc.products === 'string' ? JSON.parse(doc.products || '[]') : (doc.products || []);
    doc.qtdTotal = prods.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
    doc.itensStr = prods.map(p => p.quantity + "x " + p.name + " (SKU: " + p.sku + ")").join(" | ");
    
    // Calcula prazo de entrega baseado nos produtos ou default de 3 dias
    doc.deliveryDays = doc.deliveryDays || prods.reduce((acc, p) => Math.max(acc, Number(p.deliveryDays || 3)), 3);
    
    // Define Local de Compra como Online para vitrine ou o location original
    doc.localComp = (doc.source === 'vitrine') ? 'Online' : (doc.location || 'Físico');
    
    try {
      const d = new Date(doc.date || doc.createdAt);
      doc.dateStr = d.toLocaleDateString('pt-BR');
      doc.timeStr = d.toLocaleTimeString('pt-BR');
    } catch(e) {}
  }

  if (col === 'items') {
    const qtd = Number(doc.quantity || 0);
    if (qtd <= 5) doc.stockStatus = "Estoque Crítico";
    else if (qtd <= 20) doc.stockStatus = "Estoque Baixo";
    else doc.stockStatus = "Em Estoque";
  }

  return doc;
}

function resolverCampo(fDoc, headerStr) {
  const headerUpper = headerStr.toString().trim().toUpperCase();
  
  // 1. Procura mapeamento manual no Dicionario
  const keysToTry = DIRETORIO_DE_CAMPOS[headerUpper] || [];
  for (let k of keysToTry) {
    if (fDoc[k] !== undefined && fDoc[k] !== null && fDoc[k] !== '') {
      return fDoc[k];
    }
  }

  // 2. Procura pelo nome exato do campo (em minusculo)
  const plainHeader = headerStr.toString().toLowerCase().trim();
  for (let key in fDoc) {
    if (key.toLowerCase() === plainHeader) {
      return fDoc[key];
    }
  }
  
  return '';
}


// ============================================================
//  NOVO: ATUALIZAR TABELAS DE FINANÇAS E CRESCIMENTO (MATRIZ)
// ============================================================

function atualizarFinancasCrescimento() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.abaFinancas);
    if (!sheet) { Logger.log("Aba de Financas nao encontrada!"); return; }

    const fetchCol = (col) => {
      const resp = UrlFetchApp.fetch(
        "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/" + col,
        { muteHttpExceptions: true }
      );
      const data = JSON.parse(resp.getContentText());
      return (data.documents || []).map(d => parseFirestoreDoc(d));
    };

    const expenses = fetchCol("expenses");
    const deals = fetchCol("deals");
    const orders = fetchCol("orders");
    const pageViews = fetchCol("pageViews");

    const mesesLabels = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const currentYear = new Date().getFullYear();

    const dadosMensais = mesesLabels.map((mes, index) => {
      let obj = { lucro: 0, despesas: 0, vendas: 0, pedidos: 0, clientes: 0, acessos: 0 };
      
      const isInMonth = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      };

      const mesExpenses = expenses.filter(e => isInMonth(e.dueDate) || isInMonth(e.date) || isInMonth(e.createdAt));
      obj.despesas = mesExpenses.reduce((sum, e) => sum + (Number(e.amount || e.value) || 0), 0);

      const mesDeals = deals.filter(d => d.status === 'Ganho' && (isInMonth(d.updatedAt) || isInMonth(d.date) || isInMonth(d.createdAt)));
      const mesOrders = orders.filter(o => isInMonth(o.date) || isInMonth(o.createdAt));
      obj.pedidos = mesOrders.length > 0 ? mesOrders.length : mesDeals.length;

      obj.vendas = mesDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      if (obj.vendas === 0) {
        obj.vendas = mesOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      }
      
      obj.lucro = obj.vendas - obj.despesas;

      const uniqueClients = new Set();
      mesOrders.forEach(o => { if (o.customerCpf) uniqueClients.add(o.customerCpf); else if(o.customerName) uniqueClients.add(o.customerName); });
      mesDeals.forEach(d => { if (d.customerCpf) uniqueClients.add(d.customerCpf); else if(d.customerName) uniqueClients.add(d.customerName); });
      obj.clientes = uniqueClients.size;

      const mesViews = pageViews.filter(v => isInMonth(v.timestamp));
      obj.acessos = mesViews.length;

      return obj;
    });

    // Encontrar e atualizar celulas baseadas nas labels.
    // Presumindo Estrutura:
    // Linha de Cabecalho (ex linha 1): [Vazio] | JAN | FEV | MAR | ...
    // Linha de Lucro: LUCRO | valor | valor | ...
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const firstCol = sheet.getRange(1, 1, Math.max(10, sheet.getLastRow()), 1).getValues().map(r => r[0].toString().toUpperCase().trim());

    const updateMatrixRow = (rowLabel, metricKey) => {
      const rowIndex = firstCol.findIndex(val => val.includes(rowLabel));
      if (rowIndex !== -1) {
        const rowToUpdate = [];
        headers.forEach((h, colIndex) => {
          if (colIndex === 0) return; // a label
          const mesIndex = mesesLabels.indexOf(h.toString().toUpperCase().trim());
          if (mesIndex !== -1) {
            sheet.getRange(rowIndex + 1, colIndex + 1).setValue(dadosMensais[mesIndex][metricKey]);
          }
        });
      }
    };

    updateMatrixRow("LUCRO", "lucro");
    updateMatrixRow("DESPESA", "despesas");
    updateMatrixRow("VENDA", "vendas");
    updateMatrixRow("PEDIDO", "pedidos");
    updateMatrixRow("CLIENTE", "clientes");
    updateMatrixRow("ACESS", "acessos"); // Corresponde a "Nº QUE ACESSARAM..."
    
    Logger.log("Finanças e Crescimento (Matriz) atualizada.");

  } catch (e) { Logger.log("Erro financas matriz: " + e.message); }
}


// ============================================================
//  FUNCOES LEGAIS ESPECIAIS (Indicadores e Controle)
// ============================================================
function atualizarVendasControle() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.abaVendas);
      if (!sheet) return;
  
      const fetchCol = (c) => JSON.parse(UrlFetchApp.fetch("https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/" + c, { muteHttpExceptions: true }).getContentText()).documents || [];
      const deals = fetchCol('deals').map(parseFirestoreDoc);
      const expenses = fetchCol('expenses').map(parseFirestoreDoc);
      const customers = fetchCol('customers').map(parseFirestoreDoc);
  
      const ganhos = deals.filter(d => d.status === 'Ganho');
      const contasPagar = expenses.filter(e => e.status === 'Pendente').reduce((s, e) => s + Number(e.amount || 0), 0);
      const salesGoal = 30500;
  
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  
      ganhos.forEach(d => {
        let totalPecasPedido = 0;
        let produtosPedidoStr = "";
        try {
          const prods = typeof d.products === 'string' ? JSON.parse(d.products) : (d.products || []);
          totalPecasPedido = prods.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
          produtosPedidoStr = prods.map(p => p.quantity + "x " + p.name).join(', ');
        } catch(e) {}
        
        const valorPedido = Number(d.value || 0);
        const percentualPedido = salesGoal > 0 ? ((valorPedido / salesGoal) * 100).toFixed(3) + '%' : '0%';
        
        // Pega aniversario do cliente especifico deste pedido
        let aniversariante = '';
        const clientName = d.client ? d.client.toLowerCase() : '';
        const clientCpf = d.customerCpf || d.cpf || '';
        const customerRow = customers.find(c => (c.cpf && c.cpf === clientCpf) || (c.name && c.name.toLowerCase() === clientName));
        
        if (customerRow) {
          const dtNasc = customerRow.birthDate || customerRow.birthday;
          if (dtNasc) {
            try {
              const dt = new Date(dtNasc + 'T12:00:00');
              aniversariante = dt.toLocaleDateString('pt-BR');
            } catch(e) {}
          }
        }
        
        sheet.appendRow([
          1,                  // QUANTIDADE DE VENDAS (1 pedido = 1 linha)
          contasPagar,        // CONTAS A PAGAR
          d.client || '',     // NOME DOS CLIENTES
          aniversariante,     // ANIVERSÁRIO
          salesGoal,          // METAS
          percentualPedido,   // PERCENTUAL DE METAS ATINGIDAS
          totalPecasPedido,   // PEÇAS VENDIDAS
          produtosPedidoStr   // NOME DOS PRODUTOS VENDIDOS
        ]);
      });
    } catch (e) { Logger.log("Erro vendas controle: " + e.message); }
}

function atualizarIndicadores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.abaIndicadores);
    if (!sheet) return;

    const items = JSON.parse(UrlFetchApp.fetch("https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/items", { muteHttpExceptions: true }).getContentText()).documents.map(parseFirestoreDoc);
    const deals = JSON.parse(UrlFetchApp.fetch("https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/deals", { muteHttpExceptions: true }).getContentText()).documents.map(parseFirestoreDoc).filter(d => d.status === 'Ganho');

    const vendidoPorSku = {};
    deals.forEach(d => {
      try {
        const prods = typeof d.products === 'string' ? JSON.parse(d.products) : (d.products || []);
        prods.forEach(p => {
          if (!vendidoPorSku[p.sku]) vendidoPorSku[p.sku] = { qtd: 0, valor: 0, nome: p.name };
          vendidoPorSku[p.sku].qtd   += Number(p.quantity || 0);
          vendidoPorSku[p.sku].valor += Number(p.quantity || 0) * Number(p.price || 0);
        });
      } catch(e) {}
    });

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();

    const skusSorted = Object.keys(vendidoPorSku).sort((a, b) => vendidoPorSku[b].qtd - vendidoPorSku[a].qtd);

    skusSorted.forEach(sku => {
      const v = vendidoPorSku[sku];
      const itemData = items.find(i => i.sku === sku);
      const estoqueAtual = itemData ? Number(itemData.quantity || 0) : 0;
      let acao = 'Estoque Adequado';
      if (estoqueAtual <= 5)  acao = 'REPOSICAO IMEDIATA';
      else if (estoqueAtual <= 20) acao = 'Monitorar Estoque';
      sheet.appendRow([v.nome, sku, v.qtd, v.valor, acao]);
    });

    items.forEach(item => {
      if (vendidoPorSku[item.sku]) return;
      sheet.appendRow([item.name || '', item.sku || '', 0, 0, 'Sem vendas']);
    });
  } catch (e) { Logger.log("Erro indicadores: " + e.message); }
}


// ============================================================
//  UTILITARIOS FIRESTORE
// ============================================================

function deletarDocumento(documentName) {
  UrlFetchApp.fetch("https://firestore.googleapis.com/v1/" + documentName, {
    method: "delete",
    muteHttpExceptions: true
  });
}

function parseFirestoreDoc(doc) {
  if (!doc) return {};
  const parsed = {};
  const fields = doc.fields;
  for (let key in fields) {
    parsed[key] = parseFirestoreValue(fields[key]);
  }
  return parsed;
}

function parseFirestoreValue(value) {
  if (value.hasOwnProperty("stringValue"))    return value.stringValue;
  if (value.hasOwnProperty("integerValue"))   return Number(value.integerValue);
  if (value.hasOwnProperty("doubleValue"))    return Number(value.doubleValue);
  if (value.hasOwnProperty("booleanValue"))   return value.booleanValue;
  if (value.hasOwnProperty("nullValue"))      return null;
  if (value.hasOwnProperty("timestampValue")) return value.timestampValue;

  if (value.hasOwnProperty("arrayValue")) {
    const items = (value.arrayValue.values || []);
    return items.map(function(v) { return parseFirestoreValue(v); });
  }

  if (value.hasOwnProperty("mapValue")) {
    const result = {};
    const fields = value.mapValue.fields || {};
    for (let k in fields) {
      result[k] = parseFirestoreValue(fields[k]);
    }
    return result;
  }
  return JSON.stringify(value);
}
