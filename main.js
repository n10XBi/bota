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
require('./settings/config');
process.on("uncaughtException", console.error);

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");

const chalk = require('chalk')
const pino = require('pino');
const readline = require("readline");
const fs = require('fs');
const { Boom } = require('@hapi/boom');

const { smsg } = require('./start/lib/myfunction'); // Keep smsg for message parsing

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(text, resolve)
    });
}

async function clientstart() {
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(`./session`)

    const usePairingCode = true

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
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return
            if (!client.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            if (mek.key.id.startsWith('FatihArridho_')) return;
            const m = smsg(client, mek, store)

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
            console.log(err)
        }
    });

    client.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}; // jidDecode is not imported, but keeping it for structure if you add it back
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
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

    client.public = global.status

    client.ev.on('connection.update', (update) => {
        const { konek } = require('./start/lib/connection/connect')
        konek({ client, update, clientstart, DisconnectReason, Boom })
    })

    client.ev.on('creds.update', saveCreds);
    return client;

}

clientstart()

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
    require('fs').unwatchFile(file)
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m')
    delete require.cache[file]
    require(file)
})