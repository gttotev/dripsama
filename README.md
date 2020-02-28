# dripsama

Automatically request KSMA from faucet.

## Usage

Store GitHub credentials one per line in `~/.dripsama/credentials.txt`
in `<username>:<token>` format. Be sure to give `public_repo` access to token.

`./getdrip.sh`

Can read pregenerated addresses from `~/.dripsama/pregen.txt`, one per line.

If no addresses are provided, invokes `subkey` to find vanity address containing
`ksma`. Requires `subkey` v2.x.x in `PATH`. Resulting private keys are saved in
`~/.dripsama/secrets.txt`.

If `at` is installed, `getdrip.sh` schedules itself to run again in about 24 hours.

If Node.js is installed and `~/.dripsama/collector.txt` contains an address, will
send all earned KSMA, minus fees, to that address. These transactions are logged
in `~/.dripsama/transfer_txns.txt`. Private keys are migrated to
`~./dripsama/secrets.txt.old`.

## Utils

* `util/install-subkey.sh`: installs `rust` and `subkey` if not already in `PATH`.
* `util/transfer.js`: usage: `./tranfer.js <addr> <key_file>`.
  Transfers all KSMA, minus fees, from accounts in `key_file` to given address.
  Accounts may be specified in raw seed format, or as encrypted JSON. In the
  latter case, the password for decryption must be given, separated by a space on
  the same line as the stringified JSON.

## References

* <https://github.com/kusamanetwork/faucet>
* <https://substrate.dev/docs/en/ecosystem/subkey>
* <http://getsubstrate.io/>
* <https://polkadot.js.org/apps/#/accounts>
