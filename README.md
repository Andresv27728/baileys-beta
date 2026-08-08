
# YO SOY YO BAILEYS

> **WhatsApp Multi-Device API para Node.js** — Fork modificado de `@whiskeysockets/baileys` con soporte ampliado para mensajes interactivos, álbumes, newsletters y formatos de texto enriquecido.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![Version](https://img.shields.io/badge/version-0.7.14-blue)

---

## 📦 Instalación

```bash
npm install yo-soy-yo-baileys
```

> **Nota:** Este paquete está diseñado para entornos Node.js `>=20.0.0` con módulos ESM.

---

## 🌟 Características Principales

### ✅ Soportado
| Característica | Estado |
|---------------|--------|
| ✅ Multi-Dispositivo | Completo |
| ✅ Envío/Recepción de mensajes (texto, imágenes, video, audio, docs, stickers) | Completo |
| ✅ Gestión de grupos (crear, editar, invitaciones, aprobaciones) | Completo |
| ✅ Comunidades (crear, vincular/desvincular grupos) | Completo |
| ✅ Newsletters / Canales (crear, seguir, publicar, reaccionar) | Completo |
| ✅ Mensajes interactivos (botones, carruseles, listas) | Completo (mod) |
| ✅ Álbumes / Colecciones de imágenes | Completo (mod) |
| ✅ Catálogo de negocios y productos | Completo |
| ✅ Cifrado de extremo a extremo (Protocolo Signal) | Completo |
| ✅ Formato enriquecido (tablas, código, LaTeX, enlaces) | Completo (mod) |
| ✅ Estados / Galería (swgc) | Completo (mod) |
| ✅ Eventos en tiempo real | Completo |

### 🚧 En Desarrollo / Limitaciones
- Llamadas de voz/video (solo recepción de llamadas entrantes)
- Status "online" en todos los dispositivos simultáneamente

---

## 🛡️ Anti-Ban (anti-ban.js)

Sistema de protección contra baneos de WhatsApp con delays inteligentes y presencia humana.

| Export | Descripción |
|--------|-------------|
| `ANTI_BAN_CONFIG` | Configuración por defecto |
| `RateLimiter` | Limitador de velocidad por JID |
| `PresenceManager` | Simula presencia (typing, grabando, online) |
| `randomDelay(min, max)` | Delay aleatorio con jitter |
| `messageDelay(isGroup)` | Delay entre mensajes |
| `typingDelay(len)` | Delay de escritura según largo del texto |
| `generateSessionFingerprint()` | Fingerprint único de sesión |
| `isValidJid(jid)` | Valida formato JID |
| `sanitizeMessage(text)` | Limpia texto para envío |

```javascript
import { RateLimiter, PresenceManager, messageDelay, typingDelay } from 'yo-soy-yo-baileys';

const limiter = new RateLimiter(100, 60000); // 100 msgs/minuto
const presence = new PresenceManager(sock);

if (limiter.canSend(jid)) {
  await typingDelay(text.length);
  await presence.typing(jid);
  await sock.sendMessage(jid, { text });
}

// Configuración personalizada
import { ANTI_BAN_CONFIG } from 'yo-soy-yo-baileys';
ANTI_BAN_CONFIG.MIN_MESSAGE_DELAY = 500;
ANTI_BAN_CONFIG.MAX_MESSAGE_DELAY = 1500;
```

---

## 🔄 Smart Reconnect (smart-reconnect.js)

Reconexión inteligente con backoff exponencial y manejo automático de errores.

| Export | Descripción |
|--------|-------------|
| `SmartReconnect` | Clase principal de reconexión |
| `RECONNECT_CONFIG` | Configuración por defecto |
| `createConnectionHandler(sock, opts)` | Handler completo de conexión |
| `withRetry(fn, opts)` | Ejecuta función con reintentos |

```javascript
import { SmartReconnect, createConnectionHandler } from 'yo-soy-yo-baileys';

// Opción 1: Usar handler automático
const { reconnect } = createConnectionHandler(sock, {
  maxRetries: 10,
  initialDelay: 2000,
  onReconnect: (attempt) => console.log(`Reconectando... intento ${attempt}`),
  onFatal: (reason) => console.error('Error fatal:', reason)
});

// Opción 2: Usar clase directamente
const reconnect = new SmartReconnect(logger, {
  MAX_RETRIES: 20,
  INITIAL_DELAY: 2000,
  MAX_DELAY: 60000,
  BACKOFF_FACTOR: 2.0
});

// Ejecutar con reintentos
const result = await withRetry(
  () => sock.sendMessage(jid, { text: 'Hola' }),
  { maxAttempts: 5, delay: 1000 }
);
```

---

## 📨 Message Queue (message-queue.js)

Cola de mensajes con prioridades y rate limiting automático.

| Export | Descripción |
|--------|-------------|
| `MessageQueue` | Clase principal de la cola |
| `PRIORITY` | Enum: CRITICAL(0), HIGH(1), NORMAL(2), LOW(3), BACKGROUND(4) |
| `QUEUE_CONFIG` | Configuración por defecto |
| `createMessageQueue(sock, opts)` | Crea cola conectada al socket |

```javascript
import { MessageQueue, PRIORITY, createMessageQueue } from 'yo-soy-yo-baileys';

const queue = new MessageQueue(logger, {
  MAX_QUEUE_SIZE: 500,
  PROCESS_INTERVAL: 100
});

// Encolar mensajes con prioridad
queue.enqueue(
  () => sock.sendMessage(jid, { text: 'Urgente!' }),
  PRIORITY.CRITICAL,
  { type: 'message', maxAttempts: 5 }
);

queue.enqueue(
  () => sock.sendMessage(jid, { text: 'Normal' }),
  PRIORITY.NORMAL
);

// Usar helper rápido
const sendFast = createMessageQueue(sock);
await sendFast(jid, { text: 'Rápido' }, PRIORITY.HIGH);

// Ver estadísticas
console.log(queue.getStats());
// { total: 10, pending: 3, processing: 1, completed: 6, failed: 0 }
```

---

## 💾 Enhanced Cache (enhanced-cache.js)

Caché de 2 niveles con hot keys, TTL configurable y persistencia a disco.

| Export | Descripción |
|--------|-------------|
| `EnhancedCache` | Clase de caché 2 niveles |
| `CacheManager` | Gestor de múltiples instancias |
| `CACHE_CONFIG` | Configuración por defecto |

```javascript
import { EnhancedCache, CacheManager } from 'yo-soy-yo-baileys';

// Crear caché individual
const cache = new EnhancedCache('messages', {
  MAX_SIZE: 5000,
  TTL: 30 * 60 * 1000, // 30 min
  persistPath: './cache/messages.json'
});

cache.set('key1', { data: 'valor' });
const val = cache.get('key1');

// Gestor de múltiples cachés
const manager = new CacheManager();
manager.create('profiles', { MAX_SIZE: 1000, TTL: 3600000 });
manager.create('groups', { MAX_SIZE: 500, TTL: 900000 });

const profiles = manager.get('profiles');
profiles.set(userId, profileData);

// Estadísticas
console.log(cache.getStats());
// { hits: 150, misses: 23, sets: 89, deletes: 12 }
```

---

## 📊 Enhanced Logger (enhanced-logger.js)

Logger colorizado con categorías, historial y throttling de mensajes repetidos.

| Export | Descripción |
|--------|-------------|
| `RyzeLogger` | Clase principal de logger |
| `createLogger(opts)` | Helper para crear logger |
| `defaultLogger` | Instancia por defecto |

```javascript
import { RyzeLogger, createLogger } from 'yo-soy-yo-baileys';

// Crear logger personalizado
const logger = new RyzeLogger({
  level: 'info',
  enableColors: true,
  enableTimestamp: true,
  maxHistory: 500
});

logger.socket('Conectado a WhatsApp');
logger.message('Mensaje enviado a 521234567890');
logger.auth('Credenciales cargadas');
logger.warn('Rate limit alcanzado');
logger.error('Error de conexión', error);

// Ver historial
const history = logger.getHistory('error');
console.log(history);

// Throttling automático - no repite el mismo mensaje 5 veces
logger.info('Mensaje único');
```

---

## 🤖 Bot Utils (bot-utils.js)

Utilidades completas para desarrollo de bots: parsing de comandos, permisos, y más.

| Función | Descripción |
|---------|-------------|
| `parseCommand(text, prefix)` | Parsea comando con flags y args |
| `extractMentions(message)` | Extrae todas las menciones |
| `extractText(message)` | Extrae texto de cualquier tipo de mensaje |
| `extractQuotedMessage(message)` | Extrae mensaje citado |
| `isGroupAdmin(participant)` | Verifica si es admin |
| `isBotAdmin(participant)` | Verifica si el bot es admin |
| `getSenderJid(message)` | Obtiene JID del remitente |
| `formatJid(jid, type)` | Formatea JID |
| `generateMessageId()` | Genera ID de mensaje |
| `truncateText(text, maxLen)` | Trunca texto con "..." |
| `escapeMarkdown(text)` | Escapa caracteres Markdown |
| `formatPhoneNumber(phone)` | Formatea número de teléfono |
| `CooldownManager` | Gestor de cooldowns por usuario |
| `PermissionManager` | Gestor de permisos por rol |
| `createReply(sock, msg, text, opts)` | Helper para responder mensajes |
| `parseTime(str)` | Parsea strings de tiempo ("5m", "1h") |
| `formatDuration(ms)` | Formatea milisegundos a legible |
| `sendFast(jid, content, sock)` | Envío rápido con delay automático |

```javascript
import { parseCommand, CooldownManager, PermissionManager } from 'yo-soy-yo-baileys';

// Parsear comando
const parsed = parseCommand('.ban @user --reason=spam --days=7');
console.log(parsed);
// { isCommand: true, command: 'ban', args: ['@user'],
//   flags: { reason: 'spam', days: '7' }, prefix: '.' }

// Gestor de cooldowns
const cooldowns = new CooldownManager(5000); // 5 segundos
if (cooldowns.canExecute(userId)) {
  await procesarComando();
  cooldowns.setCooldown(userId);
}

// Gestor de permisos
const perms = new PermissionManager({
  admin: ['ban', 'kick', 'mute'],
  moderator: ['warn', 'mute'],
  user: ['help', 'info']
});

if (perms.hasPermission(userRole, 'ban')) {
  // Proceder con baneo
}
```

---

## 🖼️ Rich Message Utils (rich-message-utils.js)

Mensajes enriquecidos con syntax highlighting, tablas, código y sistema unificado de respuesta.

| Export | Descripción |
|--------|-------------|
| `tokenizeCode(code, lang)` | Tokeniza código para syntax highlighting |
| `toUnified(submessages, uuid)` | Convierte a formato unificado |
| `prepareRichResponseMessage(content)` | Prepara mensaje enriquecido |
| `wrapToBotForwardedMessage(msg)` | Marca como reenviado de bot |
| `botMetadataSignature(msg)` | Firma de metadata del bot |
| `botMetadataCertificate(msg)` | Certificado de metadata |

```javascript
import { prepareRichResponseMessage, tokenizeCode } from 'yo-soy-yo-baileys';

// Crear mensaje con código con syntax highlighting
const codeBlocks = tokenizeCode('const x = 42;', 'javascript');
// [{ highlightType: 'KEYWORD', codeContent: 'const' }, ...]

const richMsg = prepareRichResponseMessage({
  messageType: 'CODE',
  codeMetadata: {
    codeLanguage: 'javascript',
    codeBlocks
  }
});

await sock.sendMessage(jid, richMsg);
```

---

## 📝 Reporting Utils (reporting-utils.js)

Sistema de tokens de reporte para autenticación de mensajes.

| Export | Descripción |
|--------|-------------|
| `getMessageReportingToken(msg)` | Genera token de reporte |
| `shouldIncludeReportingToken(msg)` | Verifica si debe incluir token |

```javascript
import { getMessageReportingToken, shouldIncludeReportingToken } from 'yo-soy-yo-baileys';

if (shouldIncludeReportingToken(message)) {
  const token = getMessageReportingToken(message);
  // Agregar token al mensaje para autenticación
}
```

---

## 🗄️ SQLite Auth State (use-sqlite-auth-state.js)

Sesión de autenticación en SQLite (alternativa a archivos JSON, más rápido y seguro).

| Export | Descripción |
|--------|-------------|
| `useSqliteAuthState(opts)` | Crea estado de auth en SQLite |
| `BufferJSON` | Serializador para Buffers |

> **Requisito:** `npm install better-sqlite3`

```javascript
import { makeWASocket, useSqliteAuthState } from 'yo-soy-yo-baileys';

const { state, saveCreds } = await useSqliteAuthState({
  dbPath: './auth.sqlite'
});

const sock = makeWASocket({
  auth: state,
  // ... otras opciones
});

sock.ev.on('creds.update', saveCreds);
```

---

## 🎨 Banner (banner.js)

Banner ASCII art animado para consola.

| Export | Descripción |
|--------|-------------|
| `YO_SOY_YO_LOGO` | Logo ASCII art |
| `printBanner(version)` | Muestra banner con animación |

```javascript
import { printBanner } from 'yo-soy-yo-baileys';

// Se muestra automáticamente al importar
// O mostrar manualmente:
printBanner('2.0');
```

---

## 🚀 Uso Rápido

### Conexión Básica con Código de Vinculación

```javascript
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from 'yo-soy-yo-baileys'
import { Boom } from '@hapi/boom'

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['YO SOY YO BAILEYS', 'Chrome', '1.0.0'],
    logger: pino({ level: 'silent' })
  })

  // Solicitar código de vinculación
  if (!sock.authState.creds.registered) {
    // Código random automático
    const code = await sock.requestPairingCode('521234567890')
    console.log(`Código de vinculación: ${code}`)

    // O código personalizado (debe ser exactamente 8 caracteres)
    // const code = await sock.requestPairingCode('521234567890', 'ABC12345')
  }

  // Escuchar eventos
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
        : true
      if (shouldReconnect) startBot()
    } else if (connection === 'open') {
      console.log('✅ Conectado a WhatsApp')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', ({ messages }) => {
    const msg = messages[0]
    if (!msg.key.fromMe && msg.message?.conversation) {
      sock.sendMessage(msg.key.remoteJid, {
        text: `Recibí: ${msg.message.conversation}`
      })
    }
  })
}

startBot()
```

### Código de Vinculación Personalizado

Puedes usar un código personalizado en lugar de uno aleatorio:

```javascript
import { makeWASocket, useMultiFileAuthState } from 'yo-soy-yo-baileys'
import { Boom } from '@hapi/boom'

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['YO SOY YO BAILEYS', 'Chrome', '1.0.0']
  })

  sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'close') {
      // Código personalizado (debe ser exactamente 8 caracteres)
      const customCode = 'ABC12345'
      const code = await sock.requestPairingCode('521234567890', customCode)
      console.log(`Tu código personalizado: ${code}`)
    }
  })

  sock.ev.on('creds.update', saveCreds)
}

startBot()
```

**Requisitos del código personalizado:**
- Exactamente **8 caracteres**
- Puede contener letras (A-Z) y números (0-9)
- Ejemplos: `ABC12345`, `YO-SOY01`, `BOT2024`

> **Nota:** WhatsApp enviará una notificación push al teléfono con el código para ingresarlo en WhatsApp Web/Desktop.

### Enviar Mensajes

```javascript
// Texto simple
await sock.sendMessage('521234567890@s.whatsapp.net', { text: '¡Hola desde YO SOY YO BAILEYS!' })

// Imagen con pie
await sock.sendMessage('521234567890@s.whatsapp.net', {
  image: { url: 'https://ejemplo.com/imagen.jpg' },
  caption: 'Foto genial'
})

// Video
await sock.sendMessage('521234567890@s.whatsapp.net', {
  video: { url: 'https://ejemplo.com/video.mp4' },
  caption: 'Mi video'
})

// Documento
await sock.sendMessage('521234567890@s.whatsapp.net', {
  document: { url: 'https://ejemplo.com/doc.pdf' },
  fileName: 'documento.pdf',
  mimetype: 'application/pdf'
})

// Audio (como nota de voz)
await sock.sendMessage('521234567890@s.whatsapp.net', {
  audio: { url: 'https://ejemplo.com/audio.mp3' },
  mimetype: 'audio/mp4',
  ptt: true
})

// Sticker
await sock.sendMessage('521234567890@s.whatsapp.net', {
  sticker: { url: 'https://ejemplo.com/sticker.webp' }
})

// Contacto
await sock.sendMessage('521234567890@s.whatsapp.net', {
  contacts: {
    displayName: 'Juan Pérez',
    contacts: [{ vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Juan Pérez\nTEL;type=CELL:521234567890\nEND:VCARD' }]
  }
})

// Ubicación
await sock.sendMessage('521234567890@s.whatsapp.net', {
  location: { degreesLatitude: 19.4326, degreesLongitude: -99.1332 }
})

// Botones interactivos
await sock.sendMessage('521234567890@s.whatsapp.net', {
  text: 'Elige una opción:',
  buttons: [
    { buttonId: '1', buttonText: { displayText: 'Opción 1' }, type: 1 },
    { buttonId: '2', buttonText: { displayText: 'Opción 2' }, type: 1 }
  ]
})

// Lista interactiva
await sock.sendMessage('521234567890@s.whatsapp.net', {
  text: 'Selecciona del menú:',
  sections: [{
    title: 'Comidas',
    rows: [
      { title: 'Hamburguesa', description: '$10', rowId: 'hamburguesa' },
      { title: 'Pizza', description: '$15', rowId: 'pizza' }
    ]
  }]
})

// Álbum (múltiples imágenes)
await sock.sendMessage('521234567890@s.whatsapp.net', {
  album: [
    { image: { url: 'https://ejemplo.com/img1.jpg' }, caption: 'Foto 1' },
    { image: { url: 'https://ejemplo.com/img2.jpg' }, caption: 'Foto 2' },
    { image: { url: 'https://ejemplo.com/img3.jpg' }, caption: 'Foto 3' }
  ]
})

// Reaccionar a un mensaje
await sock.sendMessage('521234567890@s.whatsapp.net', {
  react: { text: '❤️', key: mensajeOriginal.key }
})
```

---

## 📚 Arquitectura

YO SOY YO BAILEYS utiliza un **patrón de composición en capas**. Cada capa agrega funcionalidad específica:

```
makeWASocket(config)
  └─ makeCommunitiesSocket(config)    → Comunidades
      └─ makeBusinessSocket(config)   → Negocios/Catálogo
          └─ makeMessagesRecvSocket(config) → Recepción de mensajes
              └─ makeMessagesSocket(config) → Envío de mensajes
                  └─ makeGroupsSocket(config) → Gestión de grupos
                      └─ makeChatsSocket(config) → Chats/Privacidad
                          └─ makeSocket(config)  → Conexión base (WS + Noise + Queries)
                              └─ WebSocketClient → Transporte WebSocket
```

El resultado es un único objeto `sock` con **todos los métodos disponibles**.

---

## 📖 API Completa

### 🔌 Conexión (`makeSocket`)

| Método | Descripción |
|--------|-------------|
| `ws` | Instancia del WebSocketClient |
| `ev` | Emisor de eventos tipado |
| `authState` | Credenciales y almacén de claves |
| `user` | Información del usuario actual |
| `query(node, timeoutMs?)` | Enviar consulta IQ |
| `sendNode(frame)` | Enviar nodo binario |
| `sendRawMessage(data)` | Enviar datos binarios crudos |
| `logout()` | Cerrar sesión |
| `end(error?)` | Desconectar |
| `requestPairingCode(phoneNumber, customCode?)` | Obtener código de vinculación (custom: 8 caracteres) |
| `waitForConnectionUpdate(check)` | Esperar actualización de conexión |
| `generateMessageTag()` | Generar tag único para mensajes |

### 💬 Chats y Privacidad (`makeChatsSocket`)

| Método | Descripción |
|--------|-------------|
| `fetchPrivacySettings()` | Obtener configuración de privacidad |
| `updateLastSeenPrivacy(value)` | Actualizar privacidad de última vez |
| `updateOnlinePrivacy(value)` | Privacidad de estado en línea |
| `updateProfilePicturePrivacy(value)` | Privacidad de foto de perfil |
| `updateStatusPrivacy(value)` | Privacidad de estado |
| `updateReadReceiptsPrivacy(value)` | Privacidad de confirmaciones de lectura |
| `updateGroupsAddPrivacy(value)` | Quién puede agregarte a grupos |
| `updateDefaultDisappearingMode(value)` | Modo de desaparición predeterminado |
| `sendPresenceUpdate(type, toJid?)` | Enviar presencia (online/escribiendo/grabando) |
| `presenceSubscribe(toJid)` | Suscribirse a presencia de contacto |
| `profilePictureUrl(jid, type?)` | Obtener URL de foto de perfil |
| `fetchBlocklist()` | Obtener lista de bloqueados |
| `updateBlockStatus(jid, action)` | Bloquear/desbloquear |
| `fetchStatus(...jids)` | Obtener estados de contacto |
| `updateProfilePicture(jid, img)` | Actualizar foto de perfil |
| `removeProfilePicture(jid)` | Eliminar foto de perfil |
| `updateProfileName(name)` | Actualizar nombre de perfil |
| `updateProfileStatus(status)` | Actualizar estado |
| `chatModify(mod, jid)` | Archivar, silenciar, fijar, marcar leído, eliminar chat |
| `resyncAppState(collections)` | Resincronizar estado de la app |
| `star(jid, messages, star)` | Marcar/desmarcar mensajes con estrella |
| `addLabel(label)` | Crear etiqueta |
| `removeLabel(jid)` | Eliminar etiqueta |
| `addChatLabel(jid, labelId)` | Asignar etiqueta a chat |
| `removeChatLabel(jid, labelId)` | Quitar etiqueta de chat |
| `addOrEditContact(jid, name)` | Añadir/editar contacto |
| `addOrEditQuickReply(shortcut, message)` | Añadir/editar respuesta rápida |
| `removeQuickReply(shortcut)` | Eliminar respuesta rápida |
| `createCallLink(type, event)` | Crear enlace de llamada |

### ✉️ Envío de Mensajes (`makeMessagesSocket`)

| Método | Descripción |
|--------|-------------|
| `sendMessage(jid, content, options?)` | **Función universal de envío** |
| `relayMessage(jid, message, opts)` | Retransmisión directa de mensaje |
| `sendReceipt(jid, participant, keys)` | Enviar recibo |
| `readMessages(keys)` | Marcar mensajes como leídos |
| `refreshMediaConn()` | Refrescar conexión de medios |
| `waUploadToServer(upload, conn)` | Subir archivo a servidores WA |
| `sendStatusMention(content, jids)` | Mensaje de estado con menciones |
| `updateMediaMessage(message)` | Re-descargar/descifrar medio |
| `sendPreview(jid, url)`, `sendPreviewV2(jid, url)` | Enviar vista previa de enlace |
| `sendList(jid, title, desc, buttonText, sections)` | Enviar lista interactiva |
| `sendTable(jid, title, columns, rows)`, `sendTableV2(...)` | Enviar tabla |
| `sendCodeBlock(jid, code, lang)`, `sendCodeBlockV2(...)` | Enviar bloque de código |
| `sendLink(jid, url, title, body)`, `sendLinkV2(...)` | Enviar enlace |
| `sendLatex(jid, latex)`, `sendLatexImage(...)`, `sendLatexInlineImage(...)` | Enviar LaTeX |
| `sendRichMessage(jid, rich)` | Mensaje enriquecido personalizado |
| `sendPeerDataOperationMessage(...)` | Mensaje de operación P2P |
| `swgc(jid, content)` | Enviar a estado/gallery |

### 📥 Recepción de Mensajes (`makeMessagesRecvSocket`)

| Método | Descripción |
|--------|-------------|
| `sendMessageAck(keys, type)` | Confirmar recepción de mensaje |
| `sendRetryRequest(key, ...)` | Solicitar reintento de mensaje |
| `rejectCall(jid, callId)` | Rechazar llamada entrante |
| `fetchMessageHistory(count, oldestKey?, timestamp?)` | Solicitar historial bajo demanda |
| `requestPlaceholderResend(ids)` | Solicitar reenvío de placeholders |
| `messageRetryManager` | Gestor de reintentos |

### 👥 Grupos (`makeGroupsSocket`)

| Método | Descripción |
|--------|-------------|
| `groupMetadata(jid)` | Obtener metadatos del grupo |
| `groupCreate(subject, participants)` | Crear grupo |
| `groupLeave(id)` | Salir del grupo |
| `groupUpdateSubject(jid, subject)` | Cambiar nombre del grupo |
| `groupParticipantsUpdate(jid, participants, action)` | Agregar/eliminar/ascender/descender |
| `groupUpdateDescription(jid, desc)` | Cambiar descripción |
| `groupInviteCode(jid)` | Obtener código de invitación |
| `groupRevokeInvite(jid)` | Revocar código de invitación |
| `groupAcceptInvite(code)` | Aceptar invitación por código |
| `groupAcceptInviteV4(jid, invite)` | Aceptar invitación V4 |
| `groupGetInviteInfo(code)` | Obtener info del grupo por código |
| `groupToggleEphemeral(jid, expiration)` | Activar mensajes temporales |
| `groupSettingUpdate(jid, setting)` | Actualizar configuración (anuncio/solo admins) |
| `groupMemberAddMode(jid, mode)` | Modo de agregar miembros |
| `groupJoinApprovalMode(jid, mode)` | Modo de aprobación de unión |
| `groupRequestParticipantsList(jid)` | Lista de solicitudes de unión |
| `groupRequestParticipantsUpdate(jid, participants, action)` | Aprobar/rechazar solicitudes |
| `groupFetchAllParticipating()` | Obtener todos los grupos |

### 📢 Newsletters / Canales (`makeNewsletterSocket`)

| Método | Descripción |
|--------|-------------|
| `newsletterCreate(name, desc?)` | Crear canal |
| `newsletterMetadata(type, key)` | Obtener metadatos del canal |
| `newsletterFollow(jid)` | Seguir canal |
| `newsletterUnfollow(jid)` | Dejar de seguir canal |
| `newsletterMute(jid)` | Silenciar canal |
| `newsletterUnmute(jid)` | Reactivar sonido del canal |
| `newsletterUpdateName(jid, name)` | Actualizar nombre del canal |
| `newsletterUpdateDescription(jid, desc)` | Actualizar descripción |
| `newsletterUpdatePicture(jid, img)` | Actualizar foto del canal |
| `newsletterRemovePicture(jid)` | Eliminar foto del canal |
| `newsletterReactMessage(jid, serverId, reaction)` | Reaccionar a publicación |
| `newsletterFetchMessages(jid, count?)` | Obtener publicaciones del canal |
| `newsletterSubscribers(jid)` | Obtener conteo de suscriptores |
| `newsletterDelete(jid)` | Eliminar canal |
| `newsletterFetchAllSubscribe()` | Listar canales seguidos |
| `newsletterMultipleFollow(jids)` | Seguir múltiples canales |
| `cekIDSaluran(url)` | Resolver URL de canal a ID |
| `subscribeNewsletterUpdates(jid)` | Suscribirse a actualizaciones en vivo |

### 🏪 Negocios (`makeBusinessSocket`)

| Método | Descripción |
|--------|-------------|
| `getCatalog({ jid, limit?, cursor? })` | Obtener catálogo de productos |
| `getCollections(jid, limit?)` | Obtener colecciones |
| `productCreate(create)` | Crear producto |
| `productUpdate(id, update)` | Actualizar producto |
| `productDelete(ids)` | Eliminar producto(s) |
| `getOrderDetails(orderId, token)` | Obtener detalles de orden |
| `updateBusinessProfile(args)` | Actualizar perfil de negocio |

### 🏘️ Comunidades (`makeCommunitiesSocket`)

| Método | Descripción |
|--------|-------------|
| `communityMetadata(jid)` | Obtener metadatos de comunidad |
| `communityCreate(subject, body?)` | Crear comunidad |
| `communityCreateGroup(subject, participants, parentCommunityJid)` | Crear grupo en comunidad |
| `communityLeave(id)` | Salir de comunidad |
| `communityUpdateSubject(jid, subject)` | Renombrar comunidad |
| `communityLinkGroup(groupJid, parentCommunityJid)` | Vincular grupo a comunidad |
| `communityUnlinkGroup(groupJid)` | Desvincular grupo |
| `communityFetchLinkedGroups(jid)` | Listar grupos vinculados |

---

## 📡 Sistema de Eventos

Los eventos están tipados y se manejan a través de `sock.ev`, una instancia de `BaileysEventEmitter`.

### Eventos Disponibles

| Evento | Descripción |
|--------|-------------|
| `connection.update` | Cambios en el estado de la conexión |
| `creds.update` | Actualización de credenciales |
| `messaging-history.set` | Sincronización inicial de historial |
| `chats.upsert` | Chats nuevos |
| `chats.update` | Chats actualizados |
| `chats.delete` | Chats eliminados |
| `presence.update` | Cambio de presencia de contacto |
| `contacts.upsert` | Contactos nuevos |
| `contacts.update` | Contactos actualizados |
| `messages.upsert` | Mensajes nuevos (entrantes/salientes) |
| `messages.update` | Mensajes actualizados (edición, estado) |
| `messages.delete` | Mensajes eliminados |
| `messages.reaction` | Reacciones a mensajes |
| `messages.media-update` | Actualización de medios |
| `message-receipt.update` | Confirmaciones de lectura/entrega |
| `groups.upsert` | Grupos nuevos |
| `groups.update` | Grupos actualizados |
| `group-participants.update` | Participantes agregados/eliminados |
| `group.join-request` | Solicitudes de unión a grupos |
| `blocklist.set` | Lista de bloqueados actualizada |
| `blocklist.update` | Bloqueo/desbloqueo |
| `call` | Llamadas entrantes/salientes |
| `labels.edit` | Etiquetas editadas |
| `labels.association` | Asociación de etiquetas |
| `newsletter.reaction` | Reacciones en newsletters |
| `newsletter.view` | Vistas en newsletters |
| `newsletter-participants.update` | Participantes de newsletter |
| `newsletter-settings.update` | Configuración de newsletter |
| `settings.update` | Configuración de cuenta |
| `lid-mapping.update` | Mapeo LID actualizado |

### Ejemplo de Manejo de Eventos

```javascript
sock.ev.on('messages.upsert', ({ messages, type }) => {
  for (const msg of messages) {
    if (type === 'notify') {
      // Mensaje nuevo en tiempo real
      console.log('Mensaje recibido:', msg.key)
    }
  }
})

sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
  if (qr) console.log('Escanea este QR:', qr)
})

sock.ev.on('call', ({ call }) => {
  console.log('Llamada de:', call[0].from)
  // Rechazar automáticamente
  sock.rejectCall(call[0].from, call[0].id)
})
```

---

## 🛠️ Configuración

### SocketConfig

```typescript
interface SocketConfig {
  auth: AuthenticationState
  logger?: Logger
  transactionOpts?: TransactionCapabilityOptions
  appStateMacVerification?: AppStateMacVerification
  defaultQueryTimeoutMs?: number
  maxMsgRetryCount?: number
  connectTimeoutMs?: number
  keepAliveIntervalMs?: number
  linkPreviewImageThumbnailWidth?: number
  transactionAuth?: number[]
  fireAndForget?: boolean
  retryRequestDelayMs?: number
  markOnlineOnConnect?: boolean
  printQRInTerminal?: boolean
  browser?: [string, string, string]
  agent?: Agent
  msgRetryCounterCache?: NodeCache
  generateHighQualityLinkPreview?: boolean
  options?: WebSocketOptions
  backgroundRead?: boolean
  shouldIgnoreJid?: (jid: string) => boolean
  shouldSyncHistory?: (msg: proto.Message.IHistorySyncNotification) => boolean
  patchMessageBeforeSending?: (msg: proto.IMessage) => Promise<proto.IMessage>
  autoFollowNewsletterOnConnect?: boolean
  autoFollowNewsletterJid?: string
  historyCache?: HistoryCache
  cachedGroupMetadata?: (jid: string) => Promise<GroupMetadata>
  cachedNewsletterMetadata?: (jid: string) => Promise<NewsletterMetadata>
}
```

---

## 🔐 Autenticación

### Almacenamiento Multi-Archivo

```javascript
import { useMultiFileAuthState } from 'yo-soy-yo-baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info')

// state.creds contiene:
// - signedIdentityKey: Clave de identidad firmada
// - signedPreKey: Clave pre-firmada
// - registrationId: ID de registro
// - advSecretKey: Clave secreta ADV
// - me: Información del usuario
// - account: Información de la cuenta
```

Las credenciales se guardan en el directorio especificado (`auth_info/`):
- `creds.json` — Credenciales de autenticación
- `pre-key-{id}.json` — Claves pre
- `session-{id}.json` — Sesiones de dispositivo
- `app-state-sync-{id}.json` — Sincronización de estado de la app
- `sender-key-{id}.json` — Claves de remitente para grupos

---

## 🧩 Dependencias

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@cacheable/node-cache` | ^1.4.0 | Caché en memoria |
| `@hapi/boom` | ^9.1.3 | Errores HTTP amigables |
| `async-mutex` | ^0.5.0 | Mutex para concurrencia |
| `fflate` | ^0.8.0 | Compresión/descompresión |
| `libsignal` | git | Protocolo Signal |
| `lru-cache` | ^11.1.0 | Caché LRU |
| `music-metadata` | ^11.7.0 | Metadatos de audio |
| `p-queue` | ^9.0.0 | Cola de promesas |
| `pino` | ^9.6 | Logging |
| `protobufjs` | ^7.2.4 | Protocol Buffers |
| `whatsapp-rust-bridge` | 0.5.2 | Bridge criptográfico Rust |
| `ws` | ^8.13.0 | WebSocket |

### Dependencias Opcionales (Peer)

| Paquete | Propósito |
|---------|-----------|
| `audio-decode` | Decodificación de audio |
| `jimp` | Procesamiento de imágenes |
| `link-preview-js` | Generación de vistas previas |
| `sharp` | Procesamiento de imágenes (rendimiento) |

---

## 📁 Estructura del Proyecto

```
yo-soy-yo-baileys/
├── lib/
│   ├── index.js                  # Punto de entrada principal
│   ├── index.d.ts                # Declaraciones TypeScript
│   ├── Defaults/                 # Configuraciones por defecto
│   ├── Signal/                   # Implementación del Protocolo Signal
│   ├── Socket/                   # Capas de conexión (core, chats, mensajes, grupos, etc.)
│   ├── Types/                    # Definiciones de tipos TypeScript
│   ├── Utils/                    # Utilidades (cripto, mensajes, medios, auth, etc.)
│   ├── WABinary/                 # Codificación/decodificación del protocolo binario
│   ├── WAM/                      # Analíticas y métricas de WhatsApp
│   └── WAUSync/                  # Sincronización de usuarios
├── WAProto/                      # Protocol Buffers de WhatsApp
│   ├── WAProto.proto             # Definición .proto (6035 líneas)
│   ├── index.js                  # Código JS generado
│   └── index.d.ts                # Tipos para protobuf
├── package.json
├── LICENSE                       # MIT License
└── README.md                     # Este archivo
```

---

## 🆕 Funciones Nuevas en v2.0

### 🔧 Utilidades LID (lid-utils)

Sistema de resolución automática de LID (Linked Identity) a JID normal. WhatsApp usa LIDs internamente, esta utilidad los convierte a números de teléfono reales.

#### Funciones disponibles

| Función | Descripción |
|---------|-------------|
| `isLid(jid)` | Verifica si un JID es formato LID |
| `isLidConverted(jid)` | Detecta JID con número LID disfrazado de PN |
| `lidToJid(jid)` | Convierte LID a formato `@s.whatsapp.net` |
| `lidToJidSafe(jid)` | Versión segura (retorna `null` si no puede) |
| `extractNumber(jid)` | Extrae número de cualquier JID |
| `resolveLidFromParticipants(jid, participants)` | Resuelve LID usando metadata de grupo |
| `resolveAnyLidToJid(jid, participants)` | Resolución completa con caché |
| `convertLidArray(jids, participants)` | Convierte array de JIDs |
| `decodeAndNormalize(jid)` | Decodifica y normaliza JID |
| `resolveParticipant(msg, sock)` | Resuelve participant desde mensaje |
| `getParticipantJid(participant)` | Obtiene JID real de participant |
| `getParticipantJids(participants)` | Array de JIDs reales |
| `findParticipantByNumber(participants, targetJid)` | Busca participant por número |
| `cacheParticipantLids(participants)` | Cachea mappings LID-JID |
| `getCachedJid(lid)` | Obtiene JID del caché |
| `normalizeToPhoneNumber(jid, participants)` | Convierte a número telefónico |
| `cacheLidJid(lid, jid)` | Guarda mapping en caché |
| `resolveFromSock(jid, sock)` | Resuelve usando sock.store |
| `getLidCacheSize()` | Tamaño del caché |
| `savePersistentCache()` | Guarda caché a disco |

#### Ejemplo de uso

```javascript
import { resolveAnyLidToJid, cacheParticipantLids, getParticipantJid } from 'yo-soy-yo-baileys';

// Obtener metadata del grupo
const metadata = await sock.groupMetadata('120363...@g.us');

// Cachear participant LIDs automáticamente
// (esto ya se hace automáticamente al obtener metadata)

// Resolver un LID a JID real
const jidReal = resolveAnyLidToJid('1234567890@lid', metadata.participants);
console.log(jidReal); // "521234567890@s.whatsapp.net"

// Obtener JID real de un participant
const participant = metadata.participants[0];
const jid = getParticipantJid(participant);
console.log(jid); // "521234567890@s.whatsapp.net"

// El caché se persiste automáticamente en database/lid-cache.json
```

#### Integración automática

- Los LIDs se resuelven automáticamente al recibir mensajes
- Los mappings se cachean al obtener metadata de grupos
- El caché se persiste en `database/lid-cache.json`

---

### ⏰ Mensajes Programados (scheduled-messages)

Sistema completo de mensajes programados con soporte para envío único y recurrente (cron).

#### Funciones disponibles

| Función | Descripción |
|---------|-------------|
| `scheduleMessage(jid, content, timestamp)` | Enviar en fecha/hora específica |
| `recurringMessage(jid, content, cron)` | Mensajes recurrentes con cron |
| `cancelScheduledMessage(id)` | Cancelar mensaje programado |
| `deleteScheduledMessage(id)` | Eliminar permanentemente |
| `listScheduledMessages(filter)` | Listar todos con filtros |
| `getScheduledMessage(id)` | Obtener por ID |
| `updateScheduledMessage(id, updates)` | Actualizar contenido |
| `getSchedulerStats()` | Estadísticas del scheduler |
| `startScheduler(sock, intervalMs)` | Iniciar scheduler |
| `stopScheduler()` | Detener scheduler |

#### Ejemplo de uso

```javascript
import {
    makeWASocket,
    startScheduler,
    scheduleMessage,
    recurringMessage,
    cancelScheduledMessage,
    listScheduledMessages,
    getSchedulerStats
} from 'yo-soy-yo-baileys';

const sock = makeWASocket({ /* config */ });

// ⚠️ IMPORTANTE: Iniciar el scheduler al conectar
sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'open') {
        startScheduler(sock); // Verifica cada 30 segundos
    }
});

// Enviar mensaje en 5 minutos
const id1 = scheduleMessage(
    '521234567890@s.whatsapp.net',
    { text: 'Hola! Este es un mensaje programado' },
    Date.now() + 5 * 60 * 1000
);
console.log('Programado:', id1);

// Enviar mensaje en una fecha específica
const fecha = new Date('2025-12-25T09:00:00');
const id2 = scheduleMessage(
    '521234567890@s.whatsapp.net',
    { text: 'Feliz Navidad!' },
    fecha
);

// Enviar todos los días a las 9am
const id3 = recurringMessage(
    '521234567890@s.whatsapp.net',
    { text: 'Buenos días! ☀️' },
    '0 9 * * *' // cron: minuto hora día mes día_semana
);

// Enviar lunes a viernes a las 8am
const id4 = recurringMessage(
    'grupo@g.us',
    { text: 'Buenos días equipo!' },
    '0 8 * * 1-5'
);

// Enviar cada hora
const id5 = recurringMessage(
    '521234567890@s.whatsapp.net',
    { text: 'Reporte horario' },
    '0 * * * *'
);

// Listar mensajes programados
const pending = listScheduledMessages({ pending: true });
console.log('Pendientes:', pending.length);

// Ver estadísticas
const stats = getSchedulerStats();
console.log(stats);
// { total: 5, pending: 3, sent: 1, recurring: 1, cancelled: 0, errors: 0 }

// Cancelar un mensaje
cancelScheduledMessage(id1);
```

#### Formato Cron

```
┌───────────── minuto (0-59)
│ ┌───────────── hora (0-23)
│ │ ┌───────────── día del mes (1-31)
│ │ │ ┌───────────── mes (1-12)
│ │ │ │ ┌───────────── día de la semana (0-6, 0=domingo)
│ │ │ │ │
* * * * *
```

**Ejemplos:**
- `0 9 * * *` → Todos los días a las 9:00
- `0 8 * * 1-5` → Lunes a viernes a las 8:00
- `30 18 * * 0` → Domingos a las 6:30pm
- `0 */2 * * *` → Cada 2 horas
- `*/15 * * * *` → Cada 15 minutos

#### Persistencia

Los mensajes programados se guardan en `database/scheduled-messages.json` y sobreviven reinicios del proceso.

---

## 📱 Estados / Status (swgc, fetchStatus)

Sistema de estados de WhatsApp con soporte para perfil (bio) y estados de grupo.

### Funciones disponibles

| Función | Descripción |
|---------|-------------|
| `fetchStatus(jids)` | Obtener bio/estado de perfil de usuarios |
| `swgc(jid, content)` | Publicar estado de grupo (stories de grupo) |
| `status@broadcast` | JID para broadcast de estados |

### Obtener bio de contacto

```javascript
import { makeWASocket } from 'yo-soy-yo-baileys';

const sock = makeWASocket({ /* config */ });

// Obtener bio de un contacto
const status = await sock.fetchStatus('521234567890@s.whatsapp.net');
console.log(status);
// { status: "En línea", setAt: Date }

// Obtener bio de varios contactos
const statuses = await sock.fetchStatus(
  '521234567890@s.whatsapp.net',
  '521098765432@s.whatsapp.net'
);
statuses.forEach(s => {
  console.log(`${s.jid}: ${s.status}`);
});
```

### Publicar estado de grupo (swgc)

```javascript
// Publicar texto como estado de grupo
await sock.swgc('groupid@g.us', {
  text: 'Estado del grupo actualizado'
});

// Publicar imagen como estado de grupo
const { default: fs } = await import('fs');
const imageBuffer = fs.readFileSync('./foto.jpg');

await sock.swgc('groupid@g.us', {
  image: imageBuffer,
  caption: 'Nueva foto del grupo'
});
```

### Escuchar estados de contactos

Los estados de contactos se reciben como mensajes normales con el JID `status@broadcast`:

```javascript
sock.ev.on('messages.upsert', ({ messages }) => {
  for (const msg of messages) {
    if (msg.key.remoteJid === 'status@broadcast') {
      console.log('Estado recibido de:', msg.key.participant);
      console.log('Contenido:', msg.message);

      // Marcar como visto enviando receipt
      await sock.readMessages([msg.key]);
    }
  }
});
```

### Enviar estado personal

```javascript
// Enviar texto como tu estado
await sock.sendMessage('status@broadcast', {
  text: 'Mi nuevo estado'
});

// Enviar imagen como tu estado
await sock.sendMessage('status@broadcast', {
  image: './mi-foto.jpg',
  caption: 'Mi nueva foto'
});

// Enviar video como tu estado
await sock.sendMessage('status@broadcast', {
  video: './mi-video.mp4',
  caption: 'Mi nuevo video'
});
```

| Característica | Original | YO SOY YO BAILEYS |
|---------------|----------|-------------------|
| Mensajes interactivos | ❌ No | ✅ Sí (botones, carruseles) |
| Álbumes de imágenes | ❌ No | ✅ Sí |
| Newsletters mejorados | ❌ No | ✅ Sí (auto-follow, resolver URL) |
| `swgc()` (status/gallery) | ❌ No | ✅ Sí |
| Tablas (v2) | ❌ No | ✅ Sí |
| Bloques de código (v2) | ❌ No | ✅ Sí |
| LaTeX (imagen/inline) | ❌ No | ✅ Sí |
| Sistema de respuesta unificada | ❌ No | ✅ Sí |
| Mensajes de pago | ❌ No | ✅ Sí |
| Vinculación/desvinculación de comunidades | ❌ No | ✅ Sí |
| Resolución automática LID→JID | ❌ No | ✅ Sí (lid-utils) |
| Mensajes programados/cron | ❌ No | ✅ Sí (scheduled-messages) |
| Anti-ban inteligente | ❌ No | ✅ Sí (anti-ban) |
| Reconexión automática | ❌ No | ✅ Sí (smart-reconnect) |
| Cola de mensajes con prioridades | ❌ No | ✅ Sí (message-queue) |
| Caché 2 niveles | ❌ No | ✅ Sí (enhanced-cache) |
| Logger colorizado | ❌ No | ✅ Sí (enhanced-logger) |
| Utilidades para bots | ❌ No | ✅ Sí (bot-utils) |
| Syntax highlighting | ❌ No | ✅ Sí (rich-message-utils) |
| Tokens de reporte | ❌ No | ✅ Sí (reporting-utils) |
| Auth en SQLite | ❌ No | ✅ Sí (sqlite-auth-state) |
| Banner animado | ❌ No | ✅ Sí (banner) |

---

## 📝 Licencia

**MIT License** — Copyright (c) 2025 Rajeh Taher/WhiskeySockets

Modificado y distribuido como **YO SOY YO BAILEYS**.

---

## 🙏 Créditos

- **[WhiskeySockets](https://github.com/WhiskeySockets)** — Mantenedores originales de `@whiskeysockets/baileys`
- **[Rajeh Taher](https://github.com/rajeh-taher)** — Creador original del proyecto
- **[Andresv27728](https://github.com/Andresv27728)** — Creador de YO SOY YO BAILEYS (`573133374132`)
- **Comunidad Open Source** — Contribuciones y mejoras

## 📢 Canal Oficial

- **ID:** `120363399729727124@newsletter`
- **URL:** [YO SOY YO Updates](https://whatsapp.com/channel/0029VbAmMiM96H4KgBHZUn1z)

---

<p align="center">
  <strong>YO SOY YO BAILEYS</strong> — WhatsApp API para Node.js, hecha con ❤️ por Andresv27728
</p>
