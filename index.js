/*
╭────────────────────────────────────────
│ GitHub   : https://github.com/r-serex
│ YouTube  : https://youtube.com/@zxruzx
│ WhatsApp : https://wa.me/6288980698613
│ Telegram : https://rujekaciw.t.me
╰─────────────────────────────────────────
*/

console.clear();
console.log('starting...');
// --- GLOBAL SETTINGS (CONFIG.JS EMBEDDED) ---
global.owner = "6287814960299";
global.namaowner = "G3N⫹⫺";
global.namach = "Informasi Bot & Website 2025";
global.linkch = "https://whatsapp.com/channel/0029Vb51J3fIt5s2oJDnKN1q";
global.idch = "120363398454335006@newsletter";
global.packname = "WhatsApp Bot 2025";
global.author = "https://wa.me/6287814960299";
global.status = true;
global.welcome = true;
global.KEY = "GET APIKEY elevenlabs.io"; // Dummy value
global.IDVOICE = "GET ON elevenlabs.io"; // Dummy value
global.pairing = "GENTADEV";
global.mess = {
    owner: "Fitur ini khusus untuk owner!",
    group: "Fitur ini untuk dalam grup!",
    private: "Fitur ini untuk dalam private chat!",
};
// --- END GLOBAL SETTINGS ---

process.on("uncaughtException", console.error);

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore, // <--- It's here
    makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");

const chalk = require('chalk');
const pino = require('pino');
const readline = require("readline");
const fs = require('fs');
const { Boom } = require('@hapi/boom');

// --- MYFUNCTION.JS EMBEDDED (smsg function) ---
const smsg = (conn, mek, store) => {
    if (!mek.message) return mek;
    if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return mek;
    if (mek.key.id.startsWith('FatihArridho_')) return mek;
    let m = { ...mek };
    let chat = m.message;
    if (typeof chat === 'string') m.body = chat;
    else if (chat) {
        m.body = (chat.messageContextInfo && chat.messageContextInfo.quotedMessage) ? chat.messageContextInfo.quotedMessage : Object.keys(chat)[0] === 'ephemeralMessage' ? Object.keys(chat.ephemeralMessage.message)[0] : Object.keys(chat)[0];
    }
    if (m.key.fromMe) {
        m.sender = conn.user.id;
    } else {
        m.sender = m.key.participant || m.key.remoteJid;
    }
    m.chat = m.key.remoteJid;
    return m;
};
// --- END MYFUNCTION.JS EMBEDDED ---

// --- CONNECTION.JS EMBEDDED (konek function) ---
const konek = async ({ client, update, clientstart, DisconnectReason, Boom }) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
        console.log(chalk.yellow('Scan QR code:'), qr);
    }

    if (connection === 'close') {
        let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason === DisconnectReason.badAuth) {
            console.log(chalk.red('Bad Auth. Delete session and try again.'));
            clientstart();
        } else if (reason === DisconnectReason.connectionClosed) {
            console.log(chalk.yellow('Connection closed, reconnecting...'));
            clientstart();
        } else if (reason === DisconnectReason.connectionLost) {
            console.log(chalk.yellow('Connection lost from server, reconnecting...'));
            clientstart();
        } else if (reason === DisconnectReason.connectionReplaced) {
            console.log(chalk.yellow('Connection replaced, another new session opened, please close the current session first.'));
        } else if (reason === DisconnectReason.loggedOut) {
            console.log(chalk.red('Device logged out, please scan again and run.'));
            clientstart();
        } else if (reason === DisconnectReason.restartRequired) {
            console.log(chalk.yellow('Restart required, restarting...'));
            clientstart();
        } else if (reason === DisconnectReason.timedOut) {
            console.log(chalk.yellow('Connection timed out, reconnecting...'));
            clientstart();
        } else {
            console.log(chalk.red(`Unknown DisconnectReason: ${reason || lastDisconnect?.error}`));
            clientstart();
        }
    } else if (connection === 'open') {
        console.log(chalk.green('Bot is connected!'));
    }
};
// --- END CONNECTION.JS EMBEDDED ---

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(text, resolve);
    });
};

async function clientstart() {
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(`./session`);

    const usePairingCode = true;

    const client = makeWASocket({
        printQRInTerminal: false,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: true,
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }

            return message;
        },
        version: (await (await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json')).json()).version,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        logger: pino({
            level: 'fatal'
        }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino().child({
                level: 'silent',
                stream: 'store'
            })),
        }
    });

    if (usePairingCode && !client.authState.creds.registered) {
        const phoneNumber = await question(chalk.blue.bold('Masukan Nomor WhatsApp :\n'));
        const code = await client.requestPairingCode(phoneNumber, global.pairing);
        console.log(`${chalk.blue.bold('Pairing code:')} : ${chalk.white.bold(code)}`);
    }

    const store = makeInMemoryStore({
        logger: pino().child({
            level: 'silent',
            stream: 'store'
        })
    });

    store.bind(client.ev);

    client.ev.on("messages.upsert", async (chatUpdate, msg) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
            if (!client.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
            if (mek.key.id.startsWith('FatihArridho_')) return;
            const m = smsg(client, mek, store);

            // --- PING Test Logic ---
            if (m.body && m.body.toLowerCase() === 'ping') {
                const startTime = process.hrtime();
                await client.sendMessage(m.chat, { text: 'Pong!' }, { quoted: m });
                const endTime = process.hrtime(startTime);
                const latency = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
                await client.sendMessage(m.chat, { text: `Latency: ${latency}ms` }, { quoted: m });
            }
            // --- End PING Test Logic ---

        } catch (err) {
            console.log(err);
        }
    });

    client.decodeJid = (jid) => {
        if (!jid) return jid;
        // This is a placeholder, actual jidDecode might be needed for complex scenarios
        // let decode = jidDecode(jid) || {};
        // return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        return jid;
    };

    client.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = client.decodeJid(contact.id);
            if (store && store.contacts) store.contacts[id] = {
                id,
                name: contact.notify
            };
        }
    });

    client.public = global.status;

    client.ev.on('connection.update', (update) => {
        konek({ client, update, clientstart, DisconnectReason, Boom });
    });

    client.ev.on('creds.update', saveCreds);
    return client;
}

clientstart();

let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
    require('fs').unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
    delete require.cache[file];
    require(file);
});