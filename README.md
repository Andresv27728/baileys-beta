
# YO SOY YO BAILEYS

> **WhatsApp Multi-Device API para Node.js** — Fork de `@whiskeysockets/baileys` con soporte ampliado para mensajes interactivos, álbumes, newsletters, formato enriquecido, VoIP, y el sistema Modded de message_builder (Button, Carousel, AIRich/ORich).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![Version](https://img.shields.io/badge/version-0.7.14-blue)

---

## Instalacion

```bash
npm install yo-soy-yo-baileys
```

> **Nota:** Este paquete esta disenado para entornos Node.js `>=20.0.0` con modulos ESM.

---

## Caracteristicas Principales

| Caracteristica | Estado |
|---------------|--------|
| Multi-Dispositivo | Completo |
| Envio/Recepcion de mensajes (texto, imagenes, video, audio, docs, stickers) | Completo |
| Gestion de grupos (crear, editar, invitaciones, aprobaciones) | Completo |
| Comunidades (crear, vincular/desvincular grupos) | Completo |
| Newsletters / Canales (crear, seguir, publicar, reaccionar) | Completo |
| Mensajes interactivos (botones, carruseles, listas) | Completo |
| Albumes / Colecciones de imagenes | Completo |
| Catalogo de negocios y productos | Completo |
| Cifrado de extremo a extremo (Protocolo Signal) | Completo |
| Formato enriquecido (tablas, codigo, LaTeX, enlaces) | Completo |
| Estados / Galeria (swgc) | Completo |
| VoIP (llamadas de voz con WASM/WebRTC) | Completo |
| Modded message_builder (Button, Carousel, AIRich) | Completo |
| Resolucion LID a JID | Completo |
| Mensajes programados / cron | Completo |
| Anti-ban inteligente | Completo |
| Reconexion automatica | Completo |
| Cola de mensajes con prioridades | Completo |

---

## Quick Start

### 1. Proyecto Base

```bash
mkdir my-bot && cd my-bot
npm init -y
```

Asegurate que `package.json` tenga `"type": "module"`:

```json
{
  "name": "my-bot",
  "type": "module",
  "dependencies": {
    "yo-soy-yo-baileys": "latest"
  }
}
```

### 2. Instalar Dependencias

```bash
npm install yo-soy-yo-baileys pino qrcode-terminal
```

### 3. Crear `index.js`

```js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} from "yo-soy-yo-baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

const logger = pino({ level: "silent" });

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger,
    browser: Browsers.ubuntu("Chrome"),
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    }
    if (connection === "open") console.log("Connected!");
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    if (text === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, { text: "Pong!" });
    }
  });
}

startBot();
```

### 4. Ejecutar

```bash
node index.js
```

### 5. Pairing Code

```js
const sock = makeWASocket({
  auth: state,
  logger,
  browser: Browsers.windows("Chrome"),
});

sock.ev.on("connection.update", async ({ connection }) => {
  if (connection === "connecting") {
    const code = await sock.requestPairingCode("6281234567890");
    console.log("Pairing code:", code);
  }
});
```

Codigo personalizado (8 caracteres):

```js
const code = await sock.requestPairingCode("6281234567890", "A1B2C3D4");
```

---

## Arquitectura

```
makeWASocket(config)
  └─ makeCommunitiesSocket(config)    → Comunidades
      └─ makeBusinessSocket(config)   → Negocios/Catalogo
          └─ makeMessagesRecvSocket(config) → Recepcion de mensajes
              └─ makeMessagesSocket(config) → Envio de mensajes
                  └─ makeGroupsSocket(config) → Gestion de grupos
                      └─ makeChatsSocket(config) → Chats/Privacidad
                          └─ makeSocket(config)  → Conexion base (WS + Noise + Queries)
                              └─ WebSocketClient → Transporte WebSocket
```

El resultado es un unico objeto `sock` con **todos los metodos disponibles**.

### Modulos Clave

| Modulo | Path | Descripcion |
|--------|------|-------------|
| **Socket** | `lib/Socket/` | Conexion, mensajeria, grupos, newsletter, negocios, comunidades |
| **Signal** | `lib/Signal/` | Protocolo Signal: encriptacion 1:1, SenderKey grupal, mapeo LID |
| **WABinary** | `lib/WABinary/` | Codificacion/decodificacion binaria del protocolo |
| **Utils** | `lib/Utils/` | Cripto, auth state, noise handler, rich messages, media |
| **WAProto** | `WAProto/` | Protobuf compilado encode/decode |
| **WAUSync** | `lib/WAUSync/` | Protocolo de sincronizacion de usuarios |
| **Modded** | `lib/Modded/` | message_builder.js — Button, Carousel, AIRich, Toolkit |
| **VoIP** | `lib/VoIP/` | Motor de llamadas de voz WASM/WebRTC |

---

## Enviar Mensajes

```js
// Texto
await sock.sendMessage(jid, { text: "Hola!" });

// Texto con mencion
await sock.sendMessage(jid, {
  text: "Hola @628xxx!",
  mentions: ["628xxx@s.whatsapp.net"],
});

// Imagen
await sock.sendMessage(jid, {
  image: { url: "./photo.jpg" },
  caption: "Una foto",
});

// Video
await sock.sendMessage(jid, {
  video: { url: "./video.mp4" },
  caption: "Un video",
});

// Audio (nota de voz)
await sock.sendMessage(jid, {
  audio: { url: "./audio.ogg" },
  mimetype: "audio/ogg; codecs=opus",
  ptt: true,
});

// Sticker
await sock.sendMessage(jid, {
  sticker: { url: "./sticker.webp" },
});

// Documento
await sock.sendMessage(jid, {
  document: { url: "./file.pdf" },
  fileName: "documento.pdf",
  mimetype: "application/pdf",
});

// Reaccion
await sock.sendMessage(jid, {
  react: { key: msg.key, text: "👍" },
});

// Ubicacion
await sock.sendMessage(jid, {
  location: {
    degreesLatitude: -6.2,
    degreesLongitude: 106.8,
    name: "Jakarta",
  },
});

// Contacto
await sock.sendMessage(jid, {
  contacts: {
    displayName: "Contacts",
    contacts: [
      { vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:John\nTEL:+628xxx\nEND:VCARD" },
    ],
  },
});

// Encuesta
await sock.sendMessage(jid, {
  poll: {
    name: "Vote!",
    values: ["Option A", "Option B", "Option C"],
    selectableCount: 1,
  },
});

// Eliminar mensaje
await sock.sendMessage(jid, { delete: msg.key });

// Editar mensaje
await sock.sendMessage(jid, {
  text: "Texto editado",
  edit: msg.key,
});
```

---

## Mensajes Interactivos (Nativo Flow)

### Botones Interactivos

```js
await sock.sendMessage(jid, {
  interactiveMessage: {
    title: "Bienvenido!",
    footer: "Powered by YO SOY YO",
    buttons: [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "Menu",
          id: "menu",
        }),
      },
      {
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "Website",
          url: "https://example.com",
        }),
      },
      {
        name: "cta_copy",
        buttonParamsJson: JSON.stringify({
          display_text: "Copiar Codigo",
          copy_code: "BOT2024",
        }),
      },
    ],
    header: "Elige una opcion",
    image: { url: "https://example.com/banner.jpg" },
  },
});
```

### Lista Interactiva (single_select)

```js
await sock.sendMessage(jid, {
  interactiveMessage: {
    title: "Selecciona Categoria",
    footer: "Powered by YO SOY YO",
    buttons: [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "Menu",
          sections: [
            {
              title: "Juegos",
              rows: [
                { title: "Quiz", id: ".quiz" },
                { title: "Tebak Gambar", id: ".tebakgambar" },
              ],
            },
            {
              title: "Herramientas",
              rows: [
                { title: "Sticker", id: ".sticker" },
                { title: "TTS", id: ".tts" },
              ],
            },
          ],
        }),
      },
    ],
    header: "Bot Menu",
  },
});
```

---

## Albumes

```js
await sock.sendMessage(jid, {
  albumMessage: [
    { image: { url: "./photo1.jpg" }, caption: "Primera" },
    { image: { url: "./photo2.jpg" }, caption: "Segunda" },
    { video: { url: "./clip.mp4" }, caption: "Video" },
  ],
});
```

> Los albumes calculan automaticamente `expectedImageCount` y `expectedVideoCount` segun el contenido.

---

## Mensajes Enriquecidos (AI Rich Response)

### Tabla (V1)

```js
await sock.sendTable(
  jid,
  "Java vs JavaScript",
  ["Feature", "Java", "JavaScript"],
  [
    ["Type", "Compiled", "Interpreted"],
    ["Typing", "Static", "Dynamic"],
    ["Main Use", "Enterprise", "Web, Full-stack"],
  ],
  quoted,
  {
    headerText: "Comparison:",
    footer: "Hope this helps!",
  },
);
```

### Lista

```js
await sock.sendList(
  jid,
  "Bot Info",
  [
    ["Name", "YO SOY YO AI"],
    ["Version", "2.0.0"],
    ["Developer", "Andresv27728"],
  ],
  quoted,
  { footer: "© YO SOY YO" },
);
```

### Bloque de Codigo (V1)

```js
await sock.sendCodeBlock(
  jid,
  `const greeting = "Hello World"
function sayHello(name) {
    return greeting + " " + name
}
sayHello("YO SOY YO")`,
  quoted,
  {
    language: "javascript",
    title: "Ejemplo de Codigo",
    footer: "Powered by YO SOY YO",
  },
);
```

**Lenguajes soportados V1:** `javascript`, `typescript`, `python`

### Tabla V2 (Unified Response)

```js
await sock.sendTableV2(
  jid,
  [
    "Java vs JavaScript", // titulo
    "Feature | Java | JavaScript", // header (pipe-delimited)
    "Type | Compiled | Interpreted;;Typing | Static | Dynamic;;Main Use | Enterprise | Web, Full-stack", // rows (;; separadas, | o , delimitadas)
  ],
  quoted,
  {
    headerText: "Comparison:",
    text: "Here is a comparison table:",
    footer: "Hope this helps!",
  },
);
```

**Formato de entrada V2:**
- `table[0]` — titulo
- `table[1]` — header (columnas separadas por `|` o `,`)
- `table[2+]` — filas de datos (`;;` separa filas, `|` o `,` separa columnas)

### Bloque de Codigo V2 (Unified Response)

```js
await sock.sendCodeBlockV2(
  jid,
  `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
  quoted,
  {
    language: "go",
    title: "Ejemplo Go",
    text: "Aqui hay un snippet de Go:",
    footer: "Powered by YO SOY YO",
  },
);
```

**Lenguajes V2:**

| Key | Aliases |
|-----|---------|
| `javascript` | `js`, `typescript`, `ts` |
| `python` | `py` |
| `go` | `golang` |
| `lua` | — |
| `bash` | `sh`, `shell` |

### Link Message (Inline Embeds)

```js
await sock.sendLink(
  jid,
  "Resultados:\n{{IE_0}}link aqui{{/IE_0}}\n{{IE_1}}otro link{{/IE_1}}",
  ["https://example.com/1", "https://example.com/2"],
  quoted,
  {
    headerText: "📁 Uploader V3",
    footer: "Listo!",
    citations: [
      { sourceTitle: "Example 1", citationNumber: 1 },
      { sourceTitle: "Example 2", citationNumber: 2 },
    ],
  },
);
```

### Link V2

```js
await sock.sendLinkV2(
  jid,
  "Resultados:\n- {{IE_0}}Docs oficiales{{/IE_0}}\n- {{IE_1}}GitHub repo{{/IE_1}}",
  [
    { url: "https://docs.example.com", displayName: "Docs", sourceDisplayName: "docs" },
    { url: "https://github.com/example", displayName: "GitHub", sourceDisplayName: "github" },
  ],
  quoted,
  { headerText: "Links", footer: "Referencia" },
);
```

### LaTeX

```js
// LaTeX como imagen
await sock.sendLatexImage(jid, "E = mc^2", quoted);

// LaTeX inline
await sock.sendLatexInlineImage(jid, "E = mc^2", quoted);

// LaTeX como texto
await sock.sendLatex(jid, "E = mc^2", quoted);
```

### Mensaje Enriquecido Personalizado (submessages)

```js
await sock.sendRichMessage(
  jid,
  [
    { messageType: 2, messageText: "Aqui hay info:" },
    {
      messageType: 4,
      tableMetadata: {
        title: "Stats",
        rows: [
          { items: ["Metric", "Value"], isHeading: true },
          { items: ["Users", "1000"] },
          { items: ["Uptime", "99.9%"] },
        ],
      },
    },
    { messageType: 2, messageText: "Y algo de codigo:" },
    {
      messageType: 5,
      codeMetadata: {
        codeLanguage: "javascript",
        codeBlocks: [{ highlightType: 0, codeContent: 'console.log("OK")' }],
      },
    },
  ],
  quoted,
);
```

**Tipos de SubMessage:**

| messageType | Nombre | Campo |
|-------------|--------|-------|
| 0 | UNKNOWN | — |
| 1 | GRID_IMAGE | `gridImageMetadata` |
| 2 | TEXT | `messageText` |
| 3 | INLINE_IMAGE | `imageMetadata` |
| 4 | TABLE | `tableMetadata` |
| 5 | CODE | `codeMetadata` |
| 6 | DYNAMIC | `dynamicMetadata` |
| 7 | MAP | `mapMetadata` |
| 8 | LATEX | `latexMetadata` |
| 9 | CONTENT_ITEMS | `contentItemsMetadata` |

### Otros Tipos de Mensaje

**Pago:**

```js
await sock.sendMessage(jid, {
  requestPaymentMessage: {
    amount: 50000,
    currency: "IDR",
    note: "Pago por orden #123",
    from: "628xxx@s.whatsapp.net",
  },
});
```

**Evento:**

```js
await sock.sendMessage(jid, {
  eventMessage: {
    name: "Meetup Comunidad",
    description: "Unete al meetup mensual!",
    startTime: Date.now() + 86400000,
    endTime: Date.now() + 90000000,
    location: { name: "Jakarta", degreesLatitude: -6.2, degreesLongitude: 106.8 },
  },
});
```

**Producto:**

```js
await sock.sendMessage(jid, {
  productMessage: {
    title: "Audifonos Bluetooth",
    description: "Audifonos bluetooth de alta calidad",
    productId: "WH-001",
    priceAmount1000: 299000,
    currencyCode: "IDR",
    buttons: [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({ display_text: "Comprar", id: "buy_wh001" }),
      },
    ],
  },
});
```

**Estado con menciones:**

```js
await sock.sendStatusMention({ text: "Gran actualizacion!" }, [
  "628xxx@s.whatsapp.net",
  "groupid@g.us",
]);
```

---

## Modded — message_builder.js

Sistema de construccion de mensajes interactivos con clases de alto nivel. Importar desde `yo-soy-yo-baileys`:

```js
import {
  Button, ButtonV2, Carousel, AIRich, ORich, Toolkit
} from "yo-soy-yo-baileys";
```

### Button (Native Flow)

Clase para construir mensajes interactivos nativos con botones, listas, y acciones.

```js
import { Button } from "yo-soy-yo-baileys";

const btn = new Button(sock);

// Establecer header
btn.setTitle("Bienvenido");
btn.setSubtitle("Selecciona una opcion");
btn.setBody("Elige una de las opciones de abajo");
btn.setFooter("Powered by YO SOY YO");

// Establecer media en el header
btn.setImage("https://example.com/banner.jpg");
btn.setVideo("https://example.com/video.mp4");
btn.setDocument("https://example.com/file.pdf", { fileName: "doc.pdf" });

// Agregar botones de respuesta rapida
btn.addReply("Menu", "menu");
btn.addReply("Ayuda", "ayuda");

// Agregar boton de URL
btn.addUrl("Visitar Site", "https://example.com");

// Agregar boton de copiar
btn.addCopy("Copiar Codigo", "BOT2024");

// Agregar boton de llamada
btn.addCall("Llamar", "120363...");

// Agregar recordatorio
btn.addReminder("Recordar tarea", "reminder_id");

// Agregar ubicacion
btn.addLocation();

// Agregar boton de direccion
btn.addAddress("Direccion", "addr_id");

// Crear seccion con selecciones
btn.addSelection("Elige juego", {
  sections: [
    {
      title: "Juegos",
      rows: [
        btn.makeRow("", "Quiz", "Preguntas", "quiz"),
        btn.makeRow("", "Tebak", "Adivinanzas", "tebak"),
      ],
    },
  ],
});

// Construir y enviar
const msg = await btn.build(jid);
await sock.sendMessage(jid, msg);

// O enviar directamente
await btn.send(jid);
```

### ButtonV2 (Legacy Buttons)

Formato legacy de botones con `buttonsMessage`.

```js
import { ButtonV2 } from "yo-soy-yo-baileys";

const btn2 = new ButtonV2(sock);
btn2.setTitle("Elige");
btn2.setBody("Opcion:");
btn2.setFooter("Bot");

btn2.addButton("Si", "yes");
btn2.addButton("No", "no");

// Boton raw
btn2.addRawButton({
  buttonId: "maybe",
  buttonText: { displayText: "Tal vez" },
  type: 1,
});

await btn2.send(jid);
```

### Carousel

Mensajes de carrusel con multiples tarjetas.

```js
import { Carousel, Button } from "yo-soy-yo-baileys";

const carousel = new Carousel(sock);
carousel.setTitle("Galeria");

carousel.addCard((card) => {
  card.image("https://example.com/img1.jpg");
  card.title("Tarjeta 1");
  card.text("Descripcion 1");
  card.button("Ver mas", "view_1");
});

carousel.addCard((card) => {
  card.image("https://example.com/img2.jpg");
  card.title("Tarjeta 2");
  card.text("Descripcion 2");
  card.button("Ver mas", "view_2");
});

await carousel.send(jid);
```

### AIRich / ORich

Sistema de respuestas enriquecidas estilo Meta AI. `ORich` es un alias de `AIRich`.

```js
import { ORich } from "yo-soy-yo-baileys";

const rich = new ORich(sock);

// Agregar texto con auto-parseo de hipervinculos, citas y LaTeX
rich.addText("Hola mundo! Visita https://example.com para mas info.");

// Agregar bloque de codigo con syntax highlighting
rich.addCode("javascript", 'console.log("Hello!");');

// Agregar tabla
rich.addTable([
  ["Nombre", "Version", "Estado"],
  ["Bot", "2.0", "Activo"],
  ["API", "1.5", "Estable"],
]);

// Agregar fuente/cita
rich.addSource([
  { sourceTitle: "Documentation", sourceQuery: "how to code" },
]);

// Agregar carrusel de reels
rich.addReels([
  { mediaUrl: "https://example.com/reel1.mp4", caption: "Reel 1" },
  { mediaUrl: "https://example.com/reel2.mp4", caption: "Reel 2" },
]);

// Agregar imagen
rich.addImage("https://example.com/photo.jpg");

// Agregar video (genera thumbnail automaticamente con ffmpeg)
rich.addVideo("https://example.com/video.mp4");

// Agregar producto
rich.addProduct({
  title: "Premium",
  price: 15000,
  currency: "USD",
  imageUrl: "https://example.com/product.jpg",
});

// Agregar post de redes sociales
rich.addPost({
  author: "Andresv27728",
  text: "Nuevo commit!",
  platform: "github",
});

// Agregar tip
rich.addTip("Este es un consejo util.");

// Agregar sugerencias
rich.addSuggest(["Contame mas", "Siguiente", "Salir"]);

// Construir y enviar
await rich.send(jid);

// O construir sin enviar
const msg = await rich.build({ quoted });
await sock.sendMessage(jid, msg);
```

### Toolkit

Utilidades estaticas para multimedia.

```js
import { Toolkit } from "yo-soy-yo-baileys";

// Extraer hipervinculos y citations de texto
const { hyperlinks, citations } = Toolkit.extractIE("Visita {{IE_0}}aqui{{/IE_0}}");

// Redimensionar imagen (requiere sharp)
const resized = await Toolkit.resize(buffer, 300, 300, 'cover');

// Obtener buffer desde URL
const buf = await Toolkit.fetchBuffer("https://example.com/image.jpg");

// Subir buffer a WhatsApp y obtener URL
const waUrl = await Toolkit.toUrl(sock, buffer, 'image');

// Obtener duracion de MP4
const duration = Toolkit.getMp4Duration(mp4Buffer);

// Obtener preview de video (requiere ffmpeg)
const preview = await Toolkit.getMp4Preview(mp4Buffer, { time: 1 });

// Resolver media (URL, buffer, base64 -> url o buffer)
const resolved = await Toolkit.resolveMedia(sock, media, 'image', {
  result: 'url',
  resize: true,
  width: 300,
  height: 300,
});
```

---

## VoIP (Llamadas de Voz)

Motor de VoIP integrado con WASM/WebRTC. Requiere que el socket este conectado.

### Inicializar VoIP Client

```js
import { VoipClient, CallState } from "yo-soy-yo-baileys";

// Iniciar DESPUES de connection === "open"
if (!global.voipClient) {
  global.voipClient = new VoipClient();
  await global.voipClient.connectWithSocket(sock);
  console.log("VoIP engine activo!");
}
```

### Realizar Llamada

```js
try {
  const call = await global.voipClient.call("6281234567890", {
    durationMs: 60000,
    audioSource: "silence", // "silence" | "mic" | "file"
  });

  call.on("ringing", () => console.log("Sonando..."));
  call.on("connected", () => console.log("Conectado!"));
  call.on("ended", (reason) => console.log("Llamada terminada:", reason));

  // Esperar a que termine
  await call.waitForEnd();
} catch (e) {
  console.error("Error al llamar:", e);
}
```

### CallState

```js
// Estados disponibles
CallState.Idle           // 0 - Sin llamada
CallState.Calling        // 1 - Llamando
CallState.PreacceptReceived // 2 - Pre-aceptacion recibida
CallState.ReceivedCall   // 3 - Llamada entrante
CallState.AcceptSent     // 4 - Aceptacion enviada
CallState.AcceptReceived // 5 - Aceptacion recibida
CallState.Active         // 6 - Llamada activa
CallState.ActiveElsewhere // 7 - Activa en otro dispositivo
CallState.Ending         // 13 - Terminando
```

### Control de Llamada

```js
// Colgar
call.end();

// Mutear/desmutear
call.mute(true);

// Esperar fin
await call.waitForEnd();
```

---

## Newsletters / Canales

```js
// Resolver URL de canal a metadata
const info = await sock.cekIDSaluran("https://whatsapp.com/channel/xxxxx");
console.log(info.name, info.subscribers);

// Seguir multiples canales
await sock.newsletterMultipleFollow("id1@newsletter id2@newsletter");

// Obtener canales seguidos
const channels = await sock.newsletterFetchAllSubscribe();

// Crear canal
const nl = await sock.newsletterCreate("Mi Canal", "Descripcion");

// Obtener metadata
const meta = await sock.newsletterMetadata("jid", "id@newsletter");

// Seguir / Dejar de seguir
await sock.newsletterFollow("id@newsletter");
await sock.newsletterUnfollow("id@newsletter");

// Silenciar / Reactivar
await sock.newsletterMute("id@newsletter");
await sock.newsletterUnmute("id@newsletter");

// Actualizar nombre / descripcion / foto
await sock.newsletterUpdateName("id@newsletter", "Nuevo Nombre");
await sock.newsletterUpdateDescription("id@newsletter", "Nueva Desc");
await sock.newsletterUpdatePicture("id@newsletter", mediaUpload);
await sock.newsletterRemovePicture("id@newsletter");

// Reaccionar a mensaje
await sock.newsletterReactMessage("id@newsletter", serverId, "👍");

// Obtener mensajes
const msgs = await sock.newsletterFetchMessages("id@newsletter", 50);

// Eliminar canal
await sock.newsletterDelete("id@newsletter");
```

---

## Grupos

```js
// Metadata
const meta = await sock.groupMetadata("id@g.us");

// Crear grupo
await sock.groupCreate("Mi Grupo", ["628xxx@s.whatsapp.net"]);

// Salir
await sock.groupLeave("id@g.us");

// Actualizar nombre / descripcion
await sock.groupUpdateSubject("id@g.us", "Nuevo Nombre");
await sock.groupUpdateDescription("id@g.us", "Nueva Desc");

// Participantes: add, remove, promote, demote
await sock.groupParticipantsUpdate("id@g.us", ["628xxx@s.whatsapp.net"], "add");

// Solicitudes de union
const requests = await sock.groupRequestParticipantsList("id@g.us");
await sock.groupRequestParticipantsUpdate("id@g.us", ["628xxx@s.whatsapp.net"], "approve");

// Codigo de invitacion
const code = await sock.groupInviteCode("id@g.us");
await sock.groupRevokeInvite("id@g.us");
await sock.groupAcceptInvite("ABCDE12345");

// Configuracion
await sock.groupSettingUpdate("id@g.us", "announcement");
await sock.groupMemberAddMode("id@g.us", "admin_add");
await sock.groupJoinApprovalMode("id@g.us", "on");
await sock.groupToggleEphemeral("id@g.us", 86400);

// Todos los grupos
const groups = await sock.groupFetchAllParticipating();
```

---

## Comunidades

```js
// Metadata
const meta = await sock.communityMetadata("communityid@g.us");

// Crear comunidad
await sock.communityCreate("Mi Comunidad", "Descripcion");

// Crear sub-grupo
await sock.communityCreateGroup("Anuncios", ["628xxx@s.whatsapp.net"], "communityid@g.us");

// Vincular/desvincular grupo
await sock.communityLinkGroup("groupid@g.us", "communityid@g.us");
await sock.communityUnlinkGroup("groupid@g.us");

// Grupos vinculados
const linked = await sock.communityFetchLinkedGroups("communityid@g.us");

// Salir
await sock.communityLeave("communityid@g.us");
```

---

## Negocios

```js
// Catalogo
const { products } = await sock.getCatalog({ jid: "628xxx@s.whatsapp.net", limit: 10 });
const { collections } = await sock.getCollections("628xxx@s.whatsapp.net", 10);

// CRUD Productos
await sock.productCreate({
  name: "Premium",
  description: "Plan premium",
  price: 150000,
  currency: "IDR",
});

await sock.productUpdate(productId, { name: "Premium Plus" });
await sock.productDelete([productId]);

// Perfil de negocio
await sock.updateBusinessProfile({
  address: "Jakarta",
  description: "Tienda oficial",
  websites: ["https://example.com"],
});

await sock.updateCoverPhoto(mediaUpload);
await sock.removeCoverPhoto(coverId);
```

---

## Perfil y Privacidad

```js
// Foto de perfil
const url = await sock.profilePictureUrl(jid, "image");
await sock.updateProfilePicture(jid, mediaUpload);
await sock.removeProfilePicture(jid);

// Nombre / Estado
await sock.updateProfileName("Mi Nombre");
await sock.updateProfileStatus("Disponible");

// Presencia
await sock.sendPresenceUpdate("available", jid);
await sock.presenceSubscribe(jid);

// Lectura
await sock.readMessages([msg.key]);
await sock.sendReceipt(jid, participant, [msgId], "read");

// Bloquear
await sock.updateBlockStatus(jid, "block");
await sock.updateBlockStatus(jid, "unblock");

// Privacidad
await sock.updateLastSeenPrivacy("all");
await sock.updateOnlinePrivacy("all");
await sock.updateProfilePicturePrivacy("contacts");
await sock.updateStatusPrivacy("contacts");
await sock.updateReadReceiptsPrivacy("all");
await sock.updateGroupsAddPrivacy("all");
await sock.updateDefaultDisappearingMode(86400);
```

---

## Estados / Status (swgc)

```js
// Publicar estado de grupo
await sock.swgc('groupid@g.us', { text: 'Estado actualizado' });
await sock.swgc('groupid@g.us', { image: buffer, caption: 'Nueva foto' });

// Obtener bio de contacto
const status = await sock.fetchStatus('521234567890@s.whatsapp.net');

// Escuchar estados
sock.ev.on('messages.upsert', ({ messages }) => {
  for (const msg of messages) {
    if (msg.key.remoteJid === 'status@broadcast') {
      console.log('Estado de:', msg.key.participant);
      sock.readMessages([msg.key]);
    }
  }
});

// Enviar tu estado
await sock.sendMessage('status@broadcast', { text: 'Mi estado' });
await sock.sendMessage('status@broadcast', { image: './foto.jpg', caption: 'Mi foto' });
```

---

## Eventos

```js
sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {})
sock.ev.on('creds.update', (update) => {})
sock.ev.on('messaging-history.set', ({ chats, contacts, messages, isLatest }) => {})
sock.ev.on('chats.upsert', (chats) => {})
sock.ev.on('chats.update', (updates) => {})
sock.ev.on('chats.delete', (jids) => {})
sock.ev.on('contacts.upsert', (contacts) => {})
sock.ev.on('contacts.update', (updates) => {})
sock.ev.on('messages.upsert', ({ messages, type }) => {})
sock.ev.on('messages.update', (updates) => {})
sock.ev.on('messages.delete', (keys) => {})
sock.ev.on('messages.reaction', (reactions) => {})
sock.ev.on('message-receipt.update', (updates) => {})
sock.ev.on('groups.update', (updates) => {})
sock.ev.on('group-participants.update', (update) => {})
sock.ev.on('group.join-request', (update) => {})
sock.ev.on('call', (calls) => {})
sock.ev.on('labels.edit', (label) => {})
sock.ev.on('labels.associations', ({ associated, label, type }) => {})
sock.ev.on('settings.update', ({ isAutoEmojiEnabled, isReadReceiptsEnabled, ... }) => {})
```

---

## Utilidades

### Anti-Ban (anti-ban.js)

```js
import { RateLimiter, PresenceManager, messageDelay, typingDelay } from 'yo-soy-yo-baileys';

const limiter = new RateLimiter(100, 60000); // 100 msgs/minuto
const presence = new PresenceManager(sock);

if (limiter.canSend(jid)) {
  await typingDelay(text.length);
  await presence.typing(jid);
  await sock.sendMessage(jid, { text });
}
```

### Smart Reconnect (smart-reconnect.js)

```js
import { SmartReconnect, createConnectionHandler } from 'yo-soy-yo-baileys';

const { reconnect } = createConnectionHandler(sock, {
  maxRetries: 10,
  initialDelay: 2000,
  onReconnect: (attempt) => console.log(`Reconectando... intento ${attempt}`),
  onFatal: (reason) => console.error('Error fatal:', reason)
});
```

### Message Queue (message-queue.js)

```js
import { MessageQueue, PRIORITY, createMessageQueue } from 'yo-soy-yo-baileys';

const queue = new MessageQueue(logger, { MAX_QUEUE_SIZE: 500 });

queue.enqueue(
  () => sock.sendMessage(jid, { text: 'Urgente!' }),
  PRIORITY.CRITICAL
);
```

### Enhanced Cache (enhanced-cache.js)

```js
import { EnhancedCache, CacheManager } from 'yo-soy-yo-baileys';

const cache = new EnhancedCache('messages', {
  MAX_SIZE: 5000,
  TTL: 30 * 60 * 1000,
  persistPath: './cache/messages.json'
});
```

### Bot Utils (bot-utils.js)

```js
import { parseCommand, CooldownManager, PermissionManager } from 'yo-soy-yo-baileys';

const parsed = parseCommand('.ban @user --reason=spam --days=7');
// { isCommand: true, command: 'ban', args: ['@user'], flags: { reason: 'spam', days: '7' } }

const cooldowns = new CooldownManager(5000);
if (cooldowns.canExecute(userId)) {
  await procesarComando();
  cooldowns.setCooldown(userId);
}
```

### SQLite Auth State

```js
import { makeWASocket, useSqliteAuthState } from 'yo-soy-yo-baileys';

const { state, saveCreds } = await useSqliteAuthState({ dbPath: './auth.sqlite' });

const sock = makeWASocket({ auth: state });
sock.ev.on('creds.update', saveCreds);
```

### LID Utils

```js
import { resolveAnyLidToJid, cacheParticipantLids, getParticipantJid } from 'yo-soy-yo-baileys';

const metadata = await sock.groupMetadata('120363...@g.us');
const jidReal = resolveAnyLidToJid('1234567890@lid', metadata.participants);
console.log(jidReal); // "521234567890@s.whatsapp.net"
```

### Scheduled Messages

```js
import { startScheduler, scheduleMessage, recurringMessage } from 'yo-soy-yo-baileys';

sock.ev.on('connection.update', ({ connection }) => {
  if (connection === 'open') startScheduler(sock);
});

// Enviar en 5 minutos
scheduleMessage('521234567890@s.whatsapp.net', { text: 'Hola!' }, Date.now() + 300000);

// Enviar todos los dias a las 9am
recurringMessage('grupo@g.us', { text: 'Buenos dias!' }, '0 9 * * *');
```

---

## Exports Completos

```js
import {
  // Auth
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  initAuthCreds,
  BufferJSON,
  fetchLatestBaileysVersion,

  // Code tokenization
  tokenizeCode,
  tokenizeCodeV2,
  CodeHighlightType,
  RichSubMessageType,

  // Rich message generators
  generateTableContent,
  generateTableContentV2,
  toTableMetadataV2,
  generateListContent,
  generateCodeBlockContent,
  generateCodeBlockContentV2,
  generateLinkContent,
  generateLinkContentV2,
  generateRichMessageContent,
  generateLatexContent,
  generateLatexImageContent,
  generateLatexInlineImageContent,
  generateUnifiedResponseContent,
  captureUnifiedResponse,

  // Rich message builders
  buildRichContextInfo,
  buildBotForwardedMessage,

  // Modded message_builder
  Button,
  ButtonV2,
  Carousel,
  AIRich,
  ORich,
  Toolkit,

  // VoIP
  VoipClient,
  ActiveCall,
  CallState,

  // Dugong (advanced message types)
  Dugong,

  // Crypto
  Curve,
  signedKeyPair,
  aesEncryptGCM,
  aesDecryptGCM,

  // JID utilities
  jidEncode,
  jidDecode,
  jidNormalizedUser,
  areJidsSameUser,
  isJidGroup,
  isJidNewsletter,
  isLidUser,
  isPnUser,
  isJidBot,
  isJidMetaAI,
  isJidBroadcast,
  isJidStatusBroadcast,

  // Connection
  DisconnectReason,
  Browsers,

  // Types
  WASocket,
} from "yo-soy-yo-baileys";
```

---

## Dependencias

| Paquete | Version | Proposito |
|---------|---------|-----------|
| `@cacheable/node-cache` | ^1.4.0 | Cache en memoria |
| `@hapi/boom` | ^9.1.3 | Errores HTTP |
| `async-mutex` | ^0.5.0 | Mutex para concurrencia |
| `fflate` | ^0.8.0 | Compresion/descompresion |
| `libsignal` | git | Protocolo Signal |
| `lru-cache` | ^11.1.0 | Cache LRU |
| `music-metadata` | ^11.7.0 | Metadatos de audio |
| `p-queue` | ^9.0.0 | Cola de promesas |
| `pino` | ^9.6 | Logging |
| `protobufjs` | ^7.2.4 | Protocol Buffers |
| `whatsapp-rust-bridge` | 0.5.2 | Bridge criptografico Rust |
| `ws` | ^8.13.0 | WebSocket |

### Dependencias Opcionales

| Paquete | Proposito |
|---------|-----------|
| `sharp` | Procesamiento de imagenes (Toolkit.resize) |
| `jimp` | Procesamiento de imagenes |
| `audio-decode` | Decodificacion de audio (VoIP) |
| `link-preview-js` | Vistas previas de enlaces |
| `@roamhq/wrtc` | WebRTC para VoIP relay transport |

---

## Diferencias con Baileys Oficial

| Area | Baileys Oficial | YO SOY YO BAILEYS |
|------|----------------|-------------------|
| Mensajes interactivos | Sin soporte nativo | Completo via Dugong |
| Albumes | No soportado | Multi-media albums |
| AI Rich Response | No disponible | Tabla, codigo, rich text |
| Table V1 | No disponible | Tabla basica con headers |
| Table V2 | No disponible | Unified response + GenATableUXPrimitive |
| Code Block V1 | No disponible | Syntax highlighting (JS/TS/Python) |
| Code Block V2 | No disponible | Unified response + 6 lenguajes |
| Link Message | No disponible | Inline embeds + citations + verificacion |
| Newsletter extras | Solo basico | Auto-follow, bulk follow, URL resolve |
| Payment messages | No soportado | Completo |
| Event messages | Basico | Enhanceado todos los campos |
| Status mentions | No disponible | `sendStatusMention()` |
| Product messages | No soportado | Catalogo + botones |
| LID support | Basico | Mapeo LID↔PN completo + migracion |
| VoIP | No disponible | Motor WASM/WebRTC integrado |
| Modded Builder | No disponible | Button, Carousel, AIRich/ORich |
| Anti-ban | No disponible | Inteligente con delays |
| Reconexion | Basico | Smart Reconnect con backoff |
| Cola mensajes | No disponible | Prioridades y rate limiting |
| Cache | No disponible | 2 niveles con persistencia |

---

## Estructura del Proyecto

```
yo-soy-yo-baileys/
├── lib/
│   ├── index.js                  # Punto de entrada principal
│   ├── index.d.ts                # Declaraciones TypeScript
│   ├── Defaults/                 # Configuraciones por defecto
│   ├── Signal/                   # Implementacion del Protocolo Signal
│   ├── Socket/                   # Capas de conexion (core, chats, mensajes, grupos, etc.)
│   ├── Types/                    # Definiciones de tipos TypeScript
│   ├── Utils/                    # Utilidades (cripto, mensajes, medios, auth, etc.)
│   ├── WABinary/                 # Codificacion/decodificacion del protocolo binario
│   ├── WAM/                      # Analiticas y metricas de WhatsApp
│   ├── WAUSync/                  # Sincronizacion de usuarios
│   ├── Modded/                   # message_builder.js — Button, Carousel, AIRich, Toolkit
│   ├── VoIP/                     # Motor de llamadas de voz WASM/WebRTC
│   └── assets/wasm/              # Binario WASM de WhatsApp Web
├── WAProto/                      # Protocol Buffers de WhatsApp
├── package.json
├── LICENSE
└── README.md
```

---

## Licencia

**MIT License** — Copyright (c) 2025 Rajeh Taher/WhiskeySockets

Modificado y distribuido como **YO SOY YO BAILEYS**.

---

## Creditos

- **[WhiskeySockets](https://github.com/WhiskeySockets)** — Mantenedores originales de `@whiskeysockets/baileys`
- **[Rajeh Taher](https://github.com/rajeh-taher)** — Creador original del proyecto
- **[LuckyArch/ourin-baileys](https://github.com/LuckyArch/ourin-baileys)** — Modded message_builder, VoIP, y funcionalidades de ourin
- **[Andresv27728](https://github.com/Andresv27728)** — Creador de YO SOY YO BAILEYS (`573133374132`)
- **Comunidad Open Source** — Contribuciones y mejoras

---

<p align="center">
  <strong>YO SOY YO BAILEYS</strong> — WhatsApp API para Node.js, hecha con ❤️ por Andresv27728
</p>
