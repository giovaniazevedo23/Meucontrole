/**
 * SCRIPT COMPLETO - FIREBASE → GOOGLE SHEETS + API PARA O SITE
 *
 * FUNCIONALIDADES:
 * 1. Arquiva dados do Firebase no Google Sheets automaticamente (via Acionador/Cron)
 * 2. Serve os dados da planilha como API JSON para o seu site (via Web App)
 *
 * INSTRUÇÕES DE CONFIGURAÇÃO:
 * 1. Abra sua Planilha do Google Sheets.
 * 2. Vá em Extensões > Apps Script.
 * 3. Substitua TODO o conteúdo do Code.gs por este código e salve (Ctrl+S).
 * 4. Implante como Web App:
 *    - Clique em "Implantar" > "Nova implantação"
 *    - Tipo: Web App
 *    - Executar como: Eu (sua conta Google)
 *    - Quem pode acessar: Qualquer pessoa
 *    - Clique em "Implantar" e copie a URL gerada
 * 5. Cole a URL no arquivo sheetsReader.js do seu projeto (variável APPS_SCRIPT_URL)
 * 6. Crie um Acionador para "arquivarDados" rodar todo dia de madrugada.
 */

const CONFIG = {
  projectId: "controle-1bc41",

  // Nomes exatos das abas na sua planilha
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
//  WEB APP — doGet: serve os dados como JSON para o seu site
// ============================================================

/**
 * Endpoint principal. O site chama:
 *   GET  <URL>?aba=Vendas Arquivadas
 * e recebe um JSON com os dados daquela aba.
 * Se não informar ?aba=, retorna TODAS as abas de uma vez.
 */
function doGet(e) {
  const params = e.parameter;
  const nomeDaAba = params.aba || null;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultado = {};

    if (nomeDaAba) {
      resultado[nomeDaAba] = lerAba(ss, nomeDaAba);
    } else {
      const todasAsAbas = [
        CONFIG.abaDeals,
        CONFIG.abaMovements,
        CONFIG.abaClientes,
        CONFIG.abaVendas,
        CONFIG.abaCompras,
        CONFIG.abaEstoque,
        CONFIG.abaIndicadores,
        CONFIG.abaPedidos
      ];
      todasAsAbas.forEach(aba => {
        resultado[aba] = lerAba(ss, aba);
      });
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

/**
 * Lê uma aba da planilha e retorna array de objetos usando a 1ª linha como cabeçalho.
 * Ex: [ { Data: "2024-01-01", Cliente: "João", Valor: 500 }, ... ]
 */
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
//  ARQUIVAMENTO — Firebase → Google Sheets (roda via Acionador)
// ============================================================

function arquivarDados() {
  Logger.log("Iniciando rotina de arquivamento...");
  arquivarDealsConcluidos();
  arquivarMovementsAntigos();
  Logger.log("Rotina finalizada.");
}

function arquivarDealsConcluidos() {
  const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents/deals`;

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      Logger.log("Erro ao buscar deals: " + response.getContentText());
      return;
    }

    const data = JSON.parse(response.getContentText());
    if (!data.documents) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaDeals);
    if (!sheet) { Logger.log("Aba " + CONFIG.abaDeals + " não encontrada!"); return; }

    garantirCabecalho(sheet, ["Data", "Cliente", "Telefone", "Vendedor", "Valor", "Status", "Titulo", "Produtos"]);

    data.documents.forEach(doc => {
      const deal = parseFirestoreDoc(doc);
      if (deal.status === 'Ganho' || deal.status === 'Perdido') {
        sheet.appendRow([
          deal.date        || new Date().toISOString(),
          deal.client      || '',
          deal.phone       || '',
          deal.salesperson || '',
          deal.value       || 0,
          deal.status      || '',
          deal.title       || '',
          deal.products    || ''
        ]);
        deletarDocumento(doc.name);
        Logger.log("Arquivado Deal: " + deal.client);
      }
    });

  } catch (e) {
    Logger.log("Erro na rotina de deals: " + e.message);
  }
}

function arquivarMovementsAntigos() {
  const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents/movements`;

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return;

    const data = JSON.parse(response.getContentText());
    if (!data.documents) return;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaMovements);
    if (!sheet) return;

    garantirCabecalho(sheet, ["Data", "SKU", "Produto", "Tipo", "Quantidade", "Motivo", "Usuario"]);

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    data.documents.forEach(doc => {
      const mov = parseFirestoreDoc(doc);
      const movDate = new Date(mov.date);
      if (movDate < trintaDiasAtras) {
        sheet.appendRow([
          mov.date     || '',
          mov.sku      || '',
          mov.name     || '',
          mov.type     || '',
          mov.quantity || 0,
          mov.reason   || '',
          mov.user     || ''
        ]);
        deletarDocumento(doc.name);
        Logger.log("Arquivado Movement SKU: " + mov.sku);
      }
    });

  } catch (e) {
    Logger.log("Erro na rotina de movements: " + e.message);
  }
}

// ============================================================
//  UTILITÁRIOS
// ============================================================

/**
 * Garante que a linha 1 tenha cabeçalhos com formatação visual.
 * Só escreve se a célula A1 estiver vazia.
 */
function garantirCabecalho(sheet, cabecalhos) {
  if (!sheet.getRange(1, 1).getValue()) {
    sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
    sheet.getRange(1, 1, 1, cabecalhos.length)
      .setFontWeight("bold")
      .setBackground("#1a73e8")
      .setFontColor("#ffffff");
  }
}

function deletarDocumento(documentName) {
  UrlFetchApp.fetch(`https://firestore.googleapis.com/v1/${documentName}`, {
    method: "delete",
    muteHttpExceptions: true
  });
}

function parseFirestoreDoc(doc) {
  const parsed = {};
  const fields = doc.fields;
  for (let key in fields) {
    const value = fields[key];
    if (value.hasOwnProperty("stringValue"))   parsed[key] = value.stringValue;
    else if (value.hasOwnProperty("integerValue")) parsed[key] = Number(value.integerValue);
    else if (value.hasOwnProperty("doubleValue"))  parsed[key] = Number(value.doubleValue);
    else if (value.hasOwnProperty("booleanValue")) parsed[key] = value.booleanValue;
    else parsed[key] = JSON.stringify(value);
  }
  return parsed;
}
