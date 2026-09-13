/**
 * SCRIPT DE ARQUIVAMENTO - FIREBASE PARA GOOGLE SHEETS
 * 
 * Este script foi projetado para rodar no Google Apps Script (dentro da sua Planilha do Google).
 * Ele fará o backup das Vendas (Ganho/Perdido) e Movimentações antigas, e em seguida apagará do Firebase.
 * 
 * INSTRUÇÕES:
 * 1. Abra sua Planilha do Google.
 * 2. Vá em Extensões > Apps Script.
 * 3. Cole este código no arquivo Code.gs e salve.
 * 4. Preencha as configurações abaixo com os dados do seu Firebase.
 * 5. Crie um Acionador (Relógio na barra lateral esquerda) para rodar a função "arquivarDados" todo dia de madrugada.
 */

const CONFIG = {
  // Preencha com o ID do seu projeto Firebase (ex: "controle-1bc41")
  projectId: "COLOQUE_AQUI_SEU_PROJECT_ID",
  
  // Nomes das abas da sua planilha (você precisa criar essas abas no Google Sheets)
  abaDeals: "Vendas Arquivadas",
  abaMovements: "Movimentacoes Antigas"
};

/**
 * Função principal que será engatilhada pelo cron job (Acionador)
 */
function arquivarDados() {
  Logger.log("Iniciando rotina de arquivamento...");
  
  arquivarDealsConcluidos();
  arquivarMovementsAntigos();
  
  Logger.log("Rotina finalizada.");
}

/**
 * Busca Deals (Vendas) marcadas como Ganho ou Perdido, salva no Sheets e deleta do Firebase.
 */
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
    if (!sheet) {
      Logger.log("Aba " + CONFIG.abaDeals + " não encontrada!");
      return;
    }
    
    data.documents.forEach(doc => {
      const deal = parseFirestoreDoc(doc);
      
      // Arquiva apenas se estiver Ganho ou Perdido
      if (deal.status === 'Ganho' || deal.status === 'Perdido') {
        // Grava na planilha (Data, Cliente, Vendedor, Valor, Status, Titulo)
        sheet.appendRow([
          deal.date || new Date().toISOString(),
          deal.client || '',
          deal.salesperson || '',
          deal.value || 0,
          deal.status || '',
          deal.title || ''
        ]);
        
        // Deleta do Firebase
        deletarDocumento(doc.name);
        Logger.log("Arquivado e deletado Deal: " + deal.client);
      }
    });
    
  } catch (e) {
    Logger.log("Erro na rotina de deals: " + e.message);
  }
}

/**
 * Busca Movements (Movimentações) antigas (ex: com mais de 30 dias), salva no Sheets e deleta do Firebase.
 */
function arquivarMovementsAntigos() {
  const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents/movements`;
  
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
      const movDate = new Date(mov.date);
      
      // Se for mais antigo que 30 dias
      if (movDate < trintaDiasAtras) {
        // Grava na planilha (Data, Produto/SKU, Tipo, Qtd, Motivo, Usuário)
        sheet.appendRow([
          mov.date || '',
          mov.sku || '',
          mov.type || '',
          mov.quantity || 0,
          mov.reason || '',
          mov.user || ''
        ]);
        
        // Deleta do Firebase
        deletarDocumento(doc.name);
        Logger.log("Arquivado e deletado Movement do SKU: " + mov.sku);
      }
    });
    
  } catch (e) {
    Logger.log("Erro na rotina de movements: " + e.message);
  }
}

/**
 * Utilitário: Deleta um documento específico no Firestore REST API
 */
function deletarDocumento(documentName) {
  const url = `https://firestore.googleapis.com/v1/${documentName}`;
  const options = {
    method: "delete",
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(url, options);
}

/**
 * Utilitário: Converte o formato bizarro do Firestore REST API para um objeto Javascript simples
 */
function parseFirestoreDoc(doc) {
  const parsed = {};
  const fields = doc.fields;
  for (let key in fields) {
    let value = fields[key];
    if (value.hasOwnProperty("stringValue")) parsed[key] = value.stringValue;
    else if (value.hasOwnProperty("integerValue")) parsed[key] = Number(value.integerValue);
    else if (value.hasOwnProperty("doubleValue")) parsed[key] = Number(value.doubleValue);
    else if (value.hasOwnProperty("booleanValue")) parsed[key] = value.booleanValue;
    else parsed[key] = JSON.stringify(value); // array ou map complexo (produtos do carrinho etc)
  }
  return parsed;
}
