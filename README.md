# ðŸ›ï¸ SUSY BOT - Sistema de Inteligencia Artificial Municipal & Ciudadana Soberana

**Susy Bot** es un cerebro multimodal de IA diseÃ±ado para operar a nivel gubernamental y municipal con **soberanÃ­a absoluta de datos, accesibilidad universal y costo de inferencia $0 en infraestructura abierta**.

---

## ðŸ›¡ï¸ Principios ArquitectÃ³nicos
1. **Cero Dependencia de APIs Comerciales:** Opera con modelos Open-Weights sobre Ollama Local / Servidor VPS Propio y motor WebGPU On-Device en el cliente.
2. **Privacidad y Secreto de Datos:** NingÃºn dato sensible de ciudadanos o expedientes se comparte con proveedores externos de nube pÃºblica.
3. **InclusiÃ³n Universal:** Protocolos de accesibilidad integrados para personas no videntes (descripciÃ³n hÃ¡ptica y espacial por cÃ¡mara) y personas con TEA (apoyos visuales y pictogramas ARASAAC).
4. **Independencia Total:** Totalmente desacoplado de plataformas externas, con su propia base de datos Supabase o Postgres local.

---

## ðŸš€ Puesta en Marcha RÃ¡pida (Entorno Local)

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo:
```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus datos:
- `NEXT_PUBLIC_SUPABASE_URL`: Tu endpoint de Supabase (o Postgres).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave pÃºblica anon.
- `SUPABASE_SERVICE_ROLE_KEY`: Tu clave privada service-role.
- `OLLAMA_BASE_URL`: DirecciÃ³n de tu servidor Ollama (por defecto `http://localhost:11434`).

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

---

## ðŸ—„ï¸ ConfiguraciÃ³n de Base de Datos (Supabase Municipal)

1. Ingresa a [https://supabase.com](https://supabase.com) y crea un nuevo proyecto llamado **Susy Bot Municipal**.
2. DirÃ­gete a **SQL Editor** en el panel lateral.
3. Abre el archivo de migraciÃ³n que incluimos:
   `supabase/migrations/01_susy_municipal_schema.sql`
4. Pega el contenido y presiona **Run**.
5. Las tablas creadas son:
   - `susy_sessions`: Sesiones de atenciÃ³n ciudadana (web, tÃ³tem, mÃ³vil).
   - `susy_messages`: Historial conversacional y registros de atenciÃ³n.
   - `susy_citizen_memory`: Preferencias de accesibilidad y contexto del ciudadano.
   - `susy_municipal_documents`: GuÃ­as de trÃ¡mites, ordenanzas y telÃ©fonos Ãºtiles con bÃºsqueda vectorial pgvector.
   - `susy_sos_events`: Alertas de emergencia y derivaciÃ³n municipal.
   - `susy_sync_tokens`: Emparejamiento por cÃ³digo QR entre pantallas pÃºblicas y telÃ©fonos mÃ³viles.

---

## ðŸ§  ConfiguraciÃ³n del Motor de Inferencia (Ollama On-Premise)

En la mÃ¡quina o servidor del municipio donde correrÃ¡ la IA:
```bash
# 1. Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Descargar modelos soberanos recomendados
ollama pull llama3.3:70b     # Modelo cognitivo principal (o llama3.2 para servidores livianos)
ollama pull llava            # Modelo de visiÃ³n para documentos y cÃ¡mara
ollama pull nomic-embed-text # Modelo de embeddings para guÃ­as y ordenanzas
```

---

## â˜ï¸ Despliegue en ProducciÃ³n

### OpciÃ³n A: Despliegue en Vercel (Recomendado para pruebas y prototipos)
1. Conecta este repositorio en Vercel creando un nuevo proyecto: `susy-bot`.
2. En **Settings > Environment Variables**, carga las variables de tu archivo `.env.local`.
3. Haz clic en **Deploy**.

### OpciÃ³n B: Despliegue en Servidor Local / Intranet Municipal (Docker / PM2)
Para un aislamiento del 100% dentro de la red municipal:
```bash
npm run build
npm run start
```
O encapsulado en un contenedor Docker sobre la intranet del palacio municipal.

---

## ðŸ“ž Estructura de Endpoints de la API Soberana
- `POST /api/chat`: DiÃ¡logo conversacional ciudadano con soporte streaming y memoria.
- `POST /api/live`: Inferencia multimodal (lectura de formularios, DNI, trÃ¡mites fÃ­sicos).
- `POST /api/tts`: ConversiÃ³n fonÃ©tica texto a voz accesible.
- `POST /api/sos`: BotÃ³n de pÃ¡nico y canalizaciÃ³n de emergencias ciudadanas.
- `POST /api/sync`: GeneraciÃ³n y validaciÃ³n de tokens QR para tÃ³tems pÃºblicos.