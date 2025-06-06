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

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
} = require("@whiskeysockets/baileys");

const chalk = require('chalk');
const pino = require('pino');
const readline = require("readline");
const fs = require('fs');
const qrcode = require("qrcode-terminal");

const { Boom } = require('@hapi/boom');

// Global settings - originally from config.js
global.owner = "6287814960299";
global.namaowner = "G3N⫹⫺";
global.namach = "Informasi Bot & Website 2025";
global.linkch = "https://whatsapp.com/channel/0029Vb51J3fIt5s2oJDnKN1q";
global.idch = "120363398454335006@newsletter";
global.packname = "WhatsApp Bot 2025";
global.author = "https://wa.me/6287814960299";
global.status = true;
global.welcome = true;
global.KEY = "GET APIKEY elevenlabs.io";
global.IDVOICE = "GET ON elevenlabs.io";
global.pairing = "GENTADEV";
global.mess = {
    owner: "Fitur ini khusus untuk owner!",
    group: "Fitur ini untuk dalam grup!",
    private: "Fitur ini untuk dalam private chat!",
};

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(text, resolve)
    });
};

async function clientstart() {
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(`./session`);

    const usePairingCode = true; // Set to true to use pairing code

    const client = makeWASocket({
        printQRInTerminal: false, // Set to true if you want QR in terminal when not using pairing code
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: true,
        version: (await (await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json')).json()).version,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        logger: pino({
            level: 'fatal'
        }),
        auth: {
            creds: state.creds,
            keys: require("@whiskeysockets/baileys").makeCacheableSignalKeyStore(state.keys, pino().child({
                level: 'silent',
                stream: 'store'
            })),
        }
    });

    if (usePairingCode && !client.authState.creds.registered) {
        const phoneNumber = await question(chalk.blue.bold('Masukan Nomor WhatsApp :\n'));
        const code = await client.requestPairingCode(phoneNumber, global.pairing);
        console.log(`${chalk.blue.bold('Pairing code:')} : ${chalk.white.bold(code)}`);
    } else if (!usePairingCode && !client.authState.creds.registered) {
        // Fallback to QR code if not using pairing code and not registered
        client.on('qr', qr => {
            console.log(chalk.yellow.bold('Scan this QR code:'));
            qrcode.generate(qr, { small: true });
        });
    }

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.badSession) {
                console.log(`Bad Session File, Please Delete Session and Scan Again`);
                clientstart();
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log("Connection closed, reconnecting....");
                clientstart();
            } else if (reason === DisconnectReason.connectionLost) {
                console.log("Connection Lost from Server, reconnecting...");
                clientstart();
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
                clientstart();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(`Device Logged Out, Please Delete Session and Scan Again.`);
                fs.rmSync('./session', { recursive: true, force: true });
                clientstart();
            } else if (reason === DisconnectReason.restartRequired) {
                console.log("Restart Required, Restarting...");
                clientstart();
            } else if (reason === DisconnectReason.timedOut) {
                console.log("Connection TimedOut, Reconnecting...");
                clientstart();
            } else {
                console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
                clientstart();
            }
        } else if (connection === 'open') {
            console.log(chalk.green.bold('Client connected!'));
        }
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