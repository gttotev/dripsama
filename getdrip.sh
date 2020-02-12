#!/bin/bash

prefix="$HOME/.dripsama"
[ ! -d $prefix ] && mkdir $prefix

credentials_file="$prefix/credentials.txt"
[ ! -f $credentials_file ] && { echo GitHub credentials expected in $credentials_file!; exit 1; }
pregen_file="$prefix/pregen.txt"
secrets_file="$prefix/secrets.txt"
subkey_cmd="subkey -n kusama vanity --number 1 ksma"

argv=1
for cred in $(cat $credentials_file); do
    address=${!argv}

    if [ -s $pregen_file -a -z "$address" ]; then
        address=$(head -n 1 $pregen_file)
        tail -n +2 $pregen_file > $pregen_file.tmp && mv $pregen_file.tmp $pregen_file
    fi

    if [ -z "$address" ]; then
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
    ((++argv))
done

which at &> /dev/null && echo $0 | at tomorrow + 1 minute
