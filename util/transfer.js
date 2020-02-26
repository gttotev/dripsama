#!/usr/bin/env node
if (process.argv.length < 4) {
    console.error('usage: ./tranfer.js <addr> <key_file>');
    process.exit(50);
}

const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');

const KUSAMA_ENDPOINT = 'wss://kusama-rpc.polkadot.io/';
const TRANSFER_FEE = 2e10;
//const TRANSFER_TIMEOUT_MS = 10000;
const TRANSFER_TIMEOUT_MS = 1000;
const COLLECTOR_ADDR = process.argv[2];
const KEY_FILE = process.argv[3];

async function main() {
    // Initialise the provider to connect to the local node
    const provider = new WsProvider(KUSAMA_ENDPOINT);
    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });
    const keyring = new Keyring({ type: 'sr25519' });

    const transferAll = async function(fromPair, toAddress) {
        let amount = parseInt(await api.query.balances.freeBalance(fromPair.address)) - TRANSFER_FEE;
        if (amount <= 0) throw new Error('Insufficient funds!');
        return api.tx.balances.transfer(toAddress, amount).signAndSend(fromPair);
    }

    // Retrieve the chain & node information information via rpc calls
    const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
    ]);
    console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

    let timeout = TRANSFER_TIMEOUT_MS;
    const secrets = require('fs').readFileSync(KEY_FILE, 'utf8').split('\n');
    for (const addr of secrets) {
        if (addr.length < 64) continue;
        try {
            let pair = null;
            if (addr.startsWith('{')) {
                const tok = addr.split(' ');
                pair = keyring.addFromJson(JSON.parse(tok[0]));
                pair.decodePkcs8(tok[1]);
            } else pair = keyring.addFromUri(addr);
            setTimeout(() => {
                transferAll(pair, COLLECTOR_ADDR)
                    .then(txHash => console.log(`${pair.address}: Submitted tx ${txHash.toHuman()}`))
                    .catch(err => console.error(`${pair.address}: Error processing tx:`, err.message));
            }, timeout);
            timeout += TRANSFER_TIMEOUT_MS;
        } catch (err) {
            console.error(`${addr}: Error creating keypair:`, err.message);
        }
    }
    setTimeout(() => process.exit(0), timeout);
}

main().catch(err => {
    console.error('Error from main!', err);
    process.exit(100);
});
