/**
 * SCRIPT COMPLETO - FIREBASE → GOOGLE SHEETS + API PARA O SITE
 *
 * FUNCIONALIDADES:
 * 1. Arquiva dados do Firebase no Google Sheets automaticamente (via Acionador/Cron)
 * 2. Serve os dados da planilha como API JSON para o seu site (via Web App)
 *
 * ABAS GERENCIADAS:
 *  - Pedidos vitrine       → deals onde source = 'vitrine'
 *  - Vendas Arquivadas     → deals Ganho ou Perdido (e deleta do Firebase)
 *  - Movimentacoes Antigas → movements com mais de 30 dias (e deleta)
 *  - Clientes              → colecao 'customers' do Firebase (snapshot)
 *  - Vendas e controle     → todos os deals (snapshot, sem deletar)
 *  - Compras finalizadas   → orders com status 'Recebido' (e deleta)
 *  - Estoque atual         → snapshot dos items (sem deletar)
 *  - Indicadores           → KPIs calculados (uma linha por execucao)
 *
 * INSTRUCOES:
 * 1. Extensoes > Apps Script > cole este codigo > salve (Ctrl+S)
 * 2. Implantar > Nova implantacao > Web App > Qualquer pessoa > Implantar
 * 3. Copie a URL e cole em sheetsReader.js (APPS_SCRIPT_URL)
 * 4. Crie Acionador: funcao "arquivarDados" todo dia de madrugada
 */

const CONFIG = {
  projectId: "controle-1bc41",

  abaDeals:       "Vendas Arquivadas",
  abaMovements:   "Movimentacoes Antigas",
  abaClientes:    "Clientes",
  abaVendas:      "Vendas e controle",
  abaCompras:     "Compras finalizadas",
  abaEstoque:     "Estoque atual",
  abaIndicadores: "Indicadores",
  abaPedidos:     "Pedidos vitrine"
};

// ============================================================
//  WEB APP - doGet: serve os dados como JSON para o site
// ============================================================

function doGet(e) {
  const params = e.parameter;
  const nomeDaAba = params.aba || null;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultado = {};
    const todasAsAbas = [
      CONFIG.abaDeals, CONFIG.abaMovements, CONFIG.abaClientes,
      CONFIG.abaVendas, CONFIG.abaCompras, CONFIG.abaEstoque,
      CONFIG.abaIndicadores, CONFIG.abaPedidos
    ];

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
  arquivarPedidosVitrine();
  arquivarDealsConcluidos();
  arquivarMovementsAntigos();
  arquivarClientes();
  atualizarVendasControle();
  arquivarComprasFinalizadas();
  atualizarEstoqueAtual();
  atualizarIndicadores();
  Logger.log("=== Rotina finalizada ===");
}

// ============================================================
//  1. PEDIDOS VITRINE
//  Colunas: DATA E HORA DO PEDIDO | USUARIO | EMAIL | CPF |
//           ENDERECO | N DE TELEFONE | ITEM COMPRADO |
//           VENDEDOR ESCOLHIDO | PRAZO DE ENTREGA |
//           QUANTIDADE | DESCRICAO DO ITEM | METODO DE PAGAMENTO
// ============================================================

function arquivarPedidosVitrine() {
  const url = "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/deals";
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return;
    const data = JSON.parse(response.getContentText());
    if (!data.documents) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaPedidos);
    if (!sheet) { Logger.log("Aba Pedidos vitrine nao encontrada!"); return; }

    data.documents.forEach(doc => {
      const deal = parseFirestoreDoc(doc);
      if (deal.source !== 'vitrine') return;

      let qtdTotal = 0;
      let itensStr = '';
      try {
        const prods = typeof deal.products === 'string' ? JSON.parse(deal.products) : (deal.products || []);
        qtdTotal = prods.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
        itensStr = prods.map(p => p.quantity + "x " + p.name + " (" + p.sku + ")").join(" | ");
      } catch(err) { itensStr = String(deal.products || ''); }

      sheet.appendRow([
        deal.date           || new Date().toISOString(), // DATA E HORA DO PEDIDO
        deal.client         || '',                        // USUARIO
        deal.email          || '',                        // EMAIL
        deal.cpf            || '',                        // CPF
        deal.address        || '',                        // ENDERECO
        deal.phone          || '',                        // N DE TELEFONE
        itensStr,                                         // ITEM COMPRADO
        deal.salesperson    || '',                        // VENDEDOR ESCOLHIDO
        deal.shippingStatus || deal.deliveryDays || '',   // PRAZO DE ENTREGA
        qtdTotal,                                         // QUANTIDADE
        deal.title          || '',                        // DESCRICAO DO ITEM
        deal.paymentMethod  || deal.checkoutMethod || ''  // METODO DE PAGAMENTO
      ]);
      Logger.log("Pedido vitrine registrado: " + deal.client);
    });

  } catch (e) { Logger.log("Erro pedidos vitrine: " + e.message); }
}

// ============================================================
//  2. VENDAS ARQUIVADAS - deals Ganho ou Perdido (deleta do Firebase)
//  Colunas: Data | Cliente | Telefone | Vendedor | Valor |
//           Status | Titulo | Produtos
// ============================================================

function arquivarDealsConcluidos() {
  const url = "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/deals";
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) { Logger.log("Erro deals: " + response.getContentText()); return; }
    const data = JSON.parse(response.getContentText());
    if (!data.documents) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaDeals);
    if (!sheet) { Logger.log("Aba Vendas Arquivadas nao encontrada!"); return; }

    data.documents.forEach(doc => {
      const deal = parseFirestoreDoc(doc);
      if (deal.status !== 'Ganho' && deal.status !== 'Perdido') return;

      let prodStr = '';
      try {
        const prods = typeof deal.products === 'string' ? JSON.parse(deal.products) : (deal.products || []);
        prodStr = prods.map(p => p.quantity + "x " + p.name).join(" | ");
      } catch(err) { prodStr = String(deal.products || ''); }

      sheet.appendRow([
        deal.date        || new Date().toISOString(), // Data
        deal.client      || '',                        // Cliente
        deal.phone       || '',                        // Telefone
        deal.salesperson || '',                        // Vendedor
        deal.value       || 0,                         // Valor
        deal.status      || '',                        // Status
        deal.title       || '',                        // Titulo
        prodStr                                        // Produtos
      ]);
      deletarDocumento(doc.name);
      Logger.log("Arquivado Deal: " + deal.client);
    });

  } catch (e) { Logger.log("Erro deals concluidos: " + e.message); }
}

// ============================================================
//  3. MOVIMENTACOES ANTIGAS - movements > 30 dias (deleta)
//  Colunas: Data | SKU | Produto | Tipo | Quantidade | Motivo | Usuario
// ============================================================

function arquivarMovementsAntigos() {
  const url = "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/movements";
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return;
    const data = JSON.parse(response.getContentText());
    if (!data.documents) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaMovements);
    if (!sheet) return;

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    data.documents.forEach(doc => {
      const mov = parseFirestoreDoc(doc);
      if (new Date(mov.date) >= trintaDiasAtras) return;

      sheet.appendRow([
        mov.date     || '', // Data
        mov.sku      || '', // SKU
        mov.name     || '', // Produto
        mov.type     || '', // Tipo (ENTRADA/SAIDA/PERDA)
        mov.quantity || 0,  // Quantidade
        mov.reason   || '', // Motivo
        mov.user     || ''  // Usuario
      ]);
      deletarDocumento(doc.name);
      Logger.log("Movement arquivado SKU: " + mov.sku);
    });

  } catch (e) { Logger.log("Erro movements: " + e.message); }
}

// ============================================================
//  4. CLIENTES - colecao 'customers' (snapshot, sem deletar)
//  Colunas: Nome | Email | CPF | Telefone | Empresa | CNPJ |
//           Cargo | Data de Cadastro
// ============================================================

function arquivarClientes() {
  const url = "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/customers";
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return;
    const data = JSON.parse(response.getContentText());
    if (!data.documents) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaClientes);
    if (!sheet) return;

    // Snapshot: limpa dados antigos e reescreve
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();

    data.documents.forEach(doc => {
      const c = parseFirestoreDoc(doc);
      sheet.appendRow([
        c.name        || '', // Nome
        c.email       || '', // Email
        c.cpf         || '', // CPF
        c.phone       || '', // Telefone
        c.company     || '', // Empresa
        c.companyCnpj || c.cnpj || '', // CNPJ
        c.role        || '', // Cargo
        c.createdAt   || ''  // Data de Cadastro
      ]);
    });
    Logger.log("Clientes atualizados: " + data.documents.length);

  } catch (e) { Logger.log("Erro clientes: " + e.message); }
}

// ============================================================
//  5. VENDAS E CONTROLE - todos os deals (snapshot, sem deletar)
//  Colunas: Data | Cliente | Telefone | Vendedor | Valor |
//           Status | Titulo | Produtos | Origem
// ============================================================

function atualizarVendasControle() {
  const url = "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/deals";
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return;
    const data = JSON.parse(response.getContentText());
    if (!data.documents) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaVendas);
    if (!sheet) return;

    // Snapshot: limpa e reescreve
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();

    data.documents.forEach(doc => {
      const deal = parseFirestoreDoc(doc);
      let prodStr = '';
      try {
        const prods = typeof deal.products === 'string' ? JSON.parse(deal.products) : (deal.products || []);
        prodStr = prods.map(p => p.quantity + "x " + p.name).join(" | ");
      } catch(err) { prodStr = String(deal.products || ''); }

      sheet.appendRow([
        deal.date        || '', // Data
        deal.client      || '', // Cliente
        deal.phone       || '', // Telefone
        deal.salesperson || '', // Vendedor
        deal.value       || 0,  // Valor
        deal.status      || '', // Status
        deal.title       || '', // Titulo
        prodStr,                // Produtos
        deal.source      || ''  // Origem (vitrine / manual)
      ]);
    });
    Logger.log("Vendas e controle atualizado: " + data.documents.length + " registros.");

  } catch (e) { Logger.log("Erro vendas controle: " + e.message); }
}

// ============================================================
//  6. COMPRAS FINALIZADAS - orders com status Recebido (deleta)
//  Colunas: Data | Fornecedor | CNPJ | Produtos | Valor Total |
//           Documento (NF) | Data Emissao | Status
// ============================================================

function arquivarComprasFinalizadas() {
  const url = "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/orders";
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return;
    const data = JSON.parse(response.getContentText());
    if (!data.documents) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaCompras);
    if (!sheet) return;

    data.documents.forEach(doc => {
      const order = parseFirestoreDoc(doc);
      if (order.status !== 'Recebido') return;

      let prodStr = '';
      try {
        const prods = typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []);
        prodStr = prods.map(p => p.quantity + "x " + p.name + " (" + p.sku + ")").join(" | ");
      } catch(err) { prodStr = String(order.products || ''); }

      sheet.appendRow([
        order.issueDate  || order.date || '', // Data
        order.supplier   || '',                // Fornecedor
        order.cnpj       || '',                // CNPJ
        prodStr,                               // Produtos
        order.totalValue || 0,                 // Valor Total
        order.document   || '',                // Documento (NF)
        order.issueDate  || '',                // Data Emissao
        order.status     || ''                 // Status
      ]);
      deletarDocumento(doc.name);
      Logger.log("Compra finalizada: " + order.supplier);
    });

  } catch (e) { Logger.log("Erro compras: " + e.message); }
}

// ============================================================
//  7. ESTOQUE ATUAL - snapshot dos items (sem deletar)
//  Colunas: SKU | Nome | Quantidade | Preco (R$) | Localizacao |
//           Categoria | Ultima Movimentacao | Status Estoque
// ============================================================

function atualizarEstoqueAtual() {
  const url = "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/items";
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return;
    const data = JSON.parse(response.getContentText());
    if (!data.documents) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaEstoque);
    if (!sheet) return;

    // Snapshot: limpa e reescreve
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();

    data.documents.forEach(doc => {
      const item = parseFirestoreDoc(doc);
      const qty = Number(item.quantity || 0);
      const statusEstoque = qty <= 5 ? 'Estoque Critico' : qty <= 20 ? 'Estoque Baixo' : 'Em Estoque';

      sheet.appendRow([
        item.sku              || '', // SKU
        item.name             || '', // Nome
        qty,                         // Quantidade
        item.price            || 0,  // Preco (R$)
        item.location         || '', // Localizacao
        item.category         || '', // Categoria
        item.lastMovementDate || '', // Ultima Movimentacao
        statusEstoque                // Status Estoque
      ]);
    });
    Logger.log("Estoque atual atualizado: " + data.documents.length + " SKUs.");

  } catch (e) { Logger.log("Erro estoque: " + e.message); }
}

// ============================================================
//  8. INDICADORES - KPIs calculados (adiciona 1 linha por execucao)
//  Colunas: Data/Hora | Total SKUs | Itens Fisicos | Estoque Baixo |
//           Estoque Critico | Vendas Ganho (R$) | Qtd Vendas |
//           Ticket Medio | Total Perdas (R$)
// ============================================================

function atualizarIndicadores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.abaIndicadores);
    if (!sheet) return;

    // Busca items
    const itemsResp = UrlFetchApp.fetch(
      "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/items",
      { muteHttpExceptions: true }
    );
    const itemsData = JSON.parse(itemsResp.getContentText());
    const items = (itemsData.documents || []).map(d => parseFirestoreDoc(d));

    const totalSKUs    = items.length;
    const totalFisicos = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
    const estoqueBaixo = items.filter(i => Number(i.quantity) > 5 && Number(i.quantity) <= 20).length;
    const estoqueCrit  = items.filter(i => Number(i.quantity) <= 5).length;

    // Busca deals
    const dealsResp = UrlFetchApp.fetch(
      "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/deals",
      { muteHttpExceptions: true }
    );
    const dealsData = JSON.parse(dealsResp.getContentText());
    const deals = (dealsData.documents || []).map(d => parseFirestoreDoc(d));

    const ganhos      = deals.filter(d => d.status === 'Ganho');
    const totalVendas = ganhos.reduce((s, d) => s + Number(d.value || 0), 0);
    const qtdVendas   = ganhos.length;
    const ticketMedio = qtdVendas > 0 ? (totalVendas / qtdVendas) : 0;
    const totalPerdas = deals.filter(d => d.status === 'Perdido').reduce((s, d) => s + Number(d.value || 0), 0);

    sheet.appendRow([
      new Date().toISOString(), // Data/Hora
      totalSKUs,                // Total SKUs
      totalFisicos,             // Itens Fisicos
      estoqueBaixo,             // Estoque Baixo
      estoqueCrit,              // Estoque Critico
      totalVendas,              // Vendas Ganho (R$)
      qtdVendas,                // Qtd Vendas
      ticketMedio,              // Ticket Medio
      totalPerdas               // Total Perdas (R$)
    ]);
    Logger.log("Indicadores gravados.");

  } catch (e) { Logger.log("Erro indicadores: " + e.message); }
}

// ============================================================
//  UTILITARIOS
// ============================================================

function deletarDocumento(documentName) {
  UrlFetchApp.fetch("https://firestore.googleapis.com/v1/" + documentName, {
    method: "delete",
    muteHttpExceptions: true
  });
}

function parseFirestoreDoc(doc) {
  const parsed = {};
  const fields = doc.fields;
  for (let key in fields) {
    const value = fields[key];
    if (value.hasOwnProperty("stringValue"))       parsed[key] = value.stringValue;
    else if (value.hasOwnProperty("integerValue")) parsed[key] = Number(value.integerValue);
    else if (value.hasOwnProperty("doubleValue"))  parsed[key] = Number(value.doubleValue);
    else if (value.hasOwnProperty("booleanValue")) parsed[key] = value.booleanValue;
    else parsed[key] = JSON.stringify(value);
  }
  return parsed;
}
