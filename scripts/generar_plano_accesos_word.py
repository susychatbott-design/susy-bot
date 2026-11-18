import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_header_banner(doc, logo_path):
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    col_widths = [Inches(2.4), Inches(4.6)]
    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    cell_left = table.cell(0, 0)
    p_logo = cell_left.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if os.path.exists(logo_path):
        p_logo.add_run().add_picture(logo_path, width=Inches(2.2))
    
    cell_right = table.cell(0, 1)
    p_org = cell_right.paragraphs[0]
    p_org.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    
    r1 = p_org.add_run("NEXORA ONE ENGINE\n")
    r1.font.name = "Arial"
    r1.font.size = Pt(11)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(30, 41, 59)
    
    r2 = p_org.add_run("INGENIERÍA DE INTEGRACIÓN MUNICIPAL\n")
    r2.font.name = "Arial"
    r2.font.size = Pt(8.5)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(71, 85, 105)

    r3 = p_org.add_run("MUNICIPALIDAD DE ITUZAINGÓ, CORRIENTES — GESTIÓN 2025-2029\nDOCUMENTO TÉCNICO N° NEX-INT-2026-01")
    r3.font.name = "Arial"
    r3.font.size = Pt(8)
    r3.font.color.rgb = RGBColor(100, 116, 139)

    p_divider = doc.add_paragraph()
    p_divider.paragraph_format.space_before = Pt(4)
    p_divider.paragraph_format.space_after = Pt(14)
    pPr = p_divider._p.get_or_add_pPr()
    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="18" w:space="1" w:color="334155"/></w:pBdr>')
    pPr.append(pBdr)

def add_title(doc, title, subtitle):
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(4)
    run_t = p_title.add_run(title)
    run_t.font.name = "Arial"
    run_t.font.size = Pt(16)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(30, 41, 59)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(16)
    run_s = p_sub.add_run(subtitle)
    run_s.font.name = "Arial"
    run_s.font.size = Pt(10)
    run_s.font.italic = True
    run_s.font.color.rgb = RGBColor(71, 85, 105)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = RGBColor(30, 41, 59)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(10.5)
    run.font.bold = True
    run.font.color.rgb = RGBColor(51, 65, 85)
    return p

def add_body_p(doc, text, bold_prefix=None, space_after=6):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Arial"
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(30, 41, 59)
    run = p.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(15, 23, 42)
    return p

def add_callout(doc, text, title="NOTA TÉCNICA PARA LA DIRECCIÓN DE CÓMPUTOS"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.rows[0].cells[0].width = Inches(7.0)
    cell = table.cell(0, 0)
    set_cell_background(cell, "F1F5F9")
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="0" w:color="334155"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(0)
    
    r_tit = p.add_run(f"• {title}:\n")
    r_tit.font.name = "Arial"
    r_tit.font.size = Pt(9.5)
    r_tit.font.bold = True
    r_tit.font.color.rgb = RGBColor(30, 41, 59)
    
    r_body = p.add_run(text)
    r_body.font.name = "Arial"
    r_body.font.size = Pt(9.5)
    r_body.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_styled_table(doc, headers, data, col_widths):
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    # Header row
    hdr_row = table.rows[0]
    for idx, heading in enumerate(headers):
        cell = hdr_row.cells[idx]
        cell.width = col_widths[idx]
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(heading)
        run.font.name = "Arial"
        run.font.size = Pt(9)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)

    # Data rows
    for r_idx, row_data in enumerate(data):
        row = table.rows[r_idx + 1]
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            
            # Subtle borders
            tcPr = cell._tc.get_or_add_tcPr()
            borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:top w:val="none"/><w:left w:val="none"/><w:right w:val="none"/></w:tcBorders>')
            tcPr.append(borders)
            
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.1
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(val)
            run.font.name = "Arial"
            run.font.size = Pt(8.5)
            run.font.color.rgb = RGBColor(30, 41, 59)
            if c_idx == 0:
                run.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def build_plano_document():
    doc = docx.Document()
    
    # Configure 2 cm margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    logo_path = os.path.abspath("public/icons/nexora-header-logo.png")
    
    # Header Banner
    add_header_banner(doc, logo_path)
    
    # Title
    add_title(
        doc, 
        "PLANO TÉCNICO DE INTEGRACIÓN Y REQUERIMIENTO DE ACCESOS",
        "Protocolos de Enlace para Conexión de Susy Bot con la Infraestructura Municipal"
    )

    # 1. OBJETIVO DEL DOCUMENTO
    add_heading_1(doc, "1. Objeto y Alcance del Requerimiento")
    add_body_p(
        doc,
        "El presente instrumento técnico define con exactitud la arquitectura de conexión, los accesos requeridos y los estándares de seguridad que la Dirección de Cómputos y Sistemas de la Municipalidad de Ituzaingó debe habilitar para integrar el ecosistema de inteligencia artificial Susy Bot con las bases de datos de gestión municipal en tiempo real. Esta integración permitirá que la asistente ciudadana opere con datos fehacientes (deuda y cupones de tasas, expedientes de reclamos urbanos y turnos de atención presencial), manteniendo la soberanía y confidencialidad absoluta del Palacio Municipal."
    )

    add_callout(
        doc,
        "Principio de Mínimo Privilegio: Susy Bot opera bajo un esquema de seguridad estricto. Nexora One NO solicita acceso a servidores centrales con permisos de administrador ni intervención directa sobre tablas maestras de recaudación. Toda consulta se realiza mediante capas seguras de solo lectura o contratos de interfaz controlados por el propio personal municipal.",
        "PREMISA DE SEGURIDAD MUNICIPAL"
    )

    # 2. MODALIDADES DE INTEGRACIÓN
    add_heading_1(doc, "2. Modalidades de Enlace Técnico (Matriz de Selección)")
    add_body_p(
        doc,
        "Para adaptarse a la infraestructura informática existente en el Municipio, Nexora One ofrece dos metodologías de conexión probadas y compatibles con cualquier sistema de gestión tributaria y documental:"
    )

    headers_mod = ["Modalidad", "Descripción Técnica", "Nivel de Acceso Solicitado", "Seguridad y Control Municipal"]
    data_mod = [
        [
            "Opción A: APIs REST / Webhooks (Recomendada)",
            "El área de sistemas municipal provee o habilita endpoints HTTP protegidos bajo protocolo SSL/TLS con Token de Autenticación Bearer. Susy Bot consulta y envía información mediante solicitudes estructuradas en formato JSON.",
            "Ningún acceso directo a base de datos. Solo se consumen 3 URLs protegidas expuestas en el servidor municipal o en la red interna.",
            "Control total del Municipio. El personal informático municipal decide qué campos exponer, qué filtros aplicar y audita cada solicitud en sus propios logs de IIS / Apache / Nginx."
        ],
        [
            "Opción B: Conexión de Solo Lectura (Read-Only)",
            "En caso de que el sistema municipal no cuente con una capa de APIs desarrollada, se solicita un usuario de base de datos específico (SQL Server, MySQL o PostgreSQL) con permiso exclusivo de SELECT sobre tablas o vistas sanitizadas.",
            "Acceso mediante puerto de base de datos a través de túnel VPN punto a punto (WireGuard / IPSec). Solo sentencias SELECT permitidas.",
            "Imposibilidad absoluta de alteración o borrado. El usuario creado carece de permisos INSERT, UPDATE, DELETE o DROP sobre las tablas operativas de la Comuna."
        ]
    ]
    add_styled_table(doc, headers_mod, data_mod, [Inches(1.8), Inches(2.2), Inches(1.5), Inches(1.5)])

    # 3. DETALLE DE ENDPOINTS Y CONTRATOS DE API
    add_heading_1(doc, "3. Especificación de Endpoints Solicitados (Para Opción A - APIs)")
    add_body_p(
        doc,
        "Si el área informática municipal opta por la integración mediante interfaz de programación de aplicaciones (API REST), los 3 contratos de datos requeridos se detallan a continuación:"
    )

    headers_api = ["Servicio / Módulo", "Método y Ruta Sugerida", "Parámetros Enviados por Susy", "Respuesta Esperada del Municipio"]
    data_api = [
        [
            "Módulo de Tasas e Inmobiliario (Rentas)",
            "GET /api/v1/rentas/deuda",
            "dni (Numérico)\no padron (Numérico)",
            "{ estado: 'AL_DIA' | 'CON_DEUDA', periodo: '2026-11', monto_total: 14500.00, url_cupon_pago: 'https://...' }"
        ],
        [
            "Módulo de Reclamos y Obras Públicas",
            "POST /api/v1/reclamos/alta",
            "{ vecino: '...', dni: '...', barrio: '...', categoria: 'Luminaria' | 'Bacheo' | 'Basura', descripcion: '...' }",
            "{ status: 'REGISTRADO', nro_expediente: 'REC-2026-9841', cuadrilla_asignada: 'Servicios Públicos', fecha_estimada: '...' }"
        ],
        [
            "Módulo de Tránsito y Turnos (Licencias)",
            "POST /api/v1/turnero/reservar",
            "{ dni: '...', tramite: 'Renovacion_B1', fecha: 'AAAA-MM-DD', horario: '08:30' }",
            "{ status: 'CONFIRMADO', id_turno: 'TRN-8842', box: 'Dirección de Tránsito - Palacio Municipal', requisitos: [...] }"
        ]
    ]
    add_styled_table(doc, headers_api, data_api, [Inches(1.5), Inches(1.8), Inches(1.8), Inches(1.9)])

    add_heading_2(doc, "Mecanismo de Autenticación de las APIs")
    add_body_p(
        doc,
        "Todas las llamadas emitidas desde los microservicios de Susy Bot hacia las APIs de la Comuna incluirán cabeceras de autorización de estándar militar:\n"
        "• Header: Authorization: Bearer <TOKEN_SECRETO_MUNICIPAL>\n"
        "• Header: X-Nexora-Signature: <HASH_HMAC_SHA256> (para garantizar la integridad de la petición)\n"
        "• Restricción por dirección IP estática del nodo de inferencia de Nexora One para evitar accesos indebidos de terceros."
    )

    # 4. REQUERIMIENTOS DE RED, INFRAESTRUCTURA Y PUERTOS
    add_heading_1(doc, "4. Requerimientos de Red, Seguridad y Puertos (Checklist de Sistemas)")
    add_body_p(
        doc,
        "A fin de facilitar la tarea del administrador de redes y servidores del Palacio Municipal, se enumera la configuración perimetral requerida:"
    )

    headers_net = ["Componente", "Puerto / Protocolo", "Origen / Destino", "Finalidad Técnica"]
    data_net = [
        [
            "Tráfico Web Seguro (HTTPS)",
            "TCP 443 (TLS 1.3)",
            "Vecino / Navegador Web <--> Servidor Susy Bot",
            "Acceso ciudadano a la aplicación web, asistente de voz interactivo y panel Dashboard."
        ],
        [
            "Túnel Seguro Municipal (VPN)",
            "UDP 51820 (WireGuard) o IPsec",
            "Servidor Susy Bot <--> Router / Gateway Palacio Municipal",
            "Enlace encriptado punto a punto para consultar bases de datos municipales sin exponer puertos a la internet pública."
        ],
        [
            "Servicio de Base de Datos (Si aplica Opción B)",
            "TCP 1433 (SQL Server) / 5432 (Postgres) / 3306 (MySQL)",
            "Exclusivo por dentro del túnel VPN encriptado",
            "Consultas de solo lectura de estados de deuda, cuentas catastrales y expedientes existentes."
        ],
        [
            "Servicio DNS y NTP Local",
            "UDP 53 / UDP 123",
            "Red interna municipal",
            "Sincronización horaria exacta de turnos y resolución de nombres de dominio comunales."
        ]
    ]
    add_styled_table(doc, headers_net, data_net, [Inches(1.8), Inches(1.4), Inches(1.8), Inches(2.0)])

    # 5. ALTERNATIVA DE NODO 100% LOCAL (ON-PREMISE)
    add_heading_1(doc, "5. Especificaciones para Despliegue de Nodo Local Soberano (Sin Internet)")
    add_body_p(
        doc,
        "Para dar cumplimiento a la directiva de Soberanía Informática Municipal en caso de que la Comuna requiera operar el sistema dentro de su propio centro de cómputos físico (aislado de caídas de conectividad externa), los requerimientos recomendados de hardware para el servidor municipal son:"
    )

    headers_hw = ["Recurso de Hardware", "Especificación Mínima Sugerida", "Especificación Óptima Recomendada"]
    data_hw = [
        [
            "Procesador (CPU)",
            "Intel Core i7 12va Gen o AMD Ryzen 7 (8 núcleos / 16 hilos)",
            "Intel Xeon Silver / AMD EPYC (16 núcleos / 32 hilos)"
        ],
        [
            "Memoria RAM",
            "32 GB DDR4 / DDR5",
            "64 GB DDR5 con corrección ECC"
        ],
        [
            "Acelerador Gráfico (GPU)",
            "NVIDIA RTX 3060 12GB VRAM (o superior)",
            "NVIDIA RTX 4080 16GB VRAM o NVIDIA L4 24GB VRAM"
        ],
        [
            "Almacenamiento",
            "512 GB SSD NVMe M.2 (Lectura 3500 MB/s)",
            "1 TB SSD NVMe PCIe 4.0 en arreglo RAID 1 (Espejo)"
        ],
        [
            "Sistema Operativo Base",
            "Ubuntu Server 24.04 LTS (64-bit)",
            "Ubuntu Server 24.04 LTS con soporte de Docker y Containerd"
        ]
    ]
    add_styled_table(doc, headers_hw, data_hw, [Inches(2.0), Inches(2.5), Inches(2.5)])

    # 6. PROTOCOLO DE TRABAJO CONJUNTO
    add_heading_1(doc, "6. Cronograma de Implementación y Homologación Conjunta")
    add_body_p(
        doc,
        "Una vez suscripto el convenio de colaboración técnica y otorgada la autorización administrativa, la vinculación operativa se desarrolla en un plazo de diez (10) días hábiles estructurados de la siguiente manera:"
    )

    headers_cron = ["Fase de Trabajo", "Plazo Estimado", "Responsables", "Hito Entregable"]
    data_cron = [
        [
            "Fase 1: Mesa de Enlace y Parámetros",
            "Día 1 al Día 3",
            "Ingeniería Nexora One + Dirección de Cómputos",
            "Definición de opción técnica (APIs vs Vistas de Solo Lectura) y entrega de credenciales en entorno de prueba (Sandbox)."
        ],
        [
            "Fase 2: Conexión y Pruebas Sintéticas",
            "Día 4 al Día 6",
            "Equipo Técnico Nexora One",
            "Calibración del tren de agentes en el servidor de pruebas; validación de consistencia de montos tributarios y numeración de expedientes."
        ],
        [
            "Fase 3: Marcha Blanca con Operadores",
            "Día 7 al Día 8",
            "Personal Municipal + Asistencia Nora Copilot",
            "Simulación de trámites reales desde boxes de atención ciudadana y control del panel de monitoreo Dashboard."
        ],
        [
            "Fase 4: Puesta en Producción y Publicación",
            "Día 9 al Día 10",
            "Autoridades Municipales + Nexora One",
            "Apertura del servicio al público en general, publicación de enlaces oficiales y distribución de cartelería con códigos QR."
        ]
    ]
    add_styled_table(doc, headers_cron, data_cron, [Inches(1.8), Inches(1.2), Inches(2.0), Inches(2.0)])

    # 7. CIERRE Y FIRMA TÉCNICA
    add_heading_1(doc, "7. Constancia y Conformidad Técnica")
    add_body_p(
        doc,
        "El presente esquema de enlace garantiza la operatividad sin fisuras de Susy Bot, protegiendo integralmente el patrimonio tecnológico de la Municipalidad de Ituzaingó y asegurando una prestación ininterrumpida y transparente de servicios para toda la ciudadanía."
    )

    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(20)
    p_sig.paragraph_format.line_spacing = 1.15
    p_sig.paragraph_format.keep_with_next = True
    
    r_sig1 = p_sig.add_run("Javier López Gómez\n")
    r_sig1.font.name = "Arial"
    r_sig1.font.size = Pt(11)
    r_sig1.font.bold = True
    r_sig1.font.color.rgb = RGBColor(30, 41, 59)

    r_sig2 = p_sig.add_run("Dirección de Ingeniería y Desarrollo — Nexora One Engine\n")
    r_sig2.font.name = "Arial"
    r_sig2.font.size = Pt(9.5)
    r_sig2.font.color.rgb = RGBColor(71, 85, 105)

    r_sig3 = p_sig.add_run("Especialistas en Inteligencia Artificial Soberana y Modernización Gubernamental\n")
    r_sig3.font.name = "Arial"
    r_sig3.font.size = Pt(9)
    r_sig3.font.color.rgb = RGBColor(100, 116, 139)

    r_sig4 = p_sig.add_run("Contacto Técnico Directo: lopezgomezjaviermatias1994@gmail.com | Ituzaingó, Corrientes")
    r_sig4.font.name = "Arial"
    r_sig4.font.size = Pt(9)
    r_sig4.font.color.rgb = RGBColor(100, 116, 139)

    output_dir = r"D:\Biblioteca\Escritorio\Informe Susy"
    output_path = os.path.join(output_dir, "PLANO_TECNICO_ACCESOS_Y_APIS_MUNICIPAL_SUSYBOT.docx")
    doc.save(output_path)
    print(f"Documento guardado exitosamente en: {output_path}")

if __name__ == "__main__":
    build_plano_document()
