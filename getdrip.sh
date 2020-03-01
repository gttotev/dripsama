#!/bin/bash

prefix="$HOME/.dripsama"
[ ! -d $prefix ] && mkdir $prefix

credentials_file="$prefix/credentials.txt"
[ ! -s $credentials_file ] && { echo GitHub credentials expected in $credentials_file!; exit 1; }
pregen_file="$prefix/pregen.txt"
secrets_file="$prefix/secrets.txt"
collector_file="$prefix/collector.txt"
at_file="$prefix/atno.txt"
txns_file="$prefix/transfer_txns.txt"
subkey_cmd="subkey -n kusama vanity --number 1 ksma"

for cred in $(cat $credentials_file); do
    if [ -s $pregen_file ]; then
        address=$(head -n 1 $pregen_file)
        tail -n +2 $pregen_file > $pregen_file.tmp && mv $pregen_file.tmp $pregen_file
    else
        tmp_file=`mktemp`
        which subkey &> /dev/null || { echo "Install subkey (and put on PATH)!"; exit 1; }
        $subkey_cmd | tail -n 4 > $tmp_file

        address=$(grep 'SS58 Address' $tmp_file | sed 's/^.*:\s*//')
        grep 'Secret seed' $tmp_file | sed 's/^.*:\s*//' >> $secrets_file

        rm $tmp_file
    fi

    rjson="{\"title\":\"dripsama @ $(date)\",\"body\":\"$address\"}"
    curl -u $cred https://api.github.com/repos/kusamanetwork/faucet/issues -d "$rjson"
    [ $? -ne 0 ] && echo $address >> $pregen_file
done

if which at &> /dev/null; then # schedule for tomorrow
    [ -s $at_file ] && atrm $(head -n 1 $at_file) &> /dev/null
    echo $BASH_SOURCE | at 'tomorrow + 1 minute' 2>&1 | tail -n 1 | awk '{print $2}' > $at_file
fi

if which npm &> /dev/null && [ -s $collector_file -a -s $secrets_file ]; then # invoke transfer.js
    address=$(head -n 1 $collector_file)
    pushd "${BASH_SOURCE%/*}/util"
    [ package.json -nt node_modules ] && { npm install; touch node_modules; }
    XFER_TIMEOUT=30 ./transfer.js $address $secrets_file 2>&1 | tee -a $txns_file
    [ $PIPESTATUS -eq 0 ] && cat $secrets_file >> "$secrets_file.old" && rm $secrets_file
    popd
fi
