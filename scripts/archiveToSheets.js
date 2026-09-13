/**
 * SCRIPT COMPLETO - FIREBASE → GOOGLE SHEETS + API PARA O SITE
 *
 * Colunas mapeadas diretamente das abas reais da planilha.
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
  const params = (e && e.parameter) ? e.parameter : {};
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
//  Colunas reais: DATA E HORA DO PEDIDO | USUARIO | EMAIL | CPF |
//    ENDEREÇO | N° DE TEEFONE | ITEN COMPRADO | VENDEOR ESCLHIDO |
//    PRAZO DE ENTREGA | QUANTIDADE | DESCRIÇAÕ DO ITEM |
//    METODO DE PAGAMENTO | LOCAL DA COMPRA
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
        itensStr = prods.map(p => p.quantity + "x " + p.name + " (SKU: " + p.sku + ")").join(" | ");
      } catch(err) { itensStr = String(deal.products || ''); }

      // Separa data e hora do timestamp ISO
      const dataHora  = deal.date || new Date().toISOString();
      const localComp = deal.address || deal.location || 'Online (Vitrine)';

      sheet.appendRow([
        dataHora,                                          // DATA E HORA DO PEDIDO
        deal.client         || '',                         // USUARIO
        deal.email          || '',                         // EMAIL
        deal.cpf            || '',                         // CPF
        deal.address        || '',                         // ENDEREÇO
        deal.phone          || '',                         // N° DE TEEFONE
        itensStr,                                          // ITEN COMPRADO
        deal.salesperson    || '',                         // VENDEOR ESCLHIDO
        deal.shippingStatus || deal.deliveryDays || '',    // PRAZO DE ENTREGA
        qtdTotal,                                          // QUANTIDADE
        deal.title          || '',                         // DESCRIÇAÕ DO ITEM
        deal.paymentMethod  || deal.checkoutMethod || '',  // METODO DE PAGAMENTO
        localComp                                          // LOCAL DA COMPRA
      ]);
      Logger.log("Pedido vitrine: " + deal.client);
    });

  } catch (e) { Logger.log("Erro pedidos vitrine: " + e.message); }
}

// ============================================================
//  2. MOVIMENTACOES ANTIGAS - movements > 30 dias (deleta)
//  Colunas reais: DATA | HORA | SKU | TIPO | QUAN | MOTIVO |
//                 VENDEDOR | CLIENTE | ENTRADA | SAIDA
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

    data.documents.forEach(doc => {
      const mov = parseFirestoreDoc(doc);

      // Separa data e hora
      let data_str = '';
      let hora_str = '';
      try {
        const d = new Date(mov.date);
        data_str = d.toLocaleDateString('pt-BR');
        hora_str = d.toLocaleTimeString('pt-BR');
      } catch(e) { data_str = mov.date || ''; }

      // ENTRADA e SAIDA como colunas separadas
      const isEntrada = mov.type === 'ENTRADA';
      const isSaida   = mov.type === 'SAIDA' || mov.type === 'PERDA';

      sheet.appendRow([
        data_str,                                   // DATA
        hora_str,                                   // HORA
        mov.sku      || '',                         // SKU
        mov.type     || '',                         // TIPO
        mov.quantity || 0,                          // QUAN
        mov.reason   || '',                         // MOTIVO
        mov.user     || '',                         // VENDEDOR
        mov.client   || '',                         // CLIENTE
        isEntrada ? (mov.quantity || 0) : '',       // ENTRADA
        isSaida   ? (mov.quantity || 0) : ''        // SAIDA
      ]);
      deletarDocumento(doc.name);
      Logger.log("Movement arquivado SKU: " + mov.sku);
    });

  } catch (e) { Logger.log("Erro movements: " + e.message); }
}

// ============================================================
//  3. CLIENTES - coleção customers (snapshot, sem deletar)
//  Colunas reais: NOME | CPF | N° TELEFONE | EMAIL |
//                 DATA DE NASCIMENTO | COMPRAS
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

    // Snapshot: limpa dados e reescreve
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();

    data.documents.forEach(doc => {
      const c = parseFirestoreDoc(doc);
      sheet.appendRow([
        c.name        || '', // NOME
        c.cpf         || '', // CPF
        c.phone       || '', // N° TELEFONE
        c.email       || '', // EMAIL
        c.birthDate   || c.birthday || '', // DATA DE NASCIMENTO
        c.totalPurchases || c.purchases || 0 // COMPRAS (qtd ou valor)
      ]);
    });
    Logger.log("Clientes atualizados: " + data.documents.length);

  } catch (e) { Logger.log("Erro clientes: " + e.message); }
}

// ============================================================
//  4. VENDAS E CONTROLE - resumo calculado (snapshot)
//  Colunas reais: QUANTIDAD DE VENDAS | CONTAS A PAGAR |
//    NOME DOS CLIENTES | ANIVERSÁRIO | METAS |
//    PERCENTUAL DE METAS ATINGIDAS | PEÇAS VENDIDAS |
//    NOEM DOS PRODUTOS VENDIDOS
// ============================================================

function atualizarVendasControle() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.abaVendas);
    if (!sheet) return;

    // Busca deals
    const dealsResp = UrlFetchApp.fetch(
      "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/deals",
      { muteHttpExceptions: true }
    );
    const dealsData = JSON.parse(dealsResp.getContentText());
    const deals = (dealsData.documents || []).map(d => parseFirestoreDoc(d));

    // Busca expenses (contas a pagar)
    const expResp = UrlFetchApp.fetch(
      "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/expenses",
      { muteHttpExceptions: true }
    );
    const expData = JSON.parse(expResp.getContentText());
    const expenses = (expData.documents || []).map(d => parseFirestoreDoc(d));

    // Calcula indicadores
    const ganhos         = deals.filter(d => d.status === 'Ganho');
    const qtdVendas      = ganhos.length;
    const contasPagar    = expenses.filter(e => e.status === 'Pendente').reduce((s, e) => s + Number(e.amount || 0), 0);
    const nomesClientes  = ganhos.map(d => d.client).filter(Boolean).join(', ');
    const salesGoal      = 30500; // meta padrão (ajuste conforme necessário)
    const totalVendas    = ganhos.reduce((s, d) => s + Number(d.value || 0), 0);
    const percentualMeta = salesGoal > 0 ? ((totalVendas / salesGoal) * 100).toFixed(1) + '%' : '0%';

    // Calcula pecas vendidas e produtos
    let totalPecas = 0;
    const produtosVendidosSet = new Set();
    ganhos.forEach(d => {
      try {
        const prods = typeof d.products === 'string' ? JSON.parse(d.products) : (d.products || []);
        prods.forEach(p => {
          totalPecas += Number(p.quantity || 0);
          produtosVendidosSet.add(p.name);
        });
      } catch(e) {}
    });
    const produtosVendidos = Array.from(produtosVendidosSet).join(', ');

    // Aniversariantes (clientes com birthday no mês atual)
    const mesAtual = new Date().getMonth() + 1;
    const custResp = UrlFetchApp.fetch(
      "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/customers",
      { muteHttpExceptions: true }
    );
    const custData = JSON.parse(custResp.getContentText());
    const customers = (custData.documents || []).map(d => parseFirestoreDoc(d));
    const aniversariantes = customers
      .filter(c => { try { return new Date(c.birthDate || c.birthday).getMonth() + 1 === mesAtual; } catch(e) { return false; } })
      .map(c => c.name)
      .join(', ');

    // Snapshot: limpa e escreve uma linha de resumo
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();

    sheet.appendRow([
      qtdVendas,        // QUANTIDAD DE VENDAS
      contasPagar,      // CONTAS A PAGAR (R$)
      nomesClientes,    // NOME DOS CLIENTES
      aniversariantes,  // ANIVERSÁRIO (aniversariantes do mes)
      salesGoal,        // METAS (R$)
      percentualMeta,   // PERCENTUAL DE METAS ATINGIDAS
      totalPecas,       // PEÇAS VENDIDAS
      produtosVendidos  // NOEM DOS PRODUTOS VENDIDOS
    ]);
    Logger.log("Vendas e controle atualizado.");

  } catch (e) { Logger.log("Erro vendas controle: " + e.message); }
}

// ============================================================
//  5. COMPRAS FINALIZADAS - orders Recebido (deleta)
//  Colunas reais: N° DO PROTOCOLO | CLIENTE | PRODUTO |
//    QUANTIDADE | METODO DE PAGAMENTO | LOCAL DE COMPRA |
//    DATA E HORA | VENDEDOR | CODIGO DA NOTA FISCAL
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
      let qtdTotal = 0;
      try {
        const prods = typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []);
        qtdTotal = prods.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
        prodStr = prods.map(p => p.quantity + "x " + p.name + " (SKU: " + p.sku + ")").join(" | ");
      } catch(err) { prodStr = String(order.products || ''); }

      sheet.appendRow([
        order.id          || '',                          // N° DO PROTOCOLO
        order.supplier    || '',                          // CLIENTE (fornecedor)
        prodStr,                                          // PRODUTO
        qtdTotal,                                         // QUANTIDADE
        order.paymentMethod || '',                        // METODO DE PAGAMENTO
        order.location    || 'Fornecedor',                // LOCAL DE COMPRA
        order.issueDate   || order.date || '',            // DATA E HORA
        order.salesperson || '',                          // VENDEDOR
        order.document    || ''                           // CODIGO DA NOTA FISCAL
      ]);
      deletarDocumento(doc.name);
      Logger.log("Compra finalizada: " + order.supplier);
    });

  } catch (e) { Logger.log("Erro compras: " + e.message); }
}

// ============================================================
//  6. ESTOQUE ATUAL - snapshot dos items (sem deletar)
//  Colunas reais: SKU | Produto | Preço Unit. | Localização |
//                 Quantidade | Status
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
      const status = qty <= 5 ? 'Estoque Critico' : qty <= 20 ? 'Estoque Baixo' : 'Em Estoque';

      sheet.appendRow([
        item.sku      || '', // SKU
        item.name     || '', // Produto
        item.price    || 0,  // Preço Unit.
        item.location || '', // Localização
        qty,                 // Quantidade
        status               // Status
      ]);
    });
    Logger.log("Estoque atual atualizado: " + data.documents.length + " SKUs.");

  } catch (e) { Logger.log("Erro estoque: " + e.message); }
}

// ============================================================
//  7. INDICADORES - produtos mais vendidos (snapshot)
//  Colunas reais: Produto | SKU | Quantidade VENDIDA |
//                 Valor Vendido (Saídas) | Ação Recomendada
// ============================================================

function atualizarIndicadores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.abaIndicadores);
    if (!sheet) return;

    // Busca items para cruzar com vendas
    const itemsResp = UrlFetchApp.fetch(
      "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/items",
      { muteHttpExceptions: true }
    );
    const itemsData = JSON.parse(itemsResp.getContentText());
    const items = (itemsData.documents || []).map(d => parseFirestoreDoc(d));

    // Busca deals (Ganho) para calcular vendas por produto
    const dealsResp = UrlFetchApp.fetch(
      "https://firestore.googleapis.com/v1/projects/" + CONFIG.projectId + "/databases/(default)/documents/deals",
      { muteHttpExceptions: true }
    );
    const dealsData = JSON.parse(dealsResp.getContentText());
    const deals = (dealsData.documents || []).map(d => parseFirestoreDoc(d)).filter(d => d.status === 'Ganho');

    // Agrega vendas por SKU
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

    // Snapshot: limpa e reescreve
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();

    // Escreve um item por linha, ordenado por mais vendido
    const skusSorted = Object.keys(vendidoPorSku).sort((a, b) => vendidoPorSku[b].qtd - vendidoPorSku[a].qtd);

    skusSorted.forEach(sku => {
      const v = vendidoPorSku[sku];
      const itemData = items.find(i => i.sku === sku);
      const estoqueAtual = itemData ? Number(itemData.quantity || 0) : 0;

      let acao = 'Estoque Adequado';
      if (estoqueAtual <= 5)  acao = 'REPOSICAO IMEDIATA';
      else if (estoqueAtual <= 20) acao = 'Monitorar Estoque';

      sheet.appendRow([
        v.nome,         // Produto
        sku,            // SKU
        v.qtd,          // Quantidade VENDIDA
        v.valor,        // Valor Vendido (Saidas)
        acao            // Ação Recomendada
      ]);
    });

    // Adiciona itens nao vendidos com estoque
    items.forEach(item => {
      if (vendidoPorSku[item.sku]) return; // ja foi listado
      const qty = Number(item.quantity || 0);
      sheet.appendRow([
        item.name  || '', // Produto
        item.sku   || '', // SKU
        0,                // Quantidade VENDIDA
        0,                // Valor Vendido
        'Sem vendas'      // Ação Recomendada
      ]);
    });

    Logger.log("Indicadores atualizados.");

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
    parsed[key] = parseFirestoreValue(fields[key]);
  }
  return parsed;
}

/**
 * Converte um valor do formato Firestore REST API para valor nativo JS.
 * Suporta: string, integer, double, boolean, array, map, null, timestamp.
 */
function parseFirestoreValue(value) {
  if (value.hasOwnProperty("stringValue"))    return value.stringValue;
  if (value.hasOwnProperty("integerValue"))   return Number(value.integerValue);
  if (value.hasOwnProperty("doubleValue"))    return Number(value.doubleValue);
  if (value.hasOwnProperty("booleanValue"))   return value.booleanValue;
  if (value.hasOwnProperty("nullValue"))      return null;
  if (value.hasOwnProperty("timestampValue")) return value.timestampValue;

  // Array: converte cada item recursivamente
  if (value.hasOwnProperty("arrayValue")) {
    const items = (value.arrayValue.values || []);
    return items.map(function(v) { return parseFirestoreValue(v); });
  }

  // Map: converte cada campo recursivamente
  if (value.hasOwnProperty("mapValue")) {
    const result = {};
    const fields = value.mapValue.fields || {};
    for (let k in fields) {
      result[k] = parseFirestoreValue(fields[k]);
    }
    return result;
  }

  // Fallback seguro
  return JSON.stringify(value);
}
