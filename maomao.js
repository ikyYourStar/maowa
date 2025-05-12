/** 
 # ============================ #
 • Author : anggara z
 • Type : plugin n case
 • Java script : cjs
 # ============================ #
**/

require('./maostg')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    jidDecode,
    proto,
    getContentType,
    downloadContentFromMessage,
    fetchLatestWaWebVersion,
    makeCacheableSignalKeyStore
} = require("@adiwajshing/baileys");
const fs = require("fs");
const pino = require("pino");
const lolcatjs = require('lolcatjs')
const path = require('path');
const NodeCache = require("node-cache");
const msgRetryCounterCache = new NodeCache();
const fetch = require("node-fetch")
const FileType = require('file-type')
const _ = require('lodash')
const {
    Boom
} = require("@hapi/boom");
const PhoneNumber = require("awesome-phonenumber");
const readline = require("readline");
const {
    color,
    getBuffer
} = require("../function")
const {
    newSockets,
    smsg
} = require("../simple")
const low = require('../lowdb');
const yargs = require('yargs/yargs');
const {
    Low,
    JSONFile
} = low;
const mongoDB = require('../mongoDB');
const {
    options
} = require('../sockets');

const dbFolder = path.join(__dirname, '../database');
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, {
    recursive: true
});

const dbFile = path.join(dbFolder, 'data.json');
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({}));

let db = new JSONFile(dbFile);
lolcatjs.fromString("[Berhasil tersambung ke database Lokal]");

global.opts = yargs(process.argv.slice(2)).exitProcess(false).parse();

global.db = new Low(db);
global.DATABASE = global.db;

global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return new Promise((resolve) => setInterval(function() {
        (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null)
    }, 1 * 1000));
    if (global.db.data !== null) return;

    global.db.READ = true;
    await global.db.read();
    global.db.READ = false;

    global.db.data = {
        users: {},
        chats: {},
        database: {},
        game: {},
        settings: {},
        others: {},
        sticker: {},
        ...(global.db.data || {})
    };

    global.db.chain = _.chain(global.db.data);
};

global.loadDatabase();

if (global.db) setInterval(async () => {
    if (global.db.data) await global.db.write()
}, 30 * 1000)

const folderName = "../../tmp";
const folderPath = path.join(__dirname, folderName);
if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    lolcatjs.fromString(`Folder '${folderName}' berhasil dibuat.`);
} else {
    lolcatjs.fromString(`Folder '${folderName}' sudah ada.`);
}

const useMobile = process.argv.includes("--mobile")
const usePairingCode = true
const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(text, resolve)
    })
};

async function start() {
    const fluxx = await newSockets(start, options);
    if (usePairingCode && !fluxx.authState.creds.registered) {
        const phoneNumber = await question('Masukan Nomer Yang Aktif Awali Dengan 62 Recode :\n');
        const code = await fluxx.requestPairingCode(phoneNumber.trim())
        lolcatjs.fromString(`Pairing code: ${code}`)
    }
}

start();
