#!/usr/bin/env node
if (process.argv.length < 4) {
    console.error('usage: ./tranfer.js <addr> <key_file>');
    process.exit(50);
}

const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const readline = require('readline'), fs = require('fs');

const KUSAMA_ENDPOINT = 'wss://kusama-rpc.polkadot.io/';
const ONE_KSMA = 1e12;
const TRANSFER_FEE = parseFloat(process.env.XFER_FEE || 0.02) * ONE_KSMA;
const TRANSFER_TIMEOUT_MS = parseInt(process.env.XFER_TIMEOUT || 5) * 1000;
const COLLECTOR_ADDR = process.argv[2];
const KEY_FILE = process.argv[3];

const now = _ => new Date().toISOString();
const readLines = (file) => new Promise((resolve, reject) => {
    const rl = readline.createInterface({
        input: fs.createReadStream(file).on('error', reject)
    });
    var buffer = [];
    rl.on('line', l => buffer.push(l));
    rl.on('close', _ => resolve(buffer));
});

async function main() {
    // Initialise the provider to connect to the local node
    const provider = new WsProvider(KUSAMA_ENDPOINT);
    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });
    const keyring = new Keyring({ type: 'sr25519' });

    const transferAll = async function(fromPair, toAddress) {
        let amount = parseInt(await api.query.balances.freeBalance(fromPair.address)) - TRANSFER_FEE;
        if (amount <= 0) throw new Error('Insufficient funds!');
        return {
            txHash: await api.tx.balances.transfer(toAddress, amount).signAndSend(fromPair),
            amount: amount,
            now: now()
        };
    }

    // Retrieve the chain & node information information via rpc calls
    const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
    ]);
    console.log(`${now()} Connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

    let timeout = TRANSFER_TIMEOUT_MS;
    for (const addr of await readLines(KEY_FILE)) {
        try {
            let pair = null;
            if (addr.startsWith('{')) {
                const tok = addr.split(' ');
                pair = keyring.addFromJson(JSON.parse(tok[0]));
                pair.decodePkcs8(tok[1]);
            } else if (addr.startsWith('0x')) {
                pair = keyring.addFromUri(addr);
            } else {
                throw new Error('Invalid secret type!');
            }
            setTimeout(() => {
                transferAll(pair, COLLECTOR_ADDR)
                    .then(res => console.log(`${res.now} tx ${res.txHash.toHuman()}`
                        + ` :: ${addr} --> ${COLLECTOR_ADDR} KSMA ${res.amount / ONE_KSMA}`))
                    .catch(err => console.error(`${now()} Error processing tx for ${addr}:`,
                        err.message));
            }, timeout);
            timeout += TRANSFER_TIMEOUT_MS;
        } catch (err) {
            console.error(`${now()} Error creating keypair for ${addr}:`, err.message);
        }
    }
    setTimeout(() => process.exit(0), timeout);
}

main().catch(err => {
    console.error('Error from main!\n', err);
    process.exit(100);
});
