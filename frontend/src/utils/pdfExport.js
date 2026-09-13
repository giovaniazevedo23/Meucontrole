/**
 * pdfExport.js
 * 
 * Utilitário para exportar dados como arquivo PDF usando jsPDF + AutoTable.
 * 
 * Dependências: npm install jspdf jspdf-autotable
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exporta um array de objetos para um arquivo .pdf com tabela formatada.
 * 
 * @param {Array<Object>} data      - Dados a exportar
 * @param {string}        title     - Título do relatório
 * @param {string}        filename  - Nome do arquivo (sem extensão)
 * @param {Object}        options   - Opções extras (opcional)
 */
export function exportToPdf(data, title = 'Relatório', filename = 'relatorio', options = {}) {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ── Cabeçalho visual ──────────────────────────────────────
  doc.setFillColor(26, 115, 232); // azul Google
  doc.rect(0, 0, 297, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 14);

  // Data de geração no canto direito
  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${now}`, 297 - 14, 14, { align: 'right' });

  // ── Tabela ────────────────────────────────────────────────
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const val = row[h];
    if (val == null) return '';
    // Formata datas ISO para DD/MM/YYYY
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
      return new Date(val).toLocaleDateString('pt-BR');
    }
    // Formata números como moeda se o header contiver certas palavras
    if (typeof val === 'number' && /valor|price|total|vlr/i.test(h)) {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return String(val);
  }));

  autoTable(doc, {
    startY: 26,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [26, 115, 232],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [240, 246, 255],
    },
    styles: {
      cellPadding: 2,
      overflow: 'linebreak',
    },
    margin: { top: 26, left: 14, right: 14 },
    ...options,
  });

  // ── Rodapé com número de página ────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${totalPages}`,
      297 / 2, 205,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
}
