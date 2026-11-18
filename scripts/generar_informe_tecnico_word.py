# -*- coding: utf-8 -*-
"""
Generador del Informe Técnico Oficial y Guía de Usuario de Susy Bot
Desarrollado para: Javier López Gómez / Nexora One Engine
Destino: Municipalidad de Ituzaingó, Corrientes
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

def add_watermark_to_section(section, image_path):
    # Agregar marca de agua sutil al encabezado de la sección
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    hrun = hp.add_run()
    # Insertar la imagen en el header con tamaño controlado para que actúe de marca de agua de fondo
    hrun.add_picture(image_path, width=Inches(5.2))

def create_document():
    doc = docx.Document()

    # Configuración de márgenes estándar de informe ejecutivo (2.2 cm)
    for section in doc.sections:
        section.top_margin = Inches(0.85)
        section.bottom_margin = Inches(0.85)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        section.page_width = Inches(8.27)  # A4
        section.page_height = Inches(11.69)
        
        # Sello de agua en encabezado
        watermark_path = 'd:/Susy Bot/public/icons/nexora-watermark.png'
        if os.path.exists(watermark_path):
            add_watermark_to_section(section, watermark_path)

    # Colores Institucionales
    C_NAVY = RGBColor(15, 23, 42)      # Slate 900
    C_CYAN = RGBColor(8, 145, 178)     # Cyan 600
    C_DARK = RGBColor(30, 41, 59)      # Slate 800
    C_MUTED = RGBColor(100, 116, 139)  # Slate 500

    # 1. MEMBRETE OFICIAL CON LOGO NEXORA ONE
    header_table = doc.add_table(rows=1, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False
    
    col_logo = header_table.columns[0]
    col_info = header_table.columns[1]
    col_logo.width = Inches(3.2)
    col_info.width = Inches(3.27)

    # Celda Izquierda: Logo Oficial
    cell_logo = header_table.cell(0, 0)
    logo_path = 'd:/Susy Bot/public/icons/nexora-header-logo.png'
    p_logo = cell_logo.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if os.path.exists(logo_path):
        p_logo.add_run().add_picture(logo_path, width=Inches(2.6))

    # Celda Derecha: Datos de Membrete
    cell_info = header_table.cell(0, 1)
    p_info = cell_info.paragraphs[0]
    p_info.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    
    r_firm = p_info.add_run("NEXORA ONE ENGINE\n")
    r_firm.bold = True
    r_firm.font.size = Pt(11)
    r_firm.font.name = "Calibri"
    r_firm.font.color.rgb = C_NAVY

    r_sub = p_info.add_run("División de Innovación & Sistemas Inteligentes\nItuzaingó, Corrientes • República Argentina\nTel: +54 3786 41-4533\nEmail: nexoraone@nexativanews.com.ar\n")
    r_sub.font.size = Pt(8.5)
    r_sub.font.name = "Calibri"
    r_sub.font.color.rgb = C_MUTED

    # Línea divisoria decorativa
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(4)
    p_div.paragraph_format.space_after = Pt(14)
    r_line = p_div.add_run("―" * 58)
    r_line.font.color.rgb = C_CYAN
    r_line.font.size = Pt(10)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # 2. TÍTULO PRINCIPAL Y METADATOS DEL DOCUMENTO
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_meta.paragraph_format.space_after = Pt(6)
    r_date = p_meta.add_run("DOCUMENTO TÉCNICO OFICIAL • NOVIEMBRE 2026\nREFERENCIA: INFORME DE DESPLIEGUE Y GUÍA DE OPERACIÓN V4.2")
    r_date.font.size = Pt(8.5)
    r_date.font.name = "Calibri"
    r_date.font.color.rgb = C_MUTED

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("INFORME TÉCNICO DE CAPACIDADES Y GUÍA DE USUARIO\nSISTEMA SUSY BOT & CENTRO DE GESTIÓN MUNICIPAL")
    r_title.bold = True
    r_title.font.size = Pt(16)
    r_title.font.name = "Calibri"
    r_title.font.color.rgb = C_NAVY

    p_dest = doc.add_paragraph()
    p_dest.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dest.paragraph_format.space_after = Pt(16)
    r_dest = p_dest.add_run("Elevado a: Intendencia Municipal, Secretarías de Área y Equipo de Operaciones\nMunicipalidad de Ituzaingó, Provincia de Corrientes")
    r_dest.font.size = Pt(10)
    r_dest.font.italic = True
    r_dest.font.name = "Calibri"
    r_dest.font.color.rgb = C_DARK

    def add_section_heading(title_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title_text)
        r.bold = True
        r.font.size = Pt(12)
        r.font.name = "Calibri"
        r.font.color.rgb = C_CYAN
        return p

    def add_body_paragraph(text_content):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text_content)
        r.font.size = Pt(10)
        r.font.name = "Calibri"
        r.font.color.rgb = C_DARK
        return p

    # 3. CONTENIDO DEL INFORME (ESCRITO CON TONO HUMANO Y DE DESARROLLADOR EXPERTO)
    add_section_heading("1. PROPÓSITO E INTENCIÓN DE CREACIÓN")
    add_body_paragraph(
        "Como desarrollador, concebí el sistema Susy Bot no como una simple herramienta informática o un chatbot convencional de preguntas prefijadas, sino como un puente humano, empático y resolutivo entre la Municipalidad de Ituzaingó y cada vecino de nuestra comunidad. Durante años, la gestión pública local ha enfrentado el desafío de las colas interminables, la burocracia dispersa en múltiples dependencias y la dificultad de los ciudadanos para obtener respuestas claras fuera del horario administrativo."
    )
    add_body_paragraph(
        "Susy Bot fue diseñada con la intención primordial de democratizar el acceso a los servicios municipales. Actúa como la Directora Virtual de Atención al Vecino e Innovación Urbana, disponible las 24 horas del día durante los 365 días del año. Su personalidad, cadencia de voz y principios de servicio están profundamente arraigados en la identidad hospitalaria correntina, tratando al ciudadano con afecto, respeto y suma celeridad, ya sea que consulte por un turno de carnet de conducir, la recolección de ramas en su vereda, las farmacias de turno o el estado de alerta de Defensa Civil."
    )

    add_section_heading("2. ¿POR QUÉ ES UN SISTEMA INDEPENDIENTE Y SOBERANO?")
    add_body_paragraph(
        "Es fundamental remarcar ante las autoridades municipales y los equipos de gestión que Susy Bot es un sistema integralmente independiente. A diferencia de las soluciones tecnológicas tradicionales que alquilan infraestructura en el extranjero y cobran abonos mensuales por cada mensaje intercambiado, Susy Bot fue construida con una matriz soberana propia."
    )
    add_body_paragraph(
        "¿Qué significa esto en la práctica? Significa que el municipio no queda atado a contratos comerciales variables ni depende de servicios corporativos externos que puedan interrumpirse o modificar sus tarifas de forma imprevista. La inteligencia del sistema, el mapa geográfico con los 20 barrios oficiales de Ituzaingó, el digesto municipal de trámites y el resguardo de la información pública se ejecutan de manera autónoma. Esto asegura total confidencialidad en los datos de los vecinos, soberanía operativa y la garantía de que el municipio es el único dueño de su herramienta de atención ciudadana."
    )

    add_section_heading("3. FUNCIONALIDADES PRINCIPALES DE SUSY BOT")
    add_body_paragraph(
        "A continuación, se describen las capacidades medulares con las que cuenta el sistema para su interacción directa con los ciudadanos:"
    )

    bullets = [
        ("• Atención Multimodal (Texto, Audio y Llamada Live): ", "El vecino puede escribirle por chat, enviarle notas de voz o iniciar una llamada telefónica en vivo y manos libres desde cualquier teléfono celular o computadora, conversando de manera fluida y recibiendo respuestas orales inmediatas con tono latino cálido."),
        ("• Reclamos Urbanos Pragmáticos (Cero Burocracia): ", "Cuando un vecino envía una fotografía o mensaje sobre una luminaria rota, bache o rama peligrosa, Susy no lo abruma con cuestionarios ni términos técnicos. Identifica el barrio por referencias urbanas familiares (ej. Barrio Belgrano o Mil Viviendas), emite el ticket oficial #ITU al instante, lo deriva al área correspondiente y deja liberado al ciudadano."),
        ("• Accesibilidad Universal (Diseño DUA y Lazarillo): ", "Incorpora tableros de comunicación aumentativa con pictogramas para vecinos dentro del espectro autista (TEA), compatibilidad total con lectores de pantalla (TalkBack en Android y VoiceOver en iPhone) y asistencia visual mediante cámara para vecinos no videntes."),
        ("• Trámites y Emisión Oficial en el Acto: ", "Susy cuenta con facultades para emitir turnos con fecha y hora para renovación de carnet o rentas, así como permisos provisorios de 72 horas para poda y mudanzas respaldados con código QR de verificación institucional."),
        ("• Difusión Cultural, Histórica y Turística: ", "Conoce la historia viva de Don Bernardino Valle, la cartelera del Centro Cultural Ituzaingó, la agenda del Intendente y brinda asesoramiento preciso sobre el acceso al Portal Cambyretá de los Esteros del Iberá."),
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
        r_bt.font.color.rgb = C_NAVY
        r_bd = p_b.add_run(desc)
        r_bd.font.size = Pt(9.5)
        r_bd.font.color.rgb = C_DARK

    add_section_heading("4. GUÍA PRÁCTICA DEL CENTRO DE GESTIÓN MUNICIPAL (DASHBOARD)")
    add_body_paragraph(
        "El Centro de Gestión Municipal (/dashboard) es la consola de mando reservada para secretarios de área, directores y personal operativo. A continuación se desglosa la funcionalidad de cada uno de sus paneles:"
    )

    dashboard_tabs = [
        ("1. Tren Agéntico & Ánimo Barrial (20 Barrios)", "Permite monitorear en tiempo real los 7 agentes especializados del municipio (Obras Públicas, Tránsito, Rentas, Prensa, etc.). Presenta el Termómetro Social de los 20 barrios de Ituzaingó para conocer el clima comunitario. Cada operación ciudadana puede ser editada por el operador para cambiar su estado o ser archivada para mantener limpia la consola activa."),
        ("2. Métricas & Tráfico", "Visualiza estadísticas claras del volumen de consultas, tiempos de respuesta, temas más requeridos y picos de atención horaria para optimizar la toma de decisiones del Ejecutivo Municipal."),
        ("3. Turnos Municipales", "Listado centralizado de los turnos solicitados por la ciudadanía. Permite filtrar por secretaría, fecha o DNI, y confirmar la asistencia presencial en ventanilla."),
        ("4. Permisos Provisorios con Código QR", "Auditoría y control de los permisos de 72 horas emitidos por Susy (poda de arbolado urbano, cortes transitorios, etc.). Cada permiso cuenta con su QR para que los inspectores verifiquen su validez en la calle."),
        ("5. Gacetillas de Prensa y Agenda del Intendente", "Módulo de comunicación institucional donde el equipo de prensa redacta y publica comunicados oficiales, anuncios de obras y la agenda de actividades del Intendente José Emilio Nicolás y la Viceintendente María Luisa Ojeda."),
        ("6. Guía Comercial y Farmacias de Turno", "Directorio público y verificado de los comercios de Ituzaingó, rotiserías, corralones y el cronograma de farmacias de guardia para brindar información exacta a los residentes."),
        ("7. Mapa de Oficinas y Dependencias", "Guía geográfica de las secretarías que funcionan en el Palacio Municipal (Av. Centenario 1519) y las delegaciones descentralizadas con sus teléfonos directos y horarios de atención."),
        ("8. Defensa Civil y Alertas Climatológicas", "Tablero de alerta temprana para monitorear el caudal y crecidas del Río Paraná, tormentas severas, índices de riesgo de incendios de pastizales y activación inmediata de guardias operativas (103 y 100)."),
        ("9. Archivo Histórico de Auditoría (Respaldo)", "Repositorio inmutable donde se resguardan permanentemente todas las quejas, reclamos solucionados y trámites archivados. Desde aquí, cualquier operador puede generar con un solo clic las planillas formales en formato Word (.doc) y PDF para ser elevadas al Intendente o a los Secretarios con su firma correspondiente."),
        ("10. Nora Copilot (Asistente en Vivo para Operadores)", "Ubicada en la esquina inferior del Dashboard, Nora es una inteligencia copilot dedicada exclusivamente al personal municipal. Conoce al detalle cada rincón del sistema; si un funcionario tiene una duda de cómo emitir un permiso, cómo archivar un reclamo o cómo descargar un reporte, solo debe consultárselo a Nora y ella le responderá paso a paso."),
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
        r_tt.font.color.rgb = C_NAVY
        r_td = p_t.add_run(desc)
        r_td.font.size = Pt(9.5)
        r_td.font.color.rgb = C_DARK

    # 4. TABLA CON CÓDIGOS QR PARA ACCESO INMEDIATO DESDE EL DOCUMENTO IMPRESO
    add_section_heading("5. ACCESOS DIRECTOS MEDIANTE CÓDIGO QR")
    add_body_paragraph(
        "Para facilitar la revisión presencial del Intendente, secretarios de área o concejales, se han incorporado los códigos QR oficiales. Escaneando con la cámara de cualquier teléfono celular se accede instantáneamente a cada entorno sin necesidad de escribir la dirección web:"
    )

    qr_table = doc.add_table(rows=2, cols=2)
    qr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    qr_table.autofit = False
    
    col_qr1 = qr_table.columns[0]
    col_qr2 = qr_table.columns[1]
    col_qr1.width = Inches(3.2)
    col_qr2.width = Inches(3.27)

    qr_susy_path = 'd:/Susy Bot/public/qrcodes/qr-susy-app.png'
    qr_dash_path = 'd:/Susy Bot/public/qrcodes/qr-susy-dashboard.png'

    # Fila 0: Imágenes QR
    c00 = qr_table.cell(0, 0)
    p00 = c00.paragraphs[0]
    p00.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists(qr_susy_path):
        p00.add_run().add_picture(qr_susy_path, width=Inches(1.5))
    set_cell_background(c00, "F8FAFC")
    set_cell_margins(c00, 100, 80, 100, 100)

    c01 = qr_table.cell(0, 1)
    p01 = c01.paragraphs[0]
    p01.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists(qr_dash_path):
        p01.add_run().add_picture(qr_dash_path, width=Inches(1.5))
    set_cell_background(c01, "F8FAFC")
    set_cell_margins(c01, 100, 80, 100, 100)

    # Fila 1: Epígrafes y Enlaces
    c10 = qr_table.cell(1, 0)
    p10 = c10.paragraphs[0]
    p10.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r10_t = p10.add_run("SUSY BOT — PORTAL CIUDADANO\n")
    r10_t.bold = True
    r10_t.font.size = Pt(9.5)
    r10_t.font.color.rgb = C_NAVY
    r10_u = p10.add_run("https://susy-bot.vercel.app\n(Chat, notas de voz y llamada live)")
    r10_u.font.size = Pt(8.5)
    r10_u.font.color.rgb = C_MUTED
    set_cell_background(c10, "F1F5F9")
    set_cell_margins(c10, 80, 100, 100, 100)

    c11 = qr_table.cell(1, 1)
    p11 = c11.paragraphs[0]
    p11.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r11_t = p11.add_run("CENTRO DE GESTIÓN MUNICIPAL\n")
    r11_t.bold = True
    r11_t.font.size = Pt(9.5)
    r11_t.font.color.rgb = C_NAVY
    r11_u = p11.add_run("https://susy-bot.vercel.app/dashboard\n(Consola institucional / PIN: 1519)")
    r11_u.font.size = Pt(8.5)
    r11_u.font.color.rgb = C_MUTED
    set_cell_background(c11, "F1F5F9")
    set_cell_margins(c11, 80, 100, 100, 100)

    # 5. BLOQUE DE FIRMA Y CONTACTO DEL DESARROLLADOR
    add_section_heading("6. CONSTANCIA DE AUTORÍA Y CONTACTO TÉCNICO")
    add_body_paragraph(
        "El presente informe y la totalidad del ecosistema tecnológico descripto han sido desarrollados, testeados y calibrados de forma íntegra y personalizada para la Municipalidad de Ituzaingó, garantizando su óptimo desempeño en la primera fase de pruebas operativas y su evolución continua al servicio de nuestra comunidad."
    )

    p_sign = doc.add_paragraph()
    p_sign.paragraph_format.space_before = Pt(24)
    p_sign.paragraph_format.space_after = Pt(4)
    p_sign.paragraph_format.keep_with_next = True
    p_sign.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    r_line_s = p_sign.add_run("_________________________________________\n")
    r_line_s.font.color.rgb = C_MUTED
    
    r_dev = p_sign.add_run("Javier López Gómez\n")
    r_dev.bold = True
    r_dev.font.size = Pt(11)
    r_dev.font.name = "Calibri"
    r_dev.font.color.rgb = C_NAVY

    r_role = p_sign.add_run("Director de Desarrollo & Arquitectura Tecnológica\nNEXORA ONE ENGINE\n")
    r_role.font.size = Pt(9.5)
    r_role.font.name = "Calibri"
    r_role.font.color.rgb = C_DARK

    r_contact = p_sign.add_run("Teléfono directo: +54 3786 41-4533\nEmail: nexoraone@nexativanews.com.ar\nItuzaingó, Corrientes")
    r_contact.font.size = Pt(8.5)
    r_contact.font.name = "Calibri"
    r_contact.font.color.rgb = C_MUTED

    # Guardar en raíz del proyecto
    output_filename = "INFORME_TECNICO_Y_GUIA_SUSYBOT_MUNICIPAL.docx"
    doc.save(output_filename)
    print(f"Documento Word generado exitosamente: {output_filename}")

if __name__ == "__main__":
    create_document()
