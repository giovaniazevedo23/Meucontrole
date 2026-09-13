/**
 * excelExport.js
 * 
 * Utilitário para exportar dados como arquivo Excel (.xlsx) usando SheetJS.
 * 
 * Dependência: npm install xlsx
 */

import * as XLSX from 'xlsx';

/**
 * Exporta um array de objetos para um arquivo .xlsx.
 * 
 * @param {Array<Object>} data       - Dados a exportar (array de objetos)
 * @param {string}        filename   - Nome do arquivo (sem extensão)
 * @param {string}        sheetName  - Nome da aba dentro do Excel
 */
export function exportToExcel(data, filename = 'relatorio', sheetName = 'Dados') {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  // Cria a planilha a partir do array de objetos
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Ajusta largura das colunas automaticamente
  const colWidths = getColumnWidths(data);
  worksheet['!cols'] = colWidths;

  // Cria o workbook e adiciona a aba
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Faz o download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exporta múltiplas abas de uma vez em um único arquivo Excel.
 * 
 * @param {Object} sheetsData - Objeto { "Nome da Aba": [...dados] }
 * @param {string} filename   - Nome do arquivo (sem extensão)
 */
export function exportMultipleSheetsToExcel(sheetsData, filename = 'relatorio_completo') {
  const workbook = XLSX.utils.book_new();
  let hasData = false;

  Object.entries(sheetsData).forEach(([tabName, data]) => {
    if (data && data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      worksheet['!cols'] = getColumnWidths(data);
      // Limita nome da aba a 31 chars (limite do Excel)
      XLSX.utils.book_append_sheet(workbook, worksheet, tabName.substring(0, 31));
      hasData = true;
    }
  });

  if (!hasData) {
    alert('Não há dados para exportar.');
    return;
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Calcula a largura ideal de cada coluna com base no conteúdo.
 */
function getColumnWidths(data) {
  if (!data.length) return [];
  const headers = Object.keys(data[0]);
  return headers.map(header => {
    const maxLen = Math.max(
      header.length,
      ...data.map(row => String(row[header] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 50) }; // máximo 50 chars de largura
  });
}
