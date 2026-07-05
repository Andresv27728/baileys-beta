
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
    const code = await sock.requestPairingCode('521234567890')
    console.log(`Código de vinculación: ${code}`)
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
| `requestPairingCode(phoneNumber)` | Obtener código de vinculación |
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

## 🔍 Diferencias con `@whiskeysockets/baileys` Original

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
