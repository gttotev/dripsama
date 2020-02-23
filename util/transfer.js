#!/usr/bin/env node
if (process.argv.length < 4) {
    console.error('usage: ./tranfer.js <addr> <key_file>');
    process.exit(150);
}

//const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');

const KUSAMA_ENDPOINT = 'wss://kusama-rpc.polkadot.io/';
const TRANSFER_FEE = 2e10;
//const TRANSFER_TIMEOUT_MS = 10000;
const TRANSFER_TIMEOUT_MS = 1000;
const COLLECTOR_ADDR = process.argv[2];
const KEY_FILE = process.argv[3];

const keyFileReader = require('readline').createInterface({
    input: require('fs').createReadStream(KEY_FILE).on('error', err => {
        console.error(`Error opening ${KEY_FILE}:`, err);
        process.exit(err.errno);
    })
});
let timeout = TRANSFER_TIMEOUT_MS;
keyFileReader.on('line', function(addr) {
    //const pair = keyring.addFromUri(addr);
    setTimeout(() => {
        console.log(addr);
    }, timeout);
    timeout += TRANSFER_TIMEOUT_MS;
});

async function main() {
    // Initialise the provider to connect to the local node
    const provider = new WsProvider(KUSAMA_ENDPOINT);
    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });
    const keyring = new Keyring({ type: 'sr25519' });

    const transferAll = async function(fromPair, toAddress) {
        let amount = parseInt(await api.query.balances.freeBalance(fromPair.address)) - TRANSFER_FEE;
        if (amount <= 0) return false;
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
    keyFileReader.on('line', function(addr) {
        //const pair = keyring.addFromUri(addr);
        setTimeout(() => {
            console.log(addr);
        }, timeout);
        timeout += TRANSFER_TIMEOUT_MS;
    });
}

//main().catch(console.error).finally(() => process.exit());
