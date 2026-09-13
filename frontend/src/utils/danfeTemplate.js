export const generateDanfeHtml = (deal, currentUser, formData) => {
  const emitDate = new Date().toLocaleDateString('pt-BR');
  const emitTime = new Date().toLocaleTimeString('pt-BR');
  
  // Gerar chave de acesso fake (44 digitos) baseada no CNPJ
  const cleanCnpj = currentUser.cnpj ? currentUser.cnpj.replace(/\D/g, '').padStart(14, '0') : '00000000000000';
  const chaveAcesso = deal.chaveAcesso || ('352609' + cleanCnpj + '550010000001421' + Math.floor(100000000 + Math.random() * 900000000));
  const chaveFormatada = chaveAcesso.replace(/(\d{4})/g, '$1 ').trim();

  // Calcular Impostos Falsos para demonstração realística
  const valorTotal = Number(deal.value) || 0;
  const baseIcms = valorTotal;
  const valorIcms = valorTotal * 0.18; // 18% ICMS fake
  
  const productsRows = (deal.products || []).map(p => `
    <tr>
      <td class="text-center">${p.sku}</td>
      <td>${p.name}</td>
      <td class="text-center">${formData.ncm || '00000000'}</td>
      <td class="text-center">0102</td>
      <td class="text-center">${formData.cfop ? formData.cfop.split(' ')[0] : '5102'}</td>
      <td class="text-center">UN</td>
      <td class="text-right">${p.quantity}</td>
      <td class="text-right">${Number(p.price).toFixed(2)}</td>
      <td class="text-right">${(Number(p.quantity) * Number(p.price)).toFixed(2)}</td>
      <td class="text-right">${(Number(p.price) * Number(p.quantity)).toFixed(2)}</td>
      <td class="text-right">${(Number(p.price) * Number(p.quantity) * 0.18).toFixed(2)}</td>
      <td class="text-right">0.00</td>
      <td class="text-center">18.00</td>
      <td class="text-center">0.00</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>DANFE - ${deal.client}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: 'Arial', sans-serif; font-size: 10px; color: #000; background: #fff; margin: 0; padding: 0; }
    * { box-sizing: border-box; }
    
    .danfe { width: 100%; max-width: 190mm; margin: 0 auto; }
    
    .box { border: 1px solid #000; padding: 2px; position: relative; overflow: hidden; }
    .box-title { font-size: 6px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
    .box-value { font-size: 10px; font-weight: bold; min-height: 12px; }
    
    .row { display: flex; width: 100%; border-left: 1px solid #000; border-top: 1px solid #000; }
    .row.last { border-bottom: 1px solid #000; }
    .col { border-right: 1px solid #000; padding: 2px 4px; display: flex; flex-direction: column; justify-content: center; }
    
    .section-title { font-weight: bold; font-size: 8px; margin: 8px 0 2px 0; text-transform: uppercase; }
    
    /* Canhoto */
    .canhoto { border: 1px dashed #000; margin-bottom: 10px; display: flex; }
    .canhoto-left { width: 80%; padding: 4px; border-right: 1px solid #000; }
    .canhoto-right { width: 20%; padding: 4px; text-align: center; }
    
    /* Emitente Header */
    .header { border: 1px solid #000; display: flex; margin-bottom: 5px; }
    .h-col-1 { width: 45%; padding: 4px; border-right: 1px solid #000; text-align: center; }
    .h-col-2 { width: 15%; padding: 4px; border-right: 1px solid #000; text-align: center; }
    .h-col-3 { width: 40%; padding: 4px; }
    
    .table-container { width: 100%; border: 1px solid #000; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 2px 4px; font-size: 8px; }
    th { text-align: center; font-weight: bold; font-size: 7px; background-color: #f9f9f9; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    @media print {
      body { -webkit-print-color-adjust: exact; margin: 0; }
      .danfe { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="danfe">
    
    <!-- CANHOTO -->
    <div class="canhoto">
      <div class="canhoto-left">
        <div class="box-title">RECEBEMOS DE ${currentUser.company || 'Empresa Exemplo'} OS PRODUTOS/SERVIÇOS CONSTANTES NA NOTA FISCAL INDICADA AO LADO</div>
        <div style="display: flex; margin-top: 10px; gap: 10px;">
          <div style="flex:1; border-top: 1px solid #000; padding-top:2px;" class="box-title">DATA DE RECEBIMENTO</div>
          <div style="flex:3; border-top: 1px solid #000; padding-top:2px;" class="box-title">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</div>
        </div>
      </div>
      <div class="canhoto-right">
        <div class="box-value" style="font-size:14px; margin-top:10px;">NF-e</div>
        <div class="box-value">Nº 000.000.142</div>
        <div class="box-value">SÉRIE 001</div>
      </div>
    </div>
    
    <div style="text-align: center; border-bottom: 1px dashed #000; margin-bottom: 10px; height: 1px;"></div>

    <!-- CABEÇALHO DA NF -->
    <div class="header">
      <div class="h-col-1">
        <h2 style="margin: 0; font-size: 14px;">${currentUser.company || 'Empresa Exemplo'}</h2>
        <p style="margin: 2px 0; font-size: 10px; font-weight:normal;">Rua Exemplo Oficial, 123 - Centro<br/>São Paulo - SP, CEP: 01000-000<br/>Tel: (11) 9999-9999</p>
      </div>
      <div class="h-col-2">
        <h1 style="margin: 0; font-size: 18px;">DANFE</h1>
        <p style="margin: 2px 0; font-size: 8px; font-weight:normal;">Documento Auxiliar da Nota Fiscal Eletrônica</p>
        <div style="margin-top:5px; border: 1px solid #000; padding:2px;">
          <span style="font-size: 8px;">0 - Entrada<br/>1 - Saída</span>
          <span style="float:right; border:1px solid #000; padding:1px 4px; font-weight:bold;">1</span>
        </div>
        <div class="box-value" style="margin-top:4px;">Nº 000.000.142<br/>SÉRIE: 001<br/>Página 1 de 1</div>
      </div>
      <div class="h-col-3">
        <div class="box-title" style="margin-left:5px;">CONTROLE DO FISCO / CÓDIGO DE BARRAS</div>
        <div style="text-align: center; margin: 5px 0;">
          <svg id="barcode"></svg>
        </div>
        <div style="padding: 0 5px;">
          <div class="box-title">CHAVE DE ACESSO</div>
          <div class="box-value" style="font-size: 11px; text-align: center; letter-spacing: 0.5px;">${chaveFormatada}</div>
          <div class="box-title" style="text-align: center; margin-top:5px;">Consulta de autenticidade no portal nacional da NF-e<br/>www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora</div>
        </div>
      </div>
    </div>
    
    <div class="row last">
      <div class="col" style="flex: 2;"><span class="box-title">NATUREZA DA OPERAÇÃO</span><span class="box-value">Venda de mercadoria adquirida ou recebida de terceiros</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">PROTOCOLO DE AUTORIZAÇÃO DE USO</span><span class="box-value">135260900000001 - ${emitDate} ${emitTime}</span></div>
    </div>
    
    <div class="row last" style="margin-bottom: 5px; border-top:none;">
      <div class="col" style="flex: 1;"><span class="box-title">INSCRIÇÃO ESTADUAL</span><span class="box-value">111.222.333.444</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">INSCRIÇÃO ESTADUAL DO SUBST. TRIB.</span><span class="box-value"></span></div>
      <div class="col" style="flex: 1;"><span class="box-title">CNPJ</span><span class="box-value">${currentUser.cnpj || '00.000.000/0001-00'}</span></div>
    </div>

    <!-- DESTINATÁRIO -->
    <div class="section-title">DESTINATÁRIO / REMETENTE</div>
    <div class="row">
      <div class="col" style="flex: 3;"><span class="box-title">NOME / RAZÃO SOCIAL</span><span class="box-value">${deal.client}</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">CNPJ / CPF</span><span class="box-value">${formData.cnpjDestinatario || ''}</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">DATA DA EMISSÃO</span><span class="box-value">${emitDate}</span></div>
    </div>
    <div class="row">
      <div class="col" style="flex: 2;"><span class="box-title">ENDEREÇO</span><span class="box-value">${formData.enderecoDestinatario || ''}</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">BAIRRO / DISTRITO</span><span class="box-value">Centro</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">CEP</span><span class="box-value">${formData.cepDestinatario || ''}</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">DATA DA SAÍDA/ENTRADA</span><span class="box-value">${emitDate}</span></div>
    </div>
    <div class="row last">
      <div class="col" style="flex: 2;"><span class="box-title">MUNICÍPIO</span><span class="box-value">${formData.cidadeDestinatario || ''}</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">UF</span><span class="box-value">SP</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">FONE / FAX</span><span class="box-value">${deal.phone || ''}</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">INSCRIÇÃO ESTADUAL</span><span class="box-value"></span></div>
      <div class="col" style="flex: 1;"><span class="box-title">HORA DA SAÍDA</span><span class="box-value">${emitTime}</span></div>
    </div>

    <!-- IMPOSTOS -->
    <div class="section-title">CÁLCULO DO IMPOSTO</div>
    <div class="row">
      <div class="col" style="flex: 1;"><span class="box-title">BASE DE CÁLC. DO ICMS</span><span class="box-value text-right">${baseIcms.toFixed(2)}</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">VALOR DO ICMS</span><span class="box-value text-right">${valorIcms.toFixed(2)}</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">BASE DE CÁLC. ICMS ST</span><span class="box-value text-right">0,00</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">VALOR DO ICMS ST</span><span class="box-value text-right">0,00</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">VLR TOTAL DOS PRODUTOS</span><span class="box-value text-right">${valorTotal.toFixed(2)}</span></div>
    </div>
    <div class="row last">
      <div class="col" style="flex: 1;"><span class="box-title">VALOR DO FRETE</span><span class="box-value text-right">0,00</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">VALOR DO SEGURO</span><span class="box-value text-right">0,00</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">DESCONTO</span><span class="box-value text-right">0,00</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">OUTRAS DESP. ACESSÓRIAS</span><span class="box-value text-right">0,00</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">VALOR DO IPI</span><span class="box-value text-right">0,00</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">VALOR TOTAL DA NOTA</span><span class="box-value text-right">${valorTotal.toFixed(2)}</span></div>
    </div>

    <!-- TRANSPORTADOR -->
    <div class="section-title">TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
    <div class="row last" style="min-height: 40px;">
      <div class="col" style="flex: 1;"><span class="box-title">RAZÃO SOCIAL</span><span class="box-value">O MESMO</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">FRETE POR CONTA<br/>0-Remetente 1-Destinatário</span><span class="box-value">0</span></div>
      <div class="col" style="flex: 1;"><span class="box-title">CÓDIGO ANTT</span><span class="box-value"></span></div>
      <div class="col" style="flex: 1;"><span class="box-title">PLACA DO VEÍCULO</span><span class="box-value"></span></div>
      <div class="col" style="flex: 1;"><span class="box-title">UF</span><span class="box-value"></span></div>
      <div class="col" style="flex: 1;"><span class="box-title">CNPJ/CPF</span><span class="box-value"></span></div>
    </div>

    <!-- ITENS -->
    <div class="section-title">DADOS DO PRODUTO / SERVIÇOS</div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>CÓDIGO</th>
            <th>DESCRIÇÃO DO PRODUTO/SERVIÇO</th>
            <th>NCM/SH</th>
            <th>CST</th>
            <th>CFOP</th>
            <th>UN.</th>
            <th>QTD.</th>
            <th>VLR. UNIT.</th>
            <th>VLR. TOTAL</th>
            <th>BC ICMS</th>
            <th>VLR. ICMS</th>
            <th>VLR. IPI</th>
            <th>ALÍQ. ICMS</th>
            <th>ALÍQ. IPI</th>
          </tr>
        </thead>
        <tbody>
          ${productsRows}
        </tbody>
      </table>
    </div>
    
    <!-- DADOS ADICIONAIS -->
    <div class="section-title">DADOS ADICIONAIS</div>
    <div class="row last" style="min-height: 80px;">
      <div class="col" style="flex: 2; justify-content: flex-start;">
        <span class="box-title">INFORMAÇÕES COMPLEMENTARES</span>
        <span class="box-value" style="font-weight:normal; font-size:8px;">
          DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. <br/>
          NÃO GERA DIREITO A CRÉDITO FISCAL DE IPI. <br/>
          * NF-e Simulada para Fins Didáticos e Testes do Sistema.
        </span>
      </div>
      <div class="col" style="flex: 1; justify-content: flex-start;">
        <span class="box-title">RESERVADO AO FISCO</span>
        <span class="box-value"></span>
      </div>
    </div>
    
  </div>
  
  <script>
    // Gerar código de barras
    window.onload = function() {
      try {
        JsBarcode("#barcode", "${chaveAcesso}", {
          format: "CODE128C",
          displayValue: false,
          height: 35,
          width: 1.2,
          margin: 0
        });
      } catch (e) {
        console.error("Erro no código de barras", e);
      }
      
      // Pequeno timeout para garantir que o JSBarcode renderizou antes de abrir janela de impressão
      setTimeout(() => {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
  `;
};
