/**
 * sheetsReader.js
 * 
 * Utilitário para ler dados do Google Sheets via Apps Script Web App.
 * 
 * CONFIGURAÇÃO:
 * 1. No Google Apps Script, implante o script como Web App (Implantar > Nova implantação)
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 2. Copie a URL gerada e cole abaixo em APPS_SCRIPT_URL.
 */

// ⚠️ COLE AQUI A URL DO SEU APPS SCRIPT WEB APP DEPOIS DE IMPLANTAR
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzr6ykgTwHhO7r4k6c1VOcAhO5a7lzgIgc7a5Sn_ZjBddT262Lpp77AiXhIDuz4nGxS_Q/exec';

// Nomes das abas (devem ser iguais ao CONFIG no Apps Script)
export const SHEET_TABS = {
  VENDAS_ARQUIVADAS:   'Vendas Arquivadas',
  MOVIMENTACOES:       'Movimentacoes Antigas',
  CLIENTES:            'Clientes',
  VENDAS_CONTROLE:     'Vendas e controle',
  COMPRAS:             'Compras finalizadas',
  ESTOQUE:             'Estoque atual',
  INDICADORES:         'Indicadores',
  PEDIDOS:             'Pedidos vitrine',
};

/**
 * Busca os dados de UMA aba específica da planilha.
 * @param {string} nomeDaAba - nome da aba (use SHEET_TABS.VENDAS_ARQUIVADAS etc.)
 * @returns {Promise<Array>} - array de objetos com os dados da aba
 */
export async function fetchSheetTab(nomeDaAba) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'COLE_AQUI_A_URL_DO_APPS_SCRIPT') {
    console.warn('[sheetsReader] URL do Apps Script não configurada.');
    return [];
  }

  try {
    const url = `${APPS_SCRIPT_URL}?aba=${encodeURIComponent(nomeDaAba)}&t=${Date.now()}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.success) {
      console.error('[sheetsReader] Erro do servidor:', json.error);
      return [];
    }

    return json.data[nomeDaAba] || [];
  } catch (err) {
    console.error('[sheetsReader] Falha na requisição:', err);
    return [];
  }
}

/**
 * Busca os dados de TODAS as abas da planilha de uma só vez.
 * @returns {Promise<Object>} - objeto com { "Nome da Aba": [...dados] }
 */
export async function fetchAllSheets() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'COLE_AQUI_A_URL_DO_APPS_SCRIPT') {
    console.warn('[sheetsReader] URL do Apps Script não configurada.');
    return {};
  }

  try {
    const url = `${APPS_SCRIPT_URL}?t=${Date.now()}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.success) {
      console.error('[sheetsReader] Erro do servidor:', json.error);
      return {};
    }

    return json.data || {};
  } catch (err) {
    console.error('[sheetsReader] Falha na requisição:', err);
    return {};
  }
}
