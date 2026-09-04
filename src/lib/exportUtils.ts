/**
 * Módulo de Exportación Institucional e Higiene Tipográfica
 * Ubicación: /src/lib/exportUtils.ts
 * 
 * Limpia la sintaxis markdown cruda (***, ###, ---, etc.) y genera 
 * documentos corporativos descargables en formato Word (.doc) y PDF.
 */

/**
 * Convierte Markdown crudo a HTML limpio sin símbolos visibles de formato
 */
export function formatMarkdownToCleanHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // 1. Reemplazar encabezados H1, H2, H3
  html = html.replace(/^### (.*$)/gim, '<h3 style="color:#4338ca; font-size:16px; font-weight:700; margin-top:16px; margin-bottom:8px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="color:#312e81; font-size:18px; font-weight:800; margin-top:20px; margin-bottom:10px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="color:#1e1b4b; font-size:22px; font-weight:900; margin-top:24px; margin-bottom:12px; border-bottom:2px solid #6366f1; padding-bottom:6px;">$1</h1>');

  // 2. Reemplazar negritas **texto** o __texto__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700; color:#ffffff;">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong style="font-weight:700; color:#ffffff;">$1</strong>');

  // 3. Reemplazar cursivas *texto* o _texto_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // 4. Reemplazar viñetas (- item o * item)
  html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li style="margin-bottom:6px; list-style-type:disc; margin-left:20px;">$1</li>');

  // 5. Reemplazar separadores horizizontales --- o ___
  html = html.replace(/^[\-\*_]{3,}\s*$/gim, '<hr style="border:0; border-top:1px solid #334155; margin:16px 0;" />');

  // 6. Convertir párrafos limpios
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<hr')) {
        return trimmed;
      }
      return `<p style="margin-bottom:12px; line-height:1.6; text-align:justify;">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');

  return html;
}

/**
 * Descarga el contenido en formato Microsoft Word (.doc) institucional
 */
export function downloadAsWord(filename: string, title: string, markdownContent: string) {
  const cleanBodyHtml = formatMarkdownToCleanHtml(markdownContent);

  const documentTemplate = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1e293b;
          margin: 1in;
        }
        .corporate-header {
          border-bottom: 2px solid #4338ca;
          padding-bottom: 8px;
          margin-bottom: 20px;
          font-size: 9pt;
          font-weight: bold;
          color: #4338ca;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        h1 { font-size: 18pt; color: #0f172a; margin-top: 10px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        h2 { font-size: 14pt; color: #1e1b4b; margin-top: 18px; margin-bottom: 8px; }
        h3 { font-size: 12pt; color: #312e81; margin-top: 14px; margin-bottom: 6px; }
        p { margin-bottom: 10px; text-align: justify; }
        ul { margin-bottom: 10px; padding-left: 20px; }
        li { margin-bottom: 4px; }
        strong { color: #0f172a; font-weight: bold; }
        .corporate-footer {
          margin-top: 40px;
          border-top: 1px solid #cbd5e1;
          padding-top: 10px;
          font-size: 8pt;
          color: #64748b;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="corporate-header">
        NEXATIVA NEWS — INFORME EJECUTIVO INSTITUCIONAL & ESTRATÉGICO
      </div>
      <h1>${title}</h1>
      <div>${cleanBodyHtml}</div>
      <div class="corporate-footer">
        Municipalidad de Ituzaingó | Susybot - Atención al Vecino e Innovación Urbana (ituzaingo.gob.ar)<br/>
        Documento confidencial para uso institucional reservado.
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', documentTemplate], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `${filename.toLowerCase().replace(/[^a-z0-9]/g, '_')}_nexativa.doc`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}

/**
 * Abre ventana de impresión profesional/PDF listo para guardar
 */
export function exportToPdf(title: string, markdownContent: string) {
  const cleanBodyHtml = formatMarkdownToCleanHtml(markdownContent);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Nexativa News</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            padding: 40px;
            color: #0f172a;
            line-height: 1.6;
          }
          .corporate-header {
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 12px;
            margin-bottom: 24px;
            font-size: 11px;
            font-weight: bold;
            color: #4338ca;
            letter-spacing: 1px;
            display: flex;
            justify-content: space-between;
          }
          h1 { color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; font-size: 20px; }
          h2 { color: #312e81; font-size: 15px; margin-top: 20px; }
          h3 { color: #4338ca; font-size: 13px; margin-top: 15px; }
          p { text-align: justify; margin-bottom: 12px; font-size: 12px; }
          ul { margin-bottom: 12px; padding-left: 20px; }
          li { margin-bottom: 4px; font-size: 12px; }
          strong { font-weight: bold; color: #000; }
          .corporate-footer {
            margin-top: 40px;
            border-top: 1px solid #cbd5e1;
            padding-top: 12px;
            font-size: 9px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="corporate-header">
          <span>NEXATIVA NEWS — DOCUMENTO EJECUTIVO DE EXPANSIÓN</span>
          <span>${new Date().toLocaleDateString('es-AR')}</span>
        </div>
        <h1>${title}</h1>
        <div>${cleanBodyHtml}</div>
        <div class="corporate-footer">
          Municipalidad de Ituzaingó | ituzaingo.gob.ar — Copia Institucional Verificada
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * ========================================================================
 * 🎓 EXPORTADOR PROFESIONAL Y LIMPIO PARA SUSYBOT (WORD & PDF IMPRIMIBLE)
 * ========================================================================
 * Elimina emojis, íconos y marcas de chat. Justifica párrafos y convierte
 * tablas markdown en tablas HTML estilizadas para evaluación o entrega formal.
 */
export function formatNoraCleanDocumentHtml(markdown: string): string {
  if (!markdown) return "";

  // 1. Eliminar emojis y caracteres gráficos innecesarios
  let text = markdown
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    // Eliminar sintaxis de imágenes markdown ![caption](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Reemplazar enlaces markdown [texto](url) por solo "texto"
    .replace(/\[(.*?)\]\(https?:\/\/[^\s)]+\)/g, '$1')
    // Eliminar bloques de código de depuración si los hubiera
    .replace(/```[\s\S]*?```/g, '');

  // 2. Procesar tablas de Markdown (| col1 | col2 |)
  const tableRegex = /(\|.*\|\r?\n\|[\s\-:|]+\|\r?\n(?:\|.*\|\r?\n?)+)/g;
  text = text.replace(tableRegex, (match) => {
    const lines = match.trim().split("\n");
    if (lines.length < 2) return match;

    const headers = lines[0].split("|").filter(c => c.trim().length > 0).map(c => c.trim());
    const dataRows = lines.slice(2).map(line => line.split("|").filter(c => c.trim().length > 0).map(c => c.trim()));

    let tableHtml = '<table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:10.5pt;">';
    tableHtml += '<thead><tr style="background-color:#f1f5f9; border-bottom:2px solid #334155;">';
    headers.forEach(h => {
      tableHtml += `<th style="border:1px solid #cbd5e1; padding:8px 10px; text-align:left; font-weight:bold; color:#0f172a;">${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    dataRows.forEach((row, rIdx) => {
      const bg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      tableHtml += `<tr style="background-color:${bg};">`;
      row.forEach(cell => {
        tableHtml += `<td style="border:1px solid #cbd5e1; padding:8px 10px; color:#334155; text-align:justify;">${cell}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    return tableHtml;
  });

  // 3. Encabezados H1, H2, H3
  text = text.replace(/^### (.*$)/gim, '<h3 style="color:#1e293b; font-size:13pt; font-weight:bold; margin-top:16px; margin-bottom:6px;">$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2 style="color:#0f172a; font-size:15pt; font-weight:bold; margin-top:20px; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1 style="color:#020617; font-size:18pt; font-weight:bold; margin-top:24px; margin-bottom:12px; text-align:center; border-bottom:2px solid #0284c7; padding-bottom:6px;">$1</h1>');

  // 4. Negritas y Cursivas
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // 5. Viñetas
  text = text.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li style="margin-bottom:4px; margin-left:24px; text-align:justify;">$1</li>');

  // 6. Párrafos Justificados
  const parts = text.split(/\n\n+/);
  const cleanHtml = parts.map(p => {
    const trimmed = p.trim();
    if (trimmed.startsWith('<h') || trimmed.startsWith('<table') || trimmed.startsWith('<li') || trimmed.startsWith('<hr')) {
      return trimmed;
    }
    return `<p style="margin-bottom:10px; line-height:1.6; text-align:justify; color:#1e293b;">${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  return cleanHtml;
}

/**
 * Descarga el contenido en formato Microsoft Word (.doc) limpio y formal
 */
export function exportNoraCleanWord(title: string, markdownContent: string) {
  const cleanBodyHtml = formatNoraCleanDocumentHtml(markdownContent);
  const cleanTitle = title.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim() || "Documento Susybot";

  const documentTemplate = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${cleanTitle}</title>
      <style>
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #0f172a;
          margin: 1in;
        }
        .doc-header {
          border-bottom: 2px solid #0284c7;
          padding-bottom: 6px;
          margin-bottom: 24px;
          font-size: 9pt;
          font-weight: bold;
          color: #0369a1;
          display: flex;
          justify-content: space-between;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        h1 { font-size: 18pt; color: #020617; margin-top: 14px; margin-bottom: 12px; text-align: center; }
        h2 { font-size: 14pt; color: #0f172a; margin-top: 18px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        h3 { font-size: 12pt; color: #1e293b; margin-top: 14px; margin-bottom: 6px; }
        p { margin-bottom: 10px; text-align: justify; line-height: 1.6; }
        ul, ol { margin-bottom: 10px; padding-left: 24px; }
        li { margin-bottom: 4px; text-align: justify; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { border: 1px solid #94a3b8; padding: 8px; background-color: #f1f5f9; font-weight: bold; text-align: left; }
        td { border: 1px solid #cbd5e1; padding: 8px; }
        .doc-footer {
          margin-top: 40px;
          border-top: 1px solid #cbd5e1;
          padding-top: 10px;
          font-size: 8pt;
          color: #64748b;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="doc-header">
        <span>SUSYBOT AI — INFORME INSTITUCIONAL & ACADÉMICO</span>
        <span>${new Date().toLocaleDateString('es-AR')}</span>
      </div>
      <div>${cleanBodyHtml}</div>
      <div class="doc-disclaimer" style="margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 7.5pt; color: #64748b; text-align: justify; line-height: 1.4;">
        <strong>Nota de exención de responsabilidad:</strong> Este documento fue asistido y estructurado por el motor agéntico soberano Susybot (MyJNexoraVisual). Su contenido tiene fines exclusivamente académicos, pedagógicos o de planificación organizativa interna. No constituye un dictamen profesional vinculante ni una certificación legal o médica oficial.
      </div>
      <div class="doc-footer">
        Documento generado por Susybot AI • Desarrollada por MyJNexoraVisual (Ituzaingó, Corrientes) • Copia Formal Verificada
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', documentTemplate], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `${cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.doc`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}

/**
 * Abre ventana de impresión profesional o guardado en PDF justificado y limpio
 */
export function exportNoraCleanPdf(title: string, markdownContent: string) {
  const cleanBodyHtml = formatNoraCleanDocumentHtml(markdownContent);
  const cleanTitle = title.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim() || "Documento Susybot";

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${cleanTitle} - Susybot</title>
        <style>
          @page {
            size: A4;
            margin: 20mm 20mm 20mm 20mm;
          }
          body {
            font-family: 'Times New Roman', Times, serif, Arial;
            padding: 20px;
            color: #0f172a;
            line-height: 1.6;
            font-size: 11pt;
            background: #ffffff;
          }
          .doc-header {
            border-bottom: 2px solid #0284c7;
            padding-bottom: 8px;
            margin-bottom: 24px;
            font-size: 9pt;
            font-weight: bold;
            color: #0369a1;
            display: flex;
            justify-content: space-between;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          h1 { color: #020617; font-size: 17pt; margin-top: 14px; margin-bottom: 12px; text-align: center; }
          h2 { color: #0f172a; font-size: 13pt; margin-top: 18px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          h3 { color: #1e293b; font-size: 11.5pt; margin-top: 14px; margin-bottom: 6px; }
          p { text-align: justify; margin-bottom: 10px; line-height: 1.6; }
          ul, ol { margin-bottom: 10px; padding-left: 24px; }
          li { margin-bottom: 4px; text-align: justify; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
          th { border: 1px solid #475569; padding: 6px 8px; background-color: #f1f5f9; font-weight: bold; text-align: left; color: #0f172a; }
          td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: justify; }
          .doc-disclaimer {
            margin-top: 30px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            font-size: 7.5pt;
            color: #64748b;
            text-align: justify;
            line-height: 1.4;
          }
          .doc-footer {
            margin-top: 16px;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
            font-size: 8pt;
            color: #64748b;
            text-align: center;
          }
          @media print {
            body { padding: 0; }
            .doc-header { margin-bottom: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="doc-header">
          <span>SUSYBOT AI — INFORME INSTITUCIONAL & ACADÉMICO</span>
          <span>${new Date().toLocaleDateString('es-AR')}</span>
        </div>
        <div>${cleanBodyHtml}</div>
        <div class="doc-disclaimer">
          <strong>Nota de exención de responsabilidad:</strong> Este documento fue asistido y estructurado por el motor agéntico soberano Susybot (MyJNexoraVisual). Su contenido tiene fines exclusivamente académicos, pedagógicos o de planificación organizativa interna. No constituye un dictamen profesional vinculante ni una certificación legal o médica oficial.
        </div>
        <div class="doc-footer">
          Documento generado por Susybot AI (MyJNexoraVisual) • Ituzaingó, Corrientes • Copia Formal para Evaluación / Impresión
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * ========================================================================
 * 📊 EXPORTADOR INSTITUCIONAL A PRESENTACIONES POWERPOINT (.PPTX)
 * ========================================================================
 * Parsea bloques de markdown estructurados, títulos, viñetas y tablas,
 * generando un archivo .pptx nativo widescreen 16:9 con diseño corporativo elegante a Costo $0.
 */
export async function exportNoraCleanPptx(title: string, markdownContent: string) {
  if (!markdownContent) return;

  const pptxModule = await import("pptxgenjs");
  const pptxgen = pptxModule.default || pptxModule;
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Susybot AI - MyJNexoraVisual";
  pptx.company = "MyJNexoraVisual";

  // Paleta corporativa institucional
  const COLOR_BG = "0F172A";       // Slate 900
  const COLOR_CARD = "1E293B";     // Slate 800
  const COLOR_PRIMARY = "38BDF8";  // Sky 400
  const COLOR_ACCENT = "818CF8";   // Indigo 400
  const COLOR_TEXT = "F8FAFC";     // Slate 50
  const COLOR_MUTED = "64748B";    // Slate 500

  // Limpiar texto base
  const rawText = markdownContent
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(https?:\/\/[^\s)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .trim();

  const cleanTitle = (title || "Presentación Susybot")
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .replace(/[#*`_]/g, '')
    .trim() || "Presentación Susybot";

  // 1. DIAPOSITIVA DE PORTADA (SLIDE 1)
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: COLOR_BG };

  // Barra decorativa superior
  coverSlide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 0.8,
    w: 1.2,
    h: 0.08,
    fill: { color: COLOR_PRIMARY },
    line: { color: COLOR_PRIMARY }
  });

  // Título de Portada
  coverSlide.addText(cleanTitle, {
    x: 0.8,
    y: 1.4,
    w: 11.5,
    h: 2.2,
    fontSize: 28,
    fontFace: "Arial",
    color: COLOR_TEXT,
    bold: true,
    valign: "top"
  });

  // Subtítulo
  coverSlide.addText("Estructura Ejecutiva & Pedagógica generada por Susybot AI", {
    x: 0.8,
    y: 4.2,
    w: 11.5,
    h: 0.6,
    fontSize: 14,
    fontFace: "Arial",
    color: COLOR_ACCENT,
    bold: true
  });

  // Metadatos inferiores
  coverSlide.addText(`MyJNexoraVisual • Ituzaingó, Corrientes | ${new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: 0.8,
    y: 6.0,
    w: 11.5,
    h: 0.4,
    fontSize: 11,
    fontFace: "Arial",
    color: COLOR_MUTED
  });

  // 2. PARSEO DE SECCIONES PARA DIAPOSITIVAS DE CONTENIDO
  const rawSections: { title: string; bullets: string[] }[] = [];
  const lines = rawText.split("\n");

  let currentSectionTitle = "Resumen Ejecutivo";
  let currentBullets: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isH1 = line.startsWith("# ");
    const isH2 = line.startsWith("## ");
    const isH3 = line.startsWith("### ");
    const isNumberedHeader = /^\*{0,2}\d+[\.\)]\s+([^\*]+)\*{0,2}/.test(line) && line.length < 90;

    if (isH1 || isH2 || isH3 || isNumberedHeader) {
      if (currentBullets.length > 0) {
        rawSections.push({ title: currentSectionTitle, bullets: currentBullets });
        currentBullets = [];
      }
      currentSectionTitle = line
        .replace(/^#{1,3}\s+/, '')
        .replace(/^\*{0,2}\d+[\.\)]\s+/, '')
        .replace(/[\*\_`]/g, '')
        .trim();
    } else {
      const cleanBullet = line
        .replace(/^[\-\*\•]\s+/, '')
        .replace(/^\d+[\.\)]\s+/, '')
        .replace(/[\*\_`]/g, '')
        .trim();

      if (cleanBullet.length > 0) {
        if (cleanBullet.length > 280) {
          const sentences = cleanBullet.split(/(?<=[.?!])\s+/);
          sentences.forEach(s => {
            if (s.trim().length > 5) currentBullets.push(s.trim());
          });
        } else {
          currentBullets.push(cleanBullet);
        }
      }
    }
  }

  if (currentBullets.length > 0) {
    rawSections.push({ title: currentSectionTitle, bullets: currentBullets });
  }

  if (rawSections.length === 0) {
    rawSections.push({
      title: "Desarrollo del Contenido",
      bullets: [cleanTitle]
    });
  }

  // 3. GENERAR CADA DIAPOSITIVA DE CONTENIDO
  let slideCounter = 2;
  rawSections.forEach((section) => {
    const chunkSize = 5;
    for (let c = 0; c < section.bullets.length; c += chunkSize) {
      const bulletChunk = section.bullets.slice(c, c + chunkSize);
      const partSuffix = section.bullets.length > chunkSize ? ` (Parte ${Math.floor(c / chunkSize) + 1})` : "";
      
      const slide = pptx.addSlide();
      slide.background = { color: COLOR_BG };

      // Encabezado
      slide.addText((section.title + partSuffix).slice(0, 75), {
        x: 0.8,
        y: 0.6,
        w: 11.5,
        h: 0.8,
        fontSize: 20,
        fontFace: "Arial",
        color: COLOR_PRIMARY,
        bold: true,
        valign: "middle"
      });

      // Línea divisoria decorativa
      slide.addShape(pptx.ShapeType.line, {
        x: 0.8,
        y: 1.45,
        w: 11.5,
        h: 0,
        line: { color: "334155", width: 1 }
      });

      // Tarjeta contenedora de contenido
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: 1.7,
        w: 11.5,
        h: 4.8,
        fill: { color: COLOR_CARD },
        line: { color: "334155", width: 1 },
        rectRadius: 0.1
      });

      // Viñetas de texto
      const textObjects = bulletChunk.map(b => ({
        text: b,
        options: {
          fontSize: 13,
          fontFace: "Arial",
          color: COLOR_TEXT,
          bullet: true,
          paraSpaceAfter: 12,
          lineSpacingMultiple: 1.2
        }
      }));

      slide.addText(textObjects, {
        x: 1.2,
        y: 2.0,
        w: 10.7,
        h: 4.2,
        valign: "top"
      });

      // Pie de página institucional
      slide.addText(`Susybot AI • MyJNexoraVisual | Diapositiva ${slideCounter}`, {
        x: 0.8,
        y: 6.75,
        w: 11.5,
        h: 0.35,
        fontSize: 9,
        fontFace: "Arial",
        color: COLOR_MUTED,
        align: "right"
      });

      slideCounter++;
    }
  });

  // 4. Descargar archivo .pptx
  const safeFilename = `${cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40)}_presentacion.pptx`;
  await pptx.writeFile({ fileName: safeFilename });
}

export const exportToPowerPoint = exportNoraCleanPptx;

