# dripsama

Automatically request KSMA from faucet.

## Usage

Store GitHub credentials one per line in `~/.dripsama/credentials.txt`
in `<username>:<token>` format. Be sure to give `public_repo` access to token.

`./getdrip.sh [ADDR1 [ADDR2 ...]]` for optional addresses corresponding to line
numbers in the credentials file.

Also can read pregenerated addresses from `~/.dripsama/pregen.txt`, one per line.

If no addresses are provided, invokes `subkey` to find vanity address containing
`ksma`. Requires `subkey` v2.x.x in `PATH`. Resulting private keys are saved in
`~/.dripsama/secrets.txt`.

If `at` is installed, `getdrip.sh` schedules itself to run again in about 24 hours.

## Utils

* `util/install-subkey.sh`: installs `rust` and `subkey` if not already in `PATH`.

## References

* <https://github.com/kusamanetwork/faucet>
* <https://substrate.dev/docs/en/ecosystem/subkey>
* <http://getsubstrate.io/>
* <https://polkadot.js.org/apps/#/accounts>
