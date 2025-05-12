require('./maostg');
const {
    default: makeWASocket,
    useMultiFileAuthState
} = require("@adiwajshing/baileys");
const fs = require("fs");
const pino = require("pino");
const lolcatjs = require('lolcatjs');
const path = require('path');
const readline = require("readline");
const { Low, JSONFile } = require('lowdb');
const _ = require('lodash');

const dbFolder = path.resolve(__dirname, './maodb');
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true });

const dbFile = path.join(dbFolder, 'maomaoDB.json');
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({}));

const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

global.db = db;
global.loadDatabase = async function loadDatabase() {
    if (db.data) return;
    await db.read();
    db.data ||= { users: {}, settings: {}, others: {} };
    await db.write();
};
loadDatabase();
setInterval(() => db.write(), 30 * 1000);

// Load commands
global.commands = new Map();
const cmdFolder = path.join(__dirname, 'maoCmd');
fs.readdirSync(cmdFolder).forEach(file => {
    if (file.endsWith('.js')) {
        const cmd = require(path.join(cmdFolder, file));
        if (cmd.name && typeof cmd.maomao === 'function') {
            global.commands.set(cmd.name, cmd);
            lolcatjs.fromString(`[Command Loaded] ${cmd.name} by ${cmd.author}`);
        }
    }
});

// CLI input
const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => rl.question(text, resolve));
};

// Start bot
async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const socket = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true,
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const [cmdName, ...args] = body.trim().split(/\s+/);
        const command = global.commands.get(cmdName.toLowerCase());

        if (command && typeof command.maomao === 'function') {
            try {
                await command.maomao({
                    socket,
                    msg,
                    args,
                    db
                });
            } catch (err) {
                console.error(`[Error] Command ${cmdName}:`, err);
            }
        }
    });

    if (!state.creds.registered) {
        const number = await question('Masukkan nomor (awali 62): ');
        const code = await socket.requestPairingCode(number.trim());
        lolcatjs.fromString(`Kode pairing: ${code}`);
    }
}

start();
