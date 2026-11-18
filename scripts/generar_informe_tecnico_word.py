# -*- coding: utf-8 -*-
"""
Generador del Informe Técnico Oficial y Guía de Usuario de Susy Bot
Diseño Ejecutivo Sobrio y 100% Humano (Escala de Grises / Negro Institucional)
Sin azules, sin marcas de agua invasivas, con saltos de página limpios y maquetación pulcra.
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''<w:tcMar {nsdecls("w")}>
        <w:top w:w="{top}" w:type="dxa"/>
        <w:bottom w:w="{bottom}" w:type="dxa"/>
        <w:left w:w="{left}" w:type="dxa"/>
        <w:right w:w="{right}" w:type="dxa"/>
    </w:tcMar>''')
    tcPr.append(tcMar)

def prevent_row_split(row):
    trPr = row._tr.get_or_add_trPr()
    cantSplit = parse_xml(f'<w:cantSplit {nsdecls("w")}/>')
    trPr.append(cantSplit)

def create_document():
    doc = docx.Document()

    # Configuración de márgenes estándar de informe ejecutivo (2.5 cm superior/inferior, 2.5 cm laterales)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.page_width = Inches(8.27)  # A4
        section.page_height = Inches(11.69)
        # Limpiar completamente encabezado y pie para no solapar membretes ni introducir marcas de agua
        section.header.is_linked_to_previous = False
        p_hdr = section.header.paragraphs[0]
        p_hdr.text = ""

    # Paleta de Colores Sobria y Profesional (100% Escala de Grises / Grafito / Negro)
    # CERO azul, celeste ni colores estridentes propios de IA
    COLOR_BLACK = RGBColor(17, 24, 39)       # Negro carbón puro para texto principal
    COLOR_CHARCOAL = RGBColor(55, 65, 81)    # Gris plomo oscuro para títulos en negrita
    COLOR_GRAY_MUTED = RGBColor(107, 114, 128) # Gris medio para subtítulos y datos de contacto

    # 1. MEMBRETE OFICIAL LIMPIO EN TABLA (Logo a la izquierda, Datos a la derecha)
    header_table = doc.add_table(rows=1, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False
    
    col_logo = header_table.columns[0]
    col_info = header_table.columns[1]
    col_logo.width = Inches(3.1)
    col_info.width = Inches(3.17)

    # Celda Izquierda: Logo Oficial Nexora One (fondo oscuro nítido)
    cell_logo = header_table.cell(0, 0)
    cell_logo.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    logo_path = 'd:/Susy Bot/public/icons/nexora-header-logo.png'
    p_logo = cell_logo.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_logo.paragraph_format.space_before = Pt(0)
    p_logo.paragraph_format.space_after = Pt(0)
    if os.path.exists(logo_path):
        p_logo.add_run().add_picture(logo_path, width=Inches(2.5))

    # Celda Derecha: Datos de Membrete
    cell_info = header_table.cell(0, 1)
    cell_info.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p_info = cell_info.paragraphs[0]
    p_info.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_info.paragraph_format.space_before = Pt(0)
    p_info.paragraph_format.space_after = Pt(0)
    p_info.paragraph_format.line_spacing = 1.15
    
    r_firm = p_info.add_run("NEXORA ONE ENGINE\n")
    r_firm.bold = True
    r_firm.font.size = Pt(10.5)
    r_firm.font.name = "Arial"
    r_firm.font.color.rgb = COLOR_BLACK

    r_sub = p_info.add_run(
        "División de Innovación & Desarrollo Tecnológico\n"
        "Ituzaingó, Corrientes • República Argentina\n"
        "Contacto Directo: +54 3786 41-4533\n"
        "Correo: nexoraone@nexativanews.com.ar"
    )
    r_sub.font.size = Pt(8.5)
    r_sub.font.name = "Arial"
    r_sub.font.color.rgb = COLOR_GRAY_MUTED

    # Línea divisoria sobria en gris plomo
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(8)
    p_div.paragraph_format.space_after = Pt(14)
    r_line = p_div.add_run("―" * 60)
    r_line.font.color.rgb = RGBColor(209, 213, 219)
    r_line.font.size = Pt(9.5)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # 2. TÍTULO Y REFERENCIA DEL DOCUMENTO
    p_ref = doc.add_paragraph()
    p_ref.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_ref.paragraph_format.space_after = Pt(4)
    r_ref = p_ref.add_run("INFORME TÉCNICO N° 01/2026 • ÁREA DE DESARROLLO\nFECHA DE EMISIÓN: NOVIEMBRE DE 2026")
    r_ref.font.size = Pt(8)
    r_ref.font.name = "Arial"
    r_ref.font.color.rgb = COLOR_GRAY_MUTED

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("INFORME DE CAPACIDADES Y GUÍA DE OPERACIÓN\nSISTEMA SUSY BOT Y CENTRO DE GESTIÓN MUNICIPAL")
    r_title.bold = True
    r_title.font.size = Pt(14)
    r_title.font.name = "Arial"
    r_title.font.color.rgb = COLOR_BLACK

    p_dest = doc.add_paragraph()
    p_dest.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dest.paragraph_format.space_after = Pt(16)
    r_dest = p_dest.add_run("Dirigido a: Intendencia Municipal, Secretarios de Área y Personal Operativo\nMunicipalidad de Ituzaingó, Provincia de Corrientes")
    r_dest.font.size = Pt(9.5)
    r_dest.font.name = "Arial"
    r_dest.font.color.rgb = COLOR_CHARCOAL

    def add_section_heading(title_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title_text)
        r.bold = True
        r.font.size = Pt(11)
        r.font.name = "Arial"
        r.font.color.rgb = COLOR_CHARCOAL
        return p

    def add_body_paragraph(text_content):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text_content)
        r.font.size = Pt(10)
        r.font.name = "Arial"
        r.font.color.rgb = COLOR_BLACK
        return p

    # 3. CONTENIDO REDACTADO CON PERSPECTIVA PURAMENTE HUMANA
    add_section_heading("1. PROPÓSITO E INTENCIÓN DE CREACIÓN")
    add_body_paragraph(
        "El desarrollo del sistema Susy Bot surge como una respuesta concreta a una problemática histórica de nuestra comunidad: la brecha que muchas veces separa al vecino de las oficinas del municipio. Durante años, la gestión local ha visto cómo trámites sencillos, solicitudes de turnos o reclamos por una luminaria apagada demandaban que el ciudadano tuviera que desplazarse físicamente hasta el Palacio Municipal, esperar en mesas de entrada o resignarse ante la falta de atención fuera de los horarios de oficina."
    )
    add_body_paragraph(
        "Diseñé a Susy con la premisa innegociable de recuperar el trato humano, cercano y hospitalario que caracteriza a Ituzaingó. No se trata de un contestador rígido ni de una máquina burocrática; Susy cumple el rol de una Directora Virtual de Atención al Vecino que escucha activamente, habla con calidez litoraleña, resuelve inquietudes las 24 horas y orienta con celeridad sin importar si quien consulta es un adulto mayor, un comerciante o un joven que tramita por primera vez su carnet de conducir."
    )

    add_section_heading("2. NATURALEZA DE UN SISTEMA INDEPENDIENTE Y SOBERANO")
    add_body_paragraph(
        "Uno de los puntos más relevantes para las autoridades municipales es comprender que Susy Bot es un sistema 100% independiente y soberano. Tradicionalmente, la implementación de tecnología en el sector público suele quedar atada a contratos con empresas corporativas que cobran abonos variables en moneda extranjera por cada interacción y alojan la información en servidores remotos fuera de nuestro país."
    )
    add_body_paragraph(
        "En contraposición a ese modelo, Susy Bot fue estructurada sobre una arquitectura propia y autónoma. El municipio es el único y exclusivo titular del ecosistema. Esto implica que no existen costos por consulta de vecinos, no hay dependencia de licencias externas que puedan suspenderse, y la totalidad de los datos y reclamos de los ciudadanos de Ituzaingó se mantienen resguardados con absoluta confidencialidad, garantizando la continuidad del servicio incluso ante contingencias de red."
    )

    add_section_heading("3. FUNCIONALIDADES PRINCIPALES DE ATENCIÓN CIUDADANA")
    add_body_paragraph(
        "A continuación, se detallan las herramientas con las que interactúa cotidianamente el vecino:"
    )

    bullets = [
        ("• Atención Multimodal (Texto, Audio y Llamada Telefónica en Vivo): ", "El ciudadano puede comunicarse mediante mensajes escritos, notas de voz o iniciar una llamada telefónica en vivo y manos libres desde su teléfono móvil o computadora. Susy responde oralmente con una voz fluida y natural, facilitando la comunicación de quienes no están habituados a escribir en pantallas táctiles."),
        ("• Gestión Pragmática de Reclamos (Cero Trámites Innecesarios): ", "Frente al envío de una fotografía de una rama con riesgo de caída, un bache o una luminaria dañada, el sistema evita cuestionarios innecesarios. Reconoce la ubicación geográfica dentro del radio urbano de Ituzaingó, emite de inmediato el ticket oficial #ITU y lo eleva a la secretaría correspondiente (Obras Públicas, Tránsito o Defensa Civil), liberando al vecino sin demoras."),
        ("• Accesibilidad Universal y Diseño DUA: ", "Cuenta con tableros de comunicación asistida con pictogramas para vecinos con autismo (TEA), integración con lectores de pantalla (TalkBack en Android y VoiceOver en iOS) y orientación auditiva descriptiva para personas ciegas o con disminución visual."),
        ("• Emisión de Turnos y Permisos Provisorios con QR: ", "Capacidad para otorgar turnos en ventanilla para trámites de licencia o rentas, así como permisos de 72 horas para poda o mudanzas, respaldados con código QR de verificación para inspectores."),
        ("• Identidad, Patrimonio y Ecoturismo: ", "Difunde la historia fundacional de Don Bernardino Valle, la cartelera del Centro Cultural, la agenda del Intendente y asesora sobre los atractivos de los Esteros del Iberá a través del Portal Cambyretá."),
    ]

    for title, desc in bullets:
        p_b = doc.add_paragraph()
        p_b.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_b.paragraph_format.space_before = Pt(1)
        p_b.paragraph_format.space_after = Pt(4)
        p_b.paragraph_format.left_indent = Inches(0.2)
        r_bt = p_b.add_run(title)
        r_bt.bold = True
        r_bt.font.size = Pt(9.5)
        r_bt.font.name = "Arial"
        r_bt.font.color.rgb = COLOR_BLACK
        r_bd = p_b.add_run(desc)
        r_bd.font.size = Pt(9.5)
        r_bd.font.name = "Arial"
        r_bd.font.color.rgb = COLOR_BLACK

    # SALTO DE PÁGINA LIMPIO PARA LA GUÍA DEL DASHBOARD Y LOS CÓDIGOS QR
    # Así evitamos cualquier corte desprolijo entre páginas
    doc.add_page_break()

    add_section_heading("4. GUÍA DE USUARIO DEL CENTRO DE GESTIÓN MUNICIPAL (DASHBOARD)")
    add_body_paragraph(
        "El Centro de Gestión (/dashboard) es el panel operativo exclusivo para el Intendente, secretarios de área y operadores municipales. Cada pestaña cumple una función clara dentro de la administración pública:"
    )

    dashboard_tabs = [
        ("1. Tren Agéntico & Ánimo Barrial (20 Barrios)", "Monitoreo en tiempo real del despacho municipal hacia las distintas áreas operativas. Presenta el termómetro social de los 20 barrios de Ituzaingó. Cada registro cuenta con botones para 'Modificar' el estado del reclamo o 'Archivar' el caso para mantener la consola despejada."),
        ("2. Métricas & Tráfico", "Visualización estadística de la cantidad de vecinos atendidos, tiempos de respuesta, temas con mayor demanda comunitaria y horarios pico de consulta."),
        ("3. Turnos Municipales", "Control de turnos otorgados para licencias de conducir y rentas. Permite a los recepcionistas buscar por DNI o fecha y registrar la presencia del contribuyente."),
        ("4. Permisos Provisorios con QR", "Registro de autorizaciones transitorias (72 hs) para poda de arbolado o carga y descarga comercial, con código QR auditable en la vía pública por los inspectores."),
        ("5. Gacetillas de Prensa y Agenda Oficial", "Editor institucional donde el equipo de prensa redacta y publica comunicados oficiales y la agenda de actividades del Intendente José Emilio Nicolás y la Viceintendente María Luisa Ojeda."),
        ("6. Guía Comercial y Farmacias de Turno", "Directorio clasificado de comercios locales y el cronograma de turnos farmacéuticos de guardia permanente."),
        ("7. Mapa de Oficinas y Dependencias", "Guía física y telefónica de todas las dependencias del Palacio Municipal (Av. Centenario 1519) y delegaciones barriales descentralizadas."),
        ("8. Defensa Civil", "Panel de contingencia para el seguimiento del caudal del Río Paraná en la Costanera, alertas meteorológicas tempranas y derivación inmediata a guardias (103 y 100)."),
        ("9. Archivo Histórico de Auditoría y Exportación", "Repositorio donde se almacenan permanentemente todos los reclamos y trámites resueltos. Desde aquí, el personal puede exportar planillas oficiales en Word (.doc) y PDF con membrete y espacio para firma de las autoridades."),
        ("10. Nora Copilot (Instructora Técnica en Vivo)", "Asistente incorporada en el extremo inferior del Dashboard. Su función es enseñar y guiar a los operadores municipales: si el personal tiene alguna duda sobre cómo modificar un reclamo, generar un permiso o emitir un reporte, Nora le responde paso a paso en el acto."),
    ]

    for title, desc in dashboard_tabs:
        p_t = doc.add_paragraph()
        p_t.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_t.paragraph_format.space_before = Pt(2)
        p_t.paragraph_format.space_after = Pt(4)
        p_t.paragraph_format.left_indent = Inches(0.2)
        r_tt = p_t.add_run(f"• {title}: ")
        r_tt.bold = True
        r_tt.font.size = Pt(9.5)
        r_tt.font.name = "Arial"
        r_tt.font.color.rgb = COLOR_BLACK
        r_td = p_t.add_run(desc)
        r_td.font.size = Pt(9.5)
        r_td.font.name = "Arial"
        r_td.font.color.rgb = COLOR_BLACK

    # 4. TABLA CON CÓDIGOS QR SIN CORTES (Protegida con cantSplit)
    add_section_heading("5. ACCESOS DIRECTOS MEDIANTE CÓDIGO QR")
    add_body_paragraph(
        "Para ingresar a cualquiera de las dos plataformas desde un teléfono celular o dispositivo móvil, basta con escanear los siguientes códigos directos:"
    )

    qr_table = doc.add_table(rows=2, cols=2)
    qr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    qr_table.autofit = False
    
    col_qr1 = qr_table.columns[0]
    col_qr2 = qr_table.columns[1]
    col_qr1.width = Inches(3.1)
    col_qr2.width = Inches(3.17)

    qr_susy_path = 'd:/Susy Bot/public/qrcodes/qr-susy-app.png'
    qr_dash_path = 'd:/Susy Bot/public/qrcodes/qr-susy-dashboard.png'

    # Fila 0: Imágenes QR centradas
    prevent_row_split(qr_table.rows[0])
    c00 = qr_table.cell(0, 0)
    p00 = c00.paragraphs[0]
    p00.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p00.paragraph_format.space_before = Pt(6)
    p00.paragraph_format.space_after = Pt(4)
    if os.path.exists(qr_susy_path):
        p00.add_run().add_picture(qr_susy_path, width=Inches(1.4))
    set_cell_background(c00, "F9FAFB")
    set_cell_margins(c00, 100, 60, 100, 100)

    c01 = qr_table.cell(0, 1)
    p01 = c01.paragraphs[0]
    p01.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p01.paragraph_format.space_before = Pt(6)
    p01.paragraph_format.space_after = Pt(4)
    if os.path.exists(qr_dash_path):
        p01.add_run().add_picture(qr_dash_path, width=Inches(1.4))
    set_cell_background(c01, "F9FAFB")
    set_cell_margins(c01, 100, 60, 100, 100)

    # Fila 1: Epígrafes y URLs
    prevent_row_split(qr_table.rows[1])
    c10 = qr_table.cell(1, 0)
    p10 = c10.paragraphs[0]
    p10.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p10.paragraph_format.space_before = Pt(4)
    p10.paragraph_format.space_after = Pt(6)
    r10_t = p10.add_run("SUSY BOT — PORTAL CIUDADANO\n")
    r10_t.bold = True
    r10_t.font.size = Pt(9.5)
    r10_t.font.name = "Arial"
    r10_t.font.color.rgb = COLOR_BLACK
    r10_u = p10.add_run("https://susy-bot.vercel.app\n(Acceso a chat, audio y llamada)")
    r10_u.font.size = Pt(8.5)
    r10_u.font.name = "Arial"
    r10_u.font.color.rgb = COLOR_GRAY_MUTED
    set_cell_background(c10, "F3F4F6")
    set_cell_margins(c10, 60, 80, 100, 100)

    c11 = qr_table.cell(1, 1)
    p11 = c11.paragraphs[0]
    p11.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p11.paragraph_format.space_before = Pt(4)
    p11.paragraph_format.space_after = Pt(6)
    r11_t = p11.add_run("CENTRO DE GESTIÓN MUNICIPAL\n")
    r11_t.bold = True
    r11_t.font.size = Pt(9.5)
    r11_t.font.name = "Arial"
    r11_t.font.color.rgb = COLOR_BLACK
    r11_u = p11.add_run("https://susy-bot.vercel.app/dashboard\n(Acceso exclusivo de operadores)")
    r11_u.font.size = Pt(8.5)
    r11_u.font.name = "Arial"
    r11_u.font.color.rgb = COLOR_GRAY_MUTED
    set_cell_background(c11, "F3F4F6")
    set_cell_margins(c11, 60, 80, 100, 100)

    # 5. BLOQUE DE FIRMA Y CONTACTO
    add_section_heading("6. CONSTANCIA DE DESARROLLO Y CONTACTO")
    add_body_paragraph(
        "El presente sistema y su arquitectura han sido diseñados y testeados para responder a los estándares institucionales de la Municipalidad de Ituzaingó, poniéndose a disposición para el acompañamiento técnico, capacitación del personal y soporte continuo."
    )

    p_sign = doc.add_paragraph()
    p_sign.paragraph_format.space_before = Pt(28)
    p_sign.paragraph_format.space_after = Pt(4)
    p_sign.paragraph_format.keep_with_next = True
    p_sign.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    r_line_s = p_sign.add_run("_________________________________________\n")
    r_line_s.font.color.rgb = COLOR_GRAY_MUTED
    
    r_dev = p_sign.add_run("Javier López Gómez\n")
    r_dev.bold = True
    r_dev.font.size = Pt(10.5)
    r_dev.font.name = "Arial"
    r_dev.font.color.rgb = COLOR_BLACK

    r_role = p_sign.add_run("Director de Desarrollo & Arquitectura Tecnológica\nNEXORA ONE ENGINE\n")
    r_role.font.size = Pt(9)
    r_role.font.name = "Arial"
    r_role.font.color.rgb = COLOR_CHARCOAL

    r_contact = p_sign.add_run("Teléfono: +54 3786 41-4533\nEmail: nexoraone@nexativanews.com.ar\nItuzaingó, Corrientes")
    r_contact.font.size = Pt(8.5)
    r_contact.font.name = "Arial"
    r_contact.font.color.rgb = COLOR_GRAY_MUTED

    # Guardar en raíz del proyecto
    output_filename = "INFORME_TECNICO_Y_GUIA_SUSYBOT_MUNICIPAL.docx"
    doc.save(output_filename)
    print(f"Documento Word actualizado exitosamente: {output_filename}")

if __name__ == "__main__":
    create_document()
